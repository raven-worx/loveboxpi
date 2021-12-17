from gpiozero import RGBLED
from colormap import rgb2hex,hex2rgb
from . import config

class Led:
	def __init__(self):
		self.led = None
		self.update()
	
	def update(self):
		if self.led is not None:
			self.led.off()
			self.led.close()
		
		self.enabled = config.readSetting("led","enabled") == "1"
		self.color = config.readSetting("led","color")
		
		led_pin_r = config.readSetting("led","pin_r")
		led_pin_g = config.readSetting("led","pin_g")
		led_pin_b = config.readSetting("led","pin_b")
		self.led = RGBLED(led_pin_r,led_pin_g,led_pin_b)
	
	def on(self,loops=None):
		if self.led is not None:
			tup = hex2rgb(self.color)
			c = tuple((tup[0]/255.0, tup[1]/255.0, tup[2]/255.0))
			if loops is None:
				bg = True
			else:
				bg = False
			self.led.pulse(fade_in_time=1, fade_out_time=1, on_color=c, off_color=(0,0,0), n=loops, background=bg)
	
	def off(self):
		if self.led is not None:
			self.led.off()
