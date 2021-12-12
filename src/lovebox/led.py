from gpiozero import RGBLED
from colormap import rgb2hex,hex2rgb
from . import config

_LED = None

def _hexToRGBTuple(hex):
	tup = hex2rgb(hex)
	return tuple((tup[0]/255.0, tup[1]/255.0, tup[2]/255.0))

def init():
	r = config.readSetting("led","r")
	g = config.readSetting("led","g")
	b = config.readSetting("led","b")
	_LED = RGBLED(r,g,b)
	return True

def on():
	if _LED is None:
		return False
	colorHex = config.readSetting("led","color")
	color = _hexToRGBTuple(colorHex)
	_LED.pulse(fade_in_time=2, fade_out_time=2, on_color=color, off_color=(0,0,0), n=None, background=True)
	return True

def off():
	if _LED is None:
		return False
	_LED.off()
	return True
