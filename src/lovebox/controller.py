import io
import os
import base64
import socket
import json
import time
from . import config
from . import display
from . import led


class Controller:
	_RUN_DIR = os.getenv("RUNTIME_DIRECTORY", "/tmp")
	_IMAGE_PATH = _RUN_DIR+"/image"
	_ACTIVE_PATH = _RUN_DIR+"/active"
	
	VERSION="0.0.0"
	
	def __init__(self,version='0.0.0'):
		self.VERSION = version
		self.led = led.Led()
		self.update()
	
	def __del__(self):
		if self.led is not None:
			self.led.off()
	
	def update(self):
		display.init()
		
		self.led.update()
		
		#button.init()
		
		self.restoreState()
	
	def setMessage(self,imageData64):
		imageData = base64.b64decode(imageData64)
		
		f = open(self._IMAGE_PATH, "wb")
		f.write(imageData)
		f.close()
		
		display.writeImage(imageData)
		
		if self.led.enabled:
			self.led.on()
		else:
			self.led.off()
		
		f = open(self._ACTIVE_PATH, "w")
		f.write("1\n")
		f.close()
		
		return True
	
	def clearMessage(self):
		display.clear()
		self.led.off()
		
		f = open(self._ACTIVE_PATH, "w")
		f.write("0\n")
		f.close()
		
		return True
	
	def restoreState(self):
		if os.path.isfile(self._ACTIVE_PATH):
			f = open(self._ACTIVE_PATH, "r")
			state = f.readline()
			f.close()
		else:
			state = "0"
		
		if state.startswith("1") and os.path.isfile(self._IMAGE_PATH):
			f = open(self._IMAGE_PATH, "rb")
			imageData = f.read()
			f.close()
			
			display.writeImage(imageData)
			
			if self.led.enabled:
				self.led.on()
			else:
				self.led.off()
		else:
			self.clearMessage()
		
		return True
	
	def test(self):
		display.writeText("TEST")
		
		if self.led.enabled:
			self.led.on(3) # 3 rounds of pulsating (blocking)
		else:
			time.sleep(5)
		
		self.restoreState()
		return True
	
	def showHostInfo(self):
		hostname = socket.gethostname()
		local_ip = socket.gethostbyname(hostname)
		display.writeText(hostname + "\n" + local_ip)
		
		time.sleep(5)
		self.restoreState()
		return True
	
	def getInfoJSON(self):
		js = {
			"version": self.VERSION,
			"display": display.INFO
		}
		return json.dumps(js)
