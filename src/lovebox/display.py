import io
import importlib
import glob
import imp
import os
import traceback
import time
from PIL import Image,ImageDraw,ImageFont
from . import config

INFO = {
	"name": "",
	"width": 0,
	"height": 0,
	"rotation": 0,
	"effectiveWidth": 0,
	"effectiveHeight": 0,
	"available": []
}

def _EPD(init=True, printError=False):
	try:
		name = config.readSetting("display","type")
		mod = importlib.import_module('waveshare_epd.'+name)
		epd = mod.EPD()
		if init:
			epd.init()
	except Exception:
		if printError:
			traceback.print_exc()
		return None
	return epd

def updateInfo():
	global INFO
	
	isfile, path, desc = imp.find_module("waveshare_epd")
	if isfile is None:
		for f in glob.glob(path+"/*.py"):
			m = os.path.splitext(os.path.basename(f))[0]
			if m not in ["__init__","epdconfig"]:
				INFO["available"].append(m)
	
	name = config.readSetting("display","type")
	INFO["name"] = name
	
	rot = int(config.readSetting("display","rotation"))
	rot = (round(rot/90.0)*90.0) % 360 # round to nearest multiple of 90 and bound to [0,360]
	INFO["rotation"] = int(rot)
	
	if epd := _EPD(False,True):
		INFO["width"] = epd.width
		INFO["height"] = epd.height
		if rot == 90 or rot == 270:
			INFO["effectiveWidth"] = epd.height
			INFO["effectiveHeight"] = epd.width
		else:
			INFO["effectiveWidth"] = epd.width
			INFO["effectiveHeight"] = epd.height
	else:
		INFO["width"] = 0
		INFO["height"] = 0
		INFO["effectiveWidth"] = 0
		INFO["effectiveHeight"] = 0
	
	return True

def clear():
	if epd := _EPD():
		epd.Clear();
		#image = Image.new('1', (epd.width,epd.height), 255)
		#epd.display(epd.getbuffer(image))
		epd.sleep()
		return True
	return False

def writeImage(imageData):
	if epd := _EPD():
		image = Image.open(io.BytesIO(imageData))
		
		rot = INFO["rotation"]
		if rot == 90:
			image = image.transpose(Image.ROTATE_90)
		elif rot == 180:
			image = image.transpose(Image.ROTATE_180)
		elif rot == 270:
			image = image.transpose(Image.ROTATE_270)
		
		epd.display(epd.getbuffer(image))
		epd.sleep()
		return True
	return False

def writeText(text, fontsize=(12,20), alignment='left'):
	if epd := _EPD():
		effectiveWidth = INFO["effectiveWidth"]
		effectiveHeight = INFO["effectiveHeight"]
		
		image = Image.new('1', (effectiveWidth,effectiveHeight), 255)  # 255: clear the frame
		draw = ImageDraw.Draw(image)
		
		if effectiveHeight >= effectiveWidth:
			fs = fontsize[0]
		else:
			fs = fontsize[1]
		
		defaultFontPath = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf" # '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
		if os.path.isfile(defaultFontPath):
			f = ImageFont.truetype(defaultFontPath, fs)
		else:
			f = ImageFont.load_default()
		
		(width, height) = draw.textsize(text,f)
		x = (effectiveWidth - width) / 2
		y = (effectiveHeight - height) / 2
		draw.text((x,y), text, font = f, fill = 0, align=alignment)
		epd.display(epd.getbuffer(image))
		epd.sleep()
		return True
	return False
