import io
import os
import base64
from . import config
from . import display

_RT_DIR=os.getenv("RUNTIME_DIRECTORY", "/tmp")
_IMAGE_PATH=_RT_DIR+"/image"
_ACTIVE_PATH=_RT_DIR+"/active"

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
	
	display.write(imageData)
	
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
	# TODO: check if state is present, if not clear display
	return True

def test():
	# TODO: initiate test
	#time.sleep(5)
	#restoreState()
	return True
