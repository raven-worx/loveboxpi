import RPi.GPIO as GPIO
import threading
import re
from colormap import rgb2hex,hex2rgb
from itertools import chain, repeat, cycle
from . import config

class LedThread(threading.Thread):
	def __init__(self, *args, **kwargs):
		super(LedThread, self).__init__(*args, **kwargs)
		self._stopEv = threading.Event()
	
	def stop(self):
		self._stopEv.set()
	
	def stopped(self):
		return self._stopEv.isSet()
	
	# based on the implementation from gpiozero
	def _blink_led(self, leds, on_time, off_time, fade_in_time, fade_out_time, on_color, off_color, n, fps=25):
		lerp = lambda t, fade_in: tuple(
			(1 - t) * off + t * on
			if fade_in else
			(1 - t) * on + t * off
			for off, on in zip(off_color, on_color)
		)
		sequence = []
		if fade_in_time > 0:
			sequence += [
				(lerp(i * (1 / fps) / fade_in_time, True), 1 / fps)
				for i in range(int(fps * fade_in_time))
			]
		sequence.append((on_color, on_time))
		if fade_out_time > 0:
			sequence += [
				(lerp(i * (1 / fps) / fade_out_time, False), 1 / fps)
				for i in range(int(fps * fade_out_time))
				]
		sequence.append((off_color, off_time))
		sequence = (
			cycle(sequence) if n is None else
			chain.from_iterable(repeat(sequence, n))
		)
		
		for l in leds:
			l.start(0)
		for value, delay in sequence:
			for l, v in zip(leds, value):
				l.ChangeDutyCycle(100*v)
			if self._stopEv.wait(delay):
				break
		for l in leds:
			l.stop()
	
	def run(self):
		GPIO.setmode(GPIO.BCM)
		
		hz = 75
		leds = self._kwargs['leds']
		color = self._kwargs['color']
		loops = self._kwargs['loops']
		
		GPIO.setup(leds[0], GPIO.OUT)
		r = GPIO.PWM(leds[0], hz)
		
		GPIO.setup(leds[1], GPIO.OUT)
		g = GPIO.PWM(leds[1], hz)
		
		GPIO.setup(leds[2], GPIO.OUT)
		b = GPIO.PWM(leds[2], hz)
		
		self._blink_led([r,g,b], on_time=1, off_time=1, fade_in_time=1, fade_out_time=1, on_color=color, off_color=(0,0,0), n=loops, fps=25)
		
		GPIO.cleanup(leds[0])
		GPIO.cleanup(leds[1])
		GPIO.cleanup(leds[2])

class Led:
	def __init__(self):
		self.led = None
	
	def __del__(self):
		self.cleanup()
	
	def cleanup(self):
		self.off()
	
	def settingsUpdated(self):
		self.enabled = config.readSetting("led","enabled") == "1"
	
	def gpioStrToValue(self,val):
		return int(re.search('^GPIO(\d+)$', val).group(1))
	
	def on(self,loops=None):
		if self.led is not None:
			return
		
		pin_r = config.readSetting("led","pin_r")
		pin_g = config.readSetting("led","pin_g")
		pin_b = config.readSetting("led","pin_b")
		leds = [
			self.gpioStrToValue(pin_r),
			self.gpioStrToValue(pin_g),
			self.gpioStrToValue(pin_b)
		]
		
		colorHex = config.readSetting("led","color")
		tup = hex2rgb(colorHex)
		color = tuple((tup[0]/255.0, tup[1]/255.0, tup[2]/255.0))
		
		self.led = LedThread(name="LEDHandler", kwargs={'leds': leds, 'color': color, 'loops': loops})
		self.led.start()
		
		if bool(loops):
			self.led.join() # wait util finished
	
	def off(self):
		if self.led is None:
			return
		self.led.stop()
		self.led.join()
		self.led = None
