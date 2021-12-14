import io
import importlib
import glob
import imp
import os
import traceback
from PIL import Image,ImageDraw,ImageFont
from . import config

_EPD = None

Info = {
	"name": "",
	"width": 0,
	"height": 0,
	"rotation": 0,
	"effectiveWidth": 0,
	"effectiveHeight": 0,
	"available": []
}

def init():
	try:
		isfile, path, desc = imp.find_module("waveshare_epd")
		if isfile is None:
			for f in glob.glob(path+"/*.py"):
				m = os.path.splitext(os.path.basename(f))[0]
				if m not in ["__init__","epdconfig"]:
					Info["available"].append(m)
		
		name = config.readSetting("display","type")
		Info["name"] = name
		
		rot = int(config.readSetting("display","rotation"))
		rot = (round(rot/90.0)*90.0) % 360 # round to nearest multiple of 90 and bound to [0,360]
		Info["rotation"] = int(rot)
		
		mod = importlib.import_module('waveshare_epd.'+name)
		epd = mod.EPD()
		_EPD = epd
		
		epd.init()
		epd.Clear(0xFF)
		
		Info["width"] = epd.width
		Info["height"] = epd.height
		
		if rot == 90 or rot == 270:
			Info["effectiveWidth"] = epd.height
			Info["effectiveHeight"] = epd.width
		else:
			Info["effectiveWidth"] = epd.width
			Info["effectiveHeight"] = epd.height
		
		return True
	except Exception:
		traceback.print_exc()
	
	return False

def clear():
	if _EPD is None:
		return False
	_EPD.Clear();
	return True

def writeImage(imageData):
	if _EPD is None:
		return False
	
	image = Image.open(io.BytesIO(imageData))
	
	rot = Info["rotate"]
	if rot == 90:
		image = image.transpose(Image.ROTATE_90)
	elif rot == 180:
		image = image.transpose(Image.ROTATE_180)
	elif rot == 270:
		image = image.transpose(Image.ROTATE_270)
	
	_EPD.display(_EPD.getbuffer(image))
	_EPD.sleep() # ????
	return True

def writeText(text):
	if _EPD is None:
		return False
	image = Image.new('1', (Info["effectiveWidth"],Info["effectiveHeight"]), 255)  # 255: clear the frame
	draw = ImageDraw.Draw(image)
	
	draw.text((10,10), text, font = ImageFont.load_default(), fill = 0)
	_EPD.display(_EPD.getbuffer(image))
	_EPD.sleep() # ????
	return True