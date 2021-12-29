import traceback
import json
import configparser
import copy

_ConfigFilePath = "/etc/loveboxpi/loveboxpi.conf"

_DefaultSettings = {
	"general": {
		"lang": "en"
	},
	"www": {
		"host": "0.0.0.0",
		"port": 80
	},
	"display": {
		"type": "epd2in7",
		"rotation": 90
	},
	"button1": {
		"enabled": 1,
		"pin": "GPIO5",
		"action": "read"
	},
	"button2": {
		"enabled": 1,
		"pin": "GPIO6",
		"action": "hostinfo"
	},
	"button3": {
		"enabled": 1,
		"pin": "GPIO13",
		"action": "lastmsg"
	},
	"button4": {
		"enabled": 0,
		"pin": "GPIO19",
		"action": ""
	},
	"led": {
		"enabled": 1,
		"color": "#ff0000",
		"pin_r": "GPIO16",
		"pin_g": "GPIO20",
		"pin_b": "GPIO21"
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
	except Exception:
		traceback.print_exc()
		return False
	return True

def readSetting(group, key):
	config = configparser.ConfigParser()
	config.read(_ConfigFilePath)
	
	for section in config.sections():
		if section == group:
			for (k, v) in config.items(section):
				if key == k:
					return v
	
	return None
