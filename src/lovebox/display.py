import io
import importlib
import traceback
from PIL import Image,ImageDraw,ImageFont
from . import config

_EPD = None

Info = {
	"name": "",
	"width": 0,
	"height": 0,
	"rotate": 0
}

def _getImageSizeByRotation():
	if _EPD is None:
		return tuple((0,0))
	rot = Info["rotate"]
	if rot == 90 or rot == 270:
		return tuple((_EPD.height,_EPD.width))
	else:
		return tuple((_EPD.width,_EPD.height))

def init():
	try:
		name = config.readSetting("display","type")
		mod = importlib.import_module('waveshare_epd.'+name)
		epd = mod.EPD()
		_EPD = epd
		
		epd.init()
		epd.Clear(0xFF)
		
		Info["name"] = name
		Info["width"] = epd.width
		Info["height"] = epd.height
		
		rot = int(config.readSetting("display","rotate"))
		rot = (round(rot/90)*90) % 360 # round to nearest multiple of 90 and bound to [0,360]
		Info["rotate"] = rot
		
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
	image = Image.new('1', _getImageSizeByRotation(), 255)  # 255: clear the frame
	draw = ImageDraw.Draw(image)
	
	draw.text((10,10), text, font = ImageFont.load_default(), fill = 0)
	_EPD.display(_EPD.getbuffer(image))
	#_EPD.sleep() # ????
	return True