from gpiozero import Button as GPIOButton
from . import config
from . import controller

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
		if self.enabled and len(self.pin) > 0:
			self.btn = GPIOButton(self.pin)
			self.btn.when_pressed = self.button_callback
	
	def _close(self):
		if self.btn is None:
			return
		self.btn.close()
		self.btn = None
	
	def settingsUpdated(self):
		key = "button"+str(self.idx)
		
		enabled = config.readSetting(key,"enabled") == "1"
		pin = config.readSetting(key,"pin")
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
