import struct
import array
import collections
import logging

# SmartMesh types
UtcTime = collections.namedtuple('UtcTime', ['seconds', 'microseconds'])

class Rfid(object):
	# RFID protocol source/destination port
	RFID_PORT = 0xF0B8

	# Message types
	MSG_NOTIFICATION = 0x01

	# Notification types
	NOTIF_EPC_UPDATE = 0x01

	# Message classes
	Msg = collections.namedtuple('Rfid_Msg', ['seqNo', 'type', 'payload'])
	Notif = collections.namedtuple('Rfid_Notif', ['type', 'payload'])
	EpcUpdateNotif = collections.namedtuple('Rfid_EpcUpdateNotif', ['timestamp', 'epcSize', 'numEpcs', 'epcs'])

	# Is the port the RFID protocol port
	def isRfidPort(self, port):
		return port == Rfid.RFID_PORT
	
	# Decodes an RFID packet, returns None if not a valid RFID packet
	def decodePacket(self, name, params):
		if not self.isRfidPort(params.srcPort) or not self.isRfidPort(params.dstPort):
			return None
		
		data = params.data

		# Not large enough for RFID notification
		if len(data) < 4:
			return None

		seqNo = data[1]
		msgType = data[2]
		notifType = data[3]

		if msgType != Rfid.MSG_NOTIFICATION:
			return None

		if notifType == Rfid.NOTIF_EPC_UPDATE:
			binData = array.array('B', data)
			envelope = struct.unpack_from('>IIBB', binData, offset=4)
			epcSize = envelope[2]
			numEpcs = envelope[3]

			epcs = []
			for i in range(0, numEpcs):
				epcs.append(struct.unpack_from('>{0}B'.format(epcSize), binData, offset=(14+(i*epcSize))))
			
			
			ts = UtcTime(envelope[0], envelope[1])
			epcUpdateNotif = Rfid.EpcUpdateNotif(ts, epcSize, numEpcs, epcs)

			notif = Rfid.Notif(notifType, epcUpdateNotif)
			msg = Rfid.Msg(seqNo, msgType, notif)
			
			return msg
		
		return None
