import io
import os
import base64
import socket
import json
import time
import threading
import datetime
from . import config
from . import display
from . import led
from . import cloud
from . import button

_MUTEX = threading.Lock()

class MutexLocker:
	def __init__(self,name=''):
		self.name=name
		global _MUTEX
		_MUTEX.acquire()
	
	def __del__(self):
		global _MUTEX
		_MUTEX.release()

class Controller:
	_CACHE_DIR = os.getenv("CACHE_DIRECTORY", "/tmp")
	_IMAGE_PATH = _CACHE_DIR+"/image"
	_ACTIVE_PATH = _CACHE_DIR+"/active"
	_READ_TIMESTAMP_PATH = _CACHE_DIR+"/read"
	_BUTTON_COUNT = 4
	VERSION="0.0.0"
	
	def __init__(self,version='0.0.0'):
		self.VERSION = version
		self.active_message = self._readActiveState()
		self.led = led.Led()
		self.cloud = cloud.Cloud()
		self.buttons = []
		for i in range(1,self._BUTTON_COUNT+1):
			b = button.Button(i,self)
			self.buttons.append(b)
		self.update()
	
	def __del__(self):
		pass
	
	def cleanup(self):
		self.led.cleanup()
		self.cloud.cleanup()
		for b in self.buttons:
			b.cleanup()
		self.buttons.clear()
	
	def _readActiveState(self):
		if os.path.isfile(self._ACTIVE_PATH):
			f = open(self._ACTIVE_PATH, "r")
			state = f.readline().strip()
			f.close()
			return state.startswith("0") == False
		else:
			return False
	
	def _writeActiveState(self,active):
		if self.active_message == active:
			return
		f = open(self._ACTIVE_PATH, "w")
		f.write("1\n" if active else "0\n")
		f.close()
		self.active_message = active
	
	def _readReadTimestamp(self):
		if os.path.isfile(self._READ_TIMESTAMP_PATH):
			f = open(self._READ_TIMESTAMP_PATH, "r")
			ts = f.readline().strip()
			f.close()
			return ts
		else:
			return ""
	
	def _writeReadTimestamp(self,clear=False):
		f = open(self._READ_TIMESTAMP_PATH, "w")
		ts = ""
		if not clear:
			ts = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()
		f.write(ts+"\n")
		f.close()
	
	def _readActiveImage(self):
		img = bytes()
		if os.path.isfile(self._IMAGE_PATH):
			f = open(self._IMAGE_PATH, "rb")
			img = f.read()
			f.close()
		return img
	
	def _writeActiveImage(self,img=bytes()):
		f = open(self._IMAGE_PATH, "wb")
		f.write(img)
		f.close()
	
	def _clearState(self):
		self.led.off()
		display.clear()
		self._writeActiveState(active=False)
	
	def _restoreState(self):
		# DO NOT USE MutexLocker in this method -> deadlock
		if self.active_message:
			imageData = self._readActiveImage()
			if imageData:
				self.led.off()
				display.writeImage(imageData)
				if self.led.enabled:
					self.led.on()
			else:
				self._clearState()
		else:
			self._clearState()
		
		return True
	
	def update(self):
		m = MutexLocker()
		
		display.updateInfo()
		self.led.settingsUpdated()
		for b in self.buttons:
			b.settingsUpdated()
		self._restoreState()
	
	def setMessage(self,imageData64):
		m = MutexLocker()
		imageData = base64.b64decode(imageData64)
		self._writeActiveImage(imageData)
		self._writeActiveState(active=True)
		self._writeReadTimestamp(clear=True)
		self.led.off()
		display.writeImage(imageData)
		if self.led.enabled:
			self.led.on()
		return True
	
	def showLastMessage(self):
		m = MutexLocker()
		if self.active_message:
			return False
		imageData = self._readActiveImage()
		if imageData:
			display.writeImage(imageData)
		else:
			display.writeText("No message\nto show", fontsize=(15,25), alignment='center')
		time.sleep(2)
		self._restoreState()
		return True
	
	def clearMessage(self):
		m = MutexLocker()
		self._clearState()
		self._writeReadTimestamp(clear=True) # clear timestamp
		self._writeActiveImage() # clear image cache
		return True
	
	def markMessageRead(self):
		m = MutexLocker()
		if self.active_message:
			self._clearState()
			self._writeReadTimestamp() # write current timestamp
		return True
	
	def test(self):
		m = MutexLocker()
		self.led.off()
		display.writeText("TEST", fontsize=(30,40))
		if self.led.enabled:
			self.led.on(3) # 3 rounds of pulsating (-> blocking)
		self._restoreState()
		return True
	
	def showNetInfo(self):
		m = MutexLocker()
		self.led.off()
		hostname = socket.gethostname()
		local_ip = (([ip for ip in socket.gethostbyname_ex(socket.gethostname())[2] if not ip.startswith("127.")] or [[(s.connect(("8.8.8.8", 53)), s.getsockname()[0], s.close()) for s in [socket.socket(socket.AF_INET, socket.SOCK_DGRAM)]][0][1]]) + ["---"])[0]
		display.writeText(
			"Hostname:\n " + hostname + "\nIP:\n " + local_ip,
			fontsize=(12,20)
		)
		time.sleep(1)
		self._restoreState()
		return True
	
	def getInfoJSON(self):
		m = MutexLocker()
		
		js = {
			"version": self.VERSION,
			"display": display.INFO,
			"cloud": self.cloud.INFO
		}
		return json.dumps(js)
	
	def getLastMessageInfoJSON(self):
		m = MutexLocker()
		
		imageDataUrl = ""
		imageData = self._readActiveImage()
		if imageData:
			imageDataUrl = "data:image/png;base64," + base64.b64encode(imageData).decode("utf-8")
		
		js = {
			"active": self.active_message,
			"readTimestamp": self._readReadTimestamp(),
			"imageUrl": imageDataUrl
		}
		return json.dumps(js)
	
	def execute_action(self,action):
		# DO NOT USE MutexLocker in this method -> deadlock
		# each called method should have a MutexLocker though
		act = action.lower()
		if act == "readmsg":
			self.markMessageRead()
		elif act == "netinfo":
			self.showNetInfo()
		elif act == "lastmsg":
			self.showLastMessage()
		elif act == "clearmsg":
			self.clearMessage()
		else:
			#raise ValueError("execute_action(): Unknown action",action)
			print("execute_action(): Unknown action",action)
