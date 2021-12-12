import traceback
import json
import configparser
import copy
from ast import literal_eval

_ConfigFilePath = "/etc/lovebox/lovebox.conf"

_DefaultSettings = {
	"www": {
		"host": "0.0.0.0",
		"port": 8080
	},
	"display": {
		"type": "epd2in7",
		"rotate": 270
	},
	"button": {
		"pin": 0
	},
	"led": {
		"r": 0,
		"g": 0,
		"b": 0,
		"enabled": 1,
		"color": "#ff0000"
	}
}

def readSettingsJSON():
	js = copy.deepcopy(_DefaultSettings)
	
	config = configparser.ConfigParser()
	config.read(_ConfigFilePath)
	
	for section in config.sections():
		if section in js:
			for (key, val) in config.items(section):
				js[section][key] = val
	
	return json.dumps(js)

def writeSettingsJSON(js):
	try:
		config = configparser.ConfigParser()
		config.read(_ConfigFilePath)
		
		jsonObj = json.loads(js)
		for s in jsonObj:
			if s in _DefaultSettings:
				for k in jsonObj[s]:
					if k in _DefaultSettings[s]:
						v = jsonObj[s][k]
						config.set(s, k, str(v))
		
		with open(_ConfigFilePath, 'w') as f:
			config.write(f)
		
		return True
	except Exception:
		traceback.print_exc()
	return False

def readSetting(group, key):
	config = configparser.ConfigParser()
	config.read(_ConfigFilePath)
	
	for section in config.sections():
		if section == group:
			for (k, v) in config.items(section):
				if key == k:
					return v
	
	return None

