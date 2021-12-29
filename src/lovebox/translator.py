import os
import glob
import base64
import json
from functools import reduce
from . import config

class Translator:
	_TRANSLATIONS_PATH = os.path.normpath(os.path.abspath(os.path.dirname(__file__))+'/../translations')
	
	INFO = {
		'available': False,
		'lang': '',
		'availableTranslations': [],
		'translationData': {}
	}
	
	def __init__(self):
		self.available = False
		self.lang = ''
		self.availableTranslations = []
		self.translationData = {}
		for f in glob.glob(self._TRANSLATIONS_PATH+'/*'):
			if os.path.isfile(f):
				t = os.path.splitext(os.path.basename(f))[0]
				self.availableTranslations.append(t)
		self.INFO['availableTranslations'] = self.availableTranslations
		
		self.update()
	
	def __del__(self):
		pass
	
	def update(self):
		l = config.readSetting("general","lang")
		if l == self.lang:
			return
		res, content, lang = self.loadTranslation(l)
		self.lang = lang
		self.available = res
		self.translationData = content
		self.INFO['lang'] = self.lang
		self.INFO['available'] = self.available
		self.INFO['translationData'] = self.translationData if self.available else {}
	
	def settingsUpdated(self):
		self.update()
	
	def tr(self, key, fallback=''):
		k = key.split('.')
		t = reduce(lambda obj,k: obj[k] if obj and k in obj else '', k, self.translationData)
		if isinstance(t, str):
			return t
		else:
			print('No translation found for key:', key)
			return fallback
	
	def loadTranslation(self, lang):
		res, content = self._getTranslationData(lang)
		if res:
			return res, content, lang
		res, content = self._getTranslationData('en')
		if res:
			return res, content, 'en'
		else:
			return res, content, ''
	
	def _getTranslationData(self,lang):
		res = False
		content = {}
		path = self._TRANSLATIONS_PATH+'/'+lang
		if os.path.isfile(path):
			f = open(path, "r")
			try:
				content = json.load(f)
				res = True
			except json.JSONDecodeError as e:
				res = False
				print("Translation parse error:", e.msg, "[line", e.lineno, ", pos", e.colno,"]", path)
			finally:
				f.close()
		return res, content

