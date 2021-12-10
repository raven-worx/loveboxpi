import json
import configparser
import copy
from ast import literal_eval

_UserConfigFilePath = "/etc/lovebox/lovebox.conf"

_DefaultUserSettings = {
	"led": {
		"enabled": 1,
		"color": "#ff0000"
	}
}

def readUserSettingsJSON():
	js = copy.deepcopy(_DefaultUserSettings)
	
	config = configparser.ConfigParser()
	config.read(_UserConfigFilePath)
	
	for section in config.sections():
		if section in js:
			for (key, val) in config.items(section):
				js[section][key] = val
	
	return json.dumps(js)

def writeUserSettingsJSON(js):
	config = configparser.ConfigParser()
	config.read(_UserConfigFilePath)
	
	jsonObj = json.loads(js)
	for s in jsonObj:
		if s in _DefaultUserSettings:
			for k in jsonObj[s]:
				if k in _DefaultUserSettings[s]:
					v = jsonObj[s][k]
					config.set(s, k, v)
	
	with open(_UserConfigFilePath, 'w') as f:
		config.write(f)


_DConfigFilePath = "/etc/lovebox/loveboxd.conf"

_DefaultDSettings = {
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
		"b": 0
	}
}

def readSetting(group, key):
	config = configparser.ConfigParser()
	config.read(_DConfigFilePath)
	
	for section in config.sections():
		if section == group:
			for (k, v) in config.items(section):
				if key == k:
					return v
	
	return None
