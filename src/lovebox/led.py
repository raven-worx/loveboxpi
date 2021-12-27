from gpiozero import RGBLED as GPIOLED
from colormap import rgb2hex,hex2rgb
from . import config

class Led:
	def __init__(self):
		self.led = None
	
	def __del__(self):
		self.cleanup()
	
	def cleanup(self):
		self.off()
	
	def settingsUpdated(self):
		self.enabled = config.readSetting("led","enabled") == "1"
	
	def on(self,loops=None):
		if self.led is not None:
			return
		
		pin_r = config.readSetting("led","pin_r")
		pin_g = config.readSetting("led","pin_g")
		pin_b = config.readSetting("led","pin_b")
		
		colorHex = config.readSetting("led","color")
		tup = hex2rgb(colorHex)
		color = tuple((tup[0]/255.0, tup[1]/255.0, tup[2]/255.0))
		
		self.led = GPIOLED(pin_r, pin_g, pin_b, active_high=True) # active_high: True for cathode RGB LED, False for anode RGB LED; make this configurable?
		
		bg = True if loops is None else False
		self.led.pulse(fade_in_time=1, fade_out_time=1, on_color=color, off_color=(0,0,0), n=loops, background=bg)
	
	def off(self):
		if self.led is None:
			return
		self.led.off()
		self.led.close()
		self.led = None
