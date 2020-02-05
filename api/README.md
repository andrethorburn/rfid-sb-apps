# SmartMesh RFID API

Listens for messages received by a SmartMesh Manager and forwards them to a web frontend via WebSockets.

## Requirements

* Python 2.x

## One-time setup

Install pip dependencies:

```bash
pip install -r requirements.txt
```

## Usage

```bash
# Example COM_PORT for Linux - /dev/ttyUSB3
# Example COM_PORT for Windows - COM3
python api.py -p [COM_PORT] -f [FRONTEND_NAME]
```

Where ```FRONTEND_NAME``` can be one of:

*  ```mesh-viewer```
*  ```stock-demo```

Example: 

```bash
python api.py -p /dev/ttyUSB3 -f mesh-viewer
```

The frontend will be available at ```http://localhost:5000/```
