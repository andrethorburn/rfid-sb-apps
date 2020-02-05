import sys
import os
import argparse
import signal
import json
import datetime
import traceback
from pprint import pprint

# Replace Python core threads with eventlet friendly versions
# NOTE: This is so websocket messages can be emitted from background
#				threads without issue
import eventlet
eventlet.monkey_patch()

# Flask imports
from flask import Flask, render_template, request, send_from_directory
from flask_socketio import SocketIO
from flask_cors import CORS

# Determine path to SmartMeshSDK libs
if __name__ == "__main__":
		here = sys.path[0]
		sys.path.insert(0, os.path.join(here, 'smartmeshsdk', 'libs'))
		sys.path.insert(0, os.path.join(here, 'smartmeshsdk', 'external_libs'))

# SmartMesh SDK imports
from SmartMeshSDK.IpMgrConnectorSerial import IpMgrConnectorSerial
from SmartMeshSDK.IpMgrConnectorMux import IpMgrSubscribe
from SmartMeshSDK.ApiException import APIError, ConnectionError, CommandTimeoutError

# RFID protocol imports
from rfid import RfidProtocol

# Create flask app
app = Flask(__name__, static_url_path='/static_assets')
#app.config["DEBUG"] = True
app.config['SECRET_KEY'] = 'secret'

# Add unrestrictive CORS headers
CORS(app)

# Attach SocketIO to app
socketio = SocketIO(app, async_mode='eventlet',  cors_allowed_origins="*")

# Keep track of RFID message id
lastRfidMsgId = -1

# RFID SmartMesh message parser
rfidProto = RfidProtocol()

# Keep track of WebSocket clients
clients = []

# Selected frontend
frontendName = ''

# Setup SPA route handler
@app.route('/', methods=['GET'])
def home():
	global frontendName
	print app.root_path + '/../frontends/' + frontendName + '/build'
	return send_from_directory(app.root_path + '/../frontends/' + frontendName + '/build', 'index.html', conditional=True)

# Setup frontend assets route handler
@app.route('/<path:filename>')
def frontendRoute(filename):
	global frontendName
	return send_from_directory(app.root_path + '/../frontends/' + frontendName + '/build', filename, conditional=True)

# Keep track of client connections
@socketio.on('connect')
def handle_connect():
    print('Client connected: {0}'.format(request.sid))
    clients.append(request.sid)

# Keep track of client disconnections
@socketio.on('disconnect')
def handle_disconnect():
	print('Client disconnected: {0}'.format(request.sid))
	clients.remove(request.sid)

# Broadcast a message to all clients
def broadcast(name, data):
	print('\nBroadcast: {0}'.format(name))
	pprint(data)

	for clientId in clients:
		socketio.emit(name, data, room=clientId)

# SmartMesh notification handler
def meshNotificationHandler(name, params):
	try:
		global lastRfidMsgId
		global rfidProto

		# Attempt to decode RFID packet
		msg = rfidProto.decodePacket(name, params)
		if msg == None:
			broadcast('mesh.notif', {
				'timestamp': datetime.datetime.utcnow().isoformat() + "Z",
				'macAddress': params.macAddress,
				'name': name,
				'srcPort': params.srcPort,
				'dstPort': params.dstPort,
				'data': params.data,
			})
		else:
			# Check for duplicate message
			if lastRfidMsgId == msg.msgId:
				print('Duplicate RFID message received, discarding')
				return
			lastRfidMsgId = msg.msgId

			# Check message payload is an RFID notification
			if not type(msg.payload) is RfidProtocol.Notif:
				print('Unknown RFID: {0}'.format(msg))
				return

			# Check notification payload is a Tag Update
			notif = msg.payload
			if type(notif.payload) is RfidProtocol.TagUpdateNotif:
				tagUpdate = notif.payload
				broadcast('mesh.rfid.tag_update', {
					'timestamp': datetime.datetime.utcnow().isoformat() + "Z",
					'macAddress': params.macAddress,
					'items': tagUpdate.items,
				})
			else:
				print('Unknown RFID Notif: {0}'.format(notif))
	except Exception:
		print(traceback.format_exc())

def main():
	global frontendName

	# Parse CLI arguments
	parser = argparse.ArgumentParser(
		prog='rfid-cli',
		description='RFID command line client'
	)
	parser.add_argument('-p', '--port', help='SmartMesh manager serial port', required=True)
	parser.add_argument('-f', '--frontend', help='The web frontend to display', required=True)
	args = parser.parse_args()

	# Fetch user defined COM port
	port = args.port
	frontendName = args.frontend

	# Create serial connection to manager
	print('Connecting to {0}'.format(port))
	connector = IpMgrConnectorSerial.IpMgrConnectorSerial()
	try:
		connector.connect({ 'port': port })
	except ConnectionError as err:
		print('Could not connect to {0}: {1}'.format(port, err))
		connector.disconnect()
		sys.exit(1)

	# Hook program exits and perform cleanup
	def cleanup(signum, frame):
		# Disconnect the serial connection on exit
		# NOTE: Failure to disconnect the connector will mean the
		#       program will not exit due to still running threads
		print('Disconnecting from {0}...'.format(port))
		connector.disconnect()
		print('Disconnection successful')
		sys.exit(0)	
	signal.signal(signal.SIGINT, cleanup)

	# Create SmartMesh subscriber
	print('Connection successful.')
	print('Subscribing to SmartMesh notifications...')
	subscriber = IpMgrSubscribe.IpMgrSubscribe(connector)
	subscriber.start()
	subscriber.subscribe(
		notifTypes = [ IpMgrSubscribe.IpMgrSubscribe.NOTIFDATA ],
		fun = meshNotificationHandler,
		isRlbl = False,
	)
	
	# Start web server
	print('Running web server: http://127.0.0.1:5000')
	socketio.run(app, host='127.0.0.1', port='5000')

if __name__ == '__main__':
	main()
