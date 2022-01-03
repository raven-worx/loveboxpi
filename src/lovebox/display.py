import io
import importlib
import glob
import imp
import os
import traceback
import time
from PIL import Image,ImageDraw,ImageFont
from . import config

class Display:
	INFO = {
		'valid': False,
		'name': '',
		'width': 0,
		'height': 0,
		'rotation': 0,
		'effectiveWidth': 0,
		'effectiveHeight': 0,
		'availableTypes': []
	}
	
	def __init__(self):
		self.valid = False
		self.availableTypes = []
		self.name = ""
		self.rotation = 0
		self.width = 0
		self.height = 0
		self.effectiveWidth = 0
		self.effectiveHeight = 0
		self._initInfo()
	
	def _EPD(self, init=True, printError=False):
		try:
			mod = importlib.import_module('waveshare_epd.'+self.name)
			epd = mod.EPD()
			if init:
				epd.init()
		except Exception:
			if printError:
				traceback.print_exc()
			return None
		return epd
	
	def _initInfo(self):
		isfile, path, desc = imp.find_module('waveshare_epd')
		if isfile is None:
			for f in glob.glob(path+'/*.py'):
				m = os.path.splitext(os.path.basename(f))[0]
				if m not in ['__init__','epdconfig']:
					self.availableTypes.append(m)
		
		self.name = config.readSetting('display','type')
		
		rot = int(config.readSetting('display','rotation'))
		rot = (round(rot/90.0)*90.0) % 360 # round to nearest multiple of 90 and bound to [0,360]
		self.rotation = int(rot)
		
		if epd := self._EPD(False,True):
			self.width = epd.width
			self.height = epd.height
			if self.rotation == 90 or self.rotation == 270:
				self.effectiveWidth = self.height
				self.effectiveHeight = self.width
			else:
				self.effectiveWidth = self.width
				self.effectiveHeight = self.height
		
		self.INFO['valid'] = self.valid
		self.INFO['availableTypes'] = self.availableTypes
		self.INFO['name'] = self.name
		self.INFO['rotation'] = self.rotation
		self.INFO['width'] = self.width
		self.INFO['height'] = self.height
		self.INFO['effectiveWidth'] = self.effectiveWidth
		self.INFO['effectiveHeight'] = self.effectiveHeight
		return True
	
	def _removeAlpha(self, img, bg_color = (255,255,255)):
		if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
			alpha = img.convert('RGBA').split()[-1]
			bg = Image.new('RGBA', img.size, bg_color+(255,))
			bg.paste(img, mask=alpha)
			return bg
		else:
			return img
	
	def clear(self):
		if epd := self._EPD():
			epd.Clear();
			#epd.display(epd.getbuffer( Image.new('1', (epd.width,epd.height), 255) ))
			epd.sleep()
			return True
		return False

	def writeImage(self,imageData):
		if epd := self._EPD():
			image = Image.open(io.BytesIO(imageData))
			image = self._removeAlpha(image)
			if self.rotation == 90:
				image = image.transpose(Image.ROTATE_90)
			elif self.rotation == 180:
				image = image.transpose(Image.ROTATE_180)
			elif self.rotation == 270:
				image = image.transpose(Image.ROTATE_270)
			epd.display(epd.getbuffer(image))
			epd.sleep()
			return True
		return False
	
	def writeText(self, text, fontsize=(12,20), alignment='left'):
		if epd := self._EPD():
			image = Image.new('1', (self.effectiveWidth,self.effectiveHeight), 255)
			draw = ImageDraw.Draw(image)
			
			if self.effectiveHeight >= self.effectiveWidth:
				fs = fontsize[0]
			else:
				fs = fontsize[1]
			
			defaultFontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf' # '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
			if os.path.isfile(defaultFontPath):
				f = ImageFont.truetype(defaultFontPath, fs)
			else:
				f = ImageFont.load_default()
			
			(w, h) = draw.textsize(text,f)
			x = (self.effectiveWidth - w) / 2
			y = (self.effectiveHeight - h) / 2
			draw.text((x,y), text, font = f, fill = 0, align=alignment)
			epd.display(epd.getbuffer(image))
			epd.sleep()
			return True
		return False
