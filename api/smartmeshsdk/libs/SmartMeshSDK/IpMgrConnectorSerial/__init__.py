try:
   import IpMgrConnectorSerialClib
   IpMgrConnectorSerial = IpMgrConnectorSerialClib
   print('Note: using the C implementation of the IpMgrConnectorSerial connector')
except ImportError:
   import IpMgrConnectorSerial
