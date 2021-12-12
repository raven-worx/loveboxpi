import io
import importlib
import traceback
from PIL import Image
from . import config

_EPD = None

Info = {}

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


def write(imageData):
	#image = Image.open(io.BytesIO(imageData))
	# TODO: image = image.transpose(Image.ROTATE_90)
	#_EPD.display(_EPD.getbuffer(Himage))
	#_EPD.sleep() # ????

	return True

def clear():
	#_EPD.Clear();
	return True