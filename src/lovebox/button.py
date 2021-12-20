import re
import threading
import RPi.GPIO as GPIO
from . import config
from . import controller

class ButtonThread(threading.Thread):
	def __init__(self, *args, **kwargs):
		super(ButtonThread, self).__init__(*args, **kwargs)
		self._stopEv = threading.Event()
	
	def stop(self):
		self._stopEv.set()
	
	def stopped(self):
		return self._stopEv.isSet()
	
	def run(self):
		idx = self._kwargs['idx']
		pin = self._kwargs['pin']
		callback = self._kwargs['callback']
		state = False # prevent calling the callback multiple times while holding the button
	
		while not self.stopped():
			if self._stopEv.wait(0.2): # 200ms bounce time
				break
			# seems the waveshare driver messes with the GPIOs when updating the display, so we have to setup the pin again
			GPIO.setmode(GPIO.BCM)
			GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
			if GPIO.input(pin) == GPIO.LOW: # pressed
				if not state:
					state = True
					callback()
			else:
				state = False
		GPIO.cleanup(pin)

class Button:
	def __init__(self,idx,controller):
		self.idx = idx
		self.btn = None
		self.enabled = False
		self.pin = 0
		self.action = ""
		self.controller = controller
	
	def __del__(self):
		self.cleanup()
	
	def cleanup(self):
		self._close()
		self.controller = None # remove reference otherwise the controller instance would never be deleted
	
	def _create(self):
		if self.btn is not None:
			return
		if self.enabled and self.pin > 0:
			self.btn = ButtonThread(name="ButtonHandler_"+str(self.idx), kwargs={'idx': self.idx, 'pin': self.pin, 'callback': self.button_callback})
			self.btn.gpio = self.pin
			self.btn.start()
	
	def _close(self):
		if self.btn is None:
			return
		self.btn.stop()
		self.btn.join()
		self.btn = None
	
	def gpioStrToValue(self,val):
		return int(re.search('^GPIO(\d+)$', val).group(1))
	
	def settingsUpdated(self):
		key = "button"+str(self.idx)
		
		enabled = config.readSetting(key,"enabled") == "1"
		pin = self.gpioStrToValue( config.readSetting(key,"pin") )
		action = config.readSetting(key,"action")
		
		if self.enabled == enabled and self.pin == pin and self.action == action:
			return
		
		if self.enabled == enabled and self.pin == pin: # only the action changed, no need to change the GPIO setup
			self.action = action
			return
		
		self._close()
		
		self.enabled = enabled
		self.pin = pin
		self.action = action
		
		self._create()
	
	def button_callback(self):
		if not self.enabled or self.controller is None:
			return
		self.controller.execute_action(self.action)
