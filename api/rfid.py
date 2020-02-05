import struct
import array
import collections
import logging

class RfidProtocol(object):
	# RFID protocol source/destination port
	RFID_PORT = 0xF0B8

	# Message types
	MSG_NOTIFICATION = 0x01

	# Notification types
	NOTIF_TAG_UPDATE = 0x01

	# Message classes
	Msg = collections.namedtuple('Rfid_Msg', ['msgId', 'type', 'payload'])
	Notif = collections.namedtuple('Rfid_Notif', ['type', 'payload'])
	TagUpdateNotif = collections.namedtuple('Rfid_TagUpdateNotif', ['itemSize', 'itemCount', 'items'])

	# Is the port the RFID protocol port
	def isRfidPort(self, port):
		return port == RfidProtocol.RFID_PORT
	
	# Decodes an RFID packet, returns None if not a valid RFID packet
	def decodePacket(self, name, params):
		if not self.isRfidPort(params.dstPort):
			return None
		
		data = params.data

		# Not large enough for RFID notification
		if len(data) < 3:
			return None

		msgId = data[0]
		msgType = data[1]
		notifType = data[2]

		if msgType != RfidProtocol.MSG_NOTIFICATION:
			return None

		if notifType == RfidProtocol.NOTIF_TAG_UPDATE:
			itemSize = data[3]
			itemCount = data[4]

			binData = array.array('B', data)
			items = []
			for i in range(0, itemCount):
				item = struct.unpack_from('>{0}B'.format(itemSize), binData, offset=(5+(i*itemSize)))
				items.append(item)
			
			tagUpdateNotif = RfidProtocol.TagUpdateNotif(itemSize, itemCount, items)

			notif = RfidProtocol.Notif(notifType, tagUpdateNotif)
			msg = RfidProtocol.Msg(msgId, msgType, notif)
			
			return msg
		
		return None
