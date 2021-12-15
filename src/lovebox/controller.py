import io
import os
import base64
import socket
import json
import time
from . import config
from . import display

VERSION="0.0.0"

_RUN_DIR = os.getenv("RUNTIME_DIRECTORY", "/tmp")
_IMAGE_PATH = _RUN_DIR+"/image"
_ACTIVE_PATH = _RUN_DIR+"/active"

def init():
	display.init()
	#led.init()
	#button.init()
	restoreState()

def setMessage(imageData64):
	imageData = base64.b64decode(imageData64)
	
	f = open(_IMAGE_PATH, "wb")
	f.write(imageData)
	f.close()
	
	display.writeImage(imageData)
	
	#TODO: set LED
	
	f = open(_ACTIVE_PATH, "w")
	f.write("1\n")
	f.close()
	
	return True

def clearMessage():
	display.clear()
	
	#TODO: clear LED
	
	f = open(_ACTIVE_PATH, "w")
	f.write("0\n")
	f.close()
	
	return True

def restoreState():
	if os.path.isfile(_ACTIVE_PATH):
		f = open(_ACTIVE_PATH, "r")
		state = f.readline()
		f.close()
	else:
		state = "0"
	
	
	if state.startswith("1") and os.path.isfile(_IMAGE_PATH):
		f = open(_IMAGE_PATH, "rb")
		imageData = f.read()
		f.close()
		
		display.writeImage(imageData)
		# TODO: restore LED
	
	return True

def test():
	display.writeText("TEST")
	
	# TODO: test LED
	
	#time.sleep(5)
	#restoreState()
	return True

def showHostInfo():
	hostname = socket.gethostname()
	local_ip = socket.gethostbyname(hostname)
	
	
	display.writeText(hostname + "\n" + local_ip)
	
	#time.sleep(5)
	#restoreState()
	return True

def getInfoJSON():
	js = {
		"version": VERSION,
		"display": display.INFO
	}
	return json.dumps(js)
