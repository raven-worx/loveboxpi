import subprocess
import platform
import requests
import os
import traceback
import json

class Cloud:
	_REMOTEIT_PATH="/usr/local/bin/remoteit"
	
	def __init__(self):
		self.installed = os.path.isfile(self._REMOTEIT_PATH)
		self.loggedin = False
		self.device_registered = False
		self.service_registered = False
		self.INFO = {
			'status': {
				'installed': self.installed,
				'loggedin': self.loggedin,
				'device_registered': self.device_registered,
				'service_registered': self.service_registered
			},
			'data': {
				'username': '',
				'device_id': '',
				'device_name': '',
				'service_id': ''
			}
		}
		self.update()
	
	def execute(self,data):
		if not self.installed:
			return False
		cmd = data['cmd'].lower()
		params = data['params']
		if cmd == 'install':
			res = self.downloadAndInstall()
		elif cmd == 'login':
			res = self.signIn(params['username'], params['password'])
		elif cmd == 'logout':
			res = self.signOut()
		elif cmd == 'register_device':
			res = self.registerDevice(params['name'])
		elif cmd == 'unregister_device':
			res = self.unregisterDevice()
		
		if res:
			self.update()
		
		return res
	
	def _available(self):
		return self.installed and self.loggedin
	
	def _exec(self, args=[]):
		#subprocess.CompletedProcess
		return subprocess.run([self._REMOTEIT_PATH]+args, shell=False, capture_output=True, text=True)
	
	def update(self):
		if not self.installed:
			return False
		
		ret,out = self.status()
		if not ret:
			return False
		
		js = json.loads(out)
		
		username = js['data']['username']
		self.loggedin = bool(username)
		self.INFO['status']['loggedin'] = self.loggedin
		self.INFO['data']['username'] = username
		
		devid = js['data']['device']['id']
		devname = js['data']['device']['name']
		self.device_registered = bool(devid)
		self.INFO['status']['device_registered'] = self.device_registered
		self.INFO['data']['device_id'] = devid
		self.INFO['data']['device_name'] = devname
		
		return True
	
	def downloadAndInstall(self):
		if self.installed:
			return False
		try:
			m = platform.uname().machine
			if m.startswith('armv5'):
				url = 'https://downloads.remote.it/cli/latest/remoteit_linux_armv5'
			elif m.startswith('armv6'):
				url = 'https://downloads.remote.it/cli/latest/remoteit_linux_armv6'
			elif m.startswith('armv7'):
				url = 'https://downloads.remote.it/cli/latest/remoteit_linux_armv7'
			elif m.startswith('armv8') or m.startswith('arm64'):
				url = 'https://downloads.remote.it/cli/latest/remoteit_linux_arm64'
			else:
				return False
			
			r = requests.get(url, allow_redirects=True)
			open(self._REMOTEIT_PATH, 'wb').write(r.content)
			os.chmod(self._REMOTEIT_PATH, 0o755)
			
			res = self._exec(["agent","install"])
			res.check_returncode()
		except Exception:
			traceback.print_exc(file=sys.stdout)
			return False
		return True
	
	def status(self):
		if self.installed:
			res = self._exec(["status","--json"])
			if res.returncode != 0:
				return False
			return True, res.stdout
		return False
	
	def signIn(self, username, password):
		if not self.installed or self.loggedin:
			print("1::", False)
			return False
		if not(bool(username) and bool(password)):
			print("2::", False)
			return False
		res = self._exec(["signin","--user", username, "--pass", password])
		print("3::", res)
		return res.returncode == 0
	
	def signOut(self):
		if not self.installed or not self.loggedin:
			return False
		res = self._exec(["signout"])
		return res.returncode == 0
	
	def registerDevice(self,name):
		if not self._available() or self.device_registered:
			return False
		res = self._exec(["register","--name", name])
		return res.returncode == 0
	
	def unregisterDevice(self):
		if not self._available() or not self.device_registered:
			return False
		res = self._exec(["unregister","--yes"])
		return res.returncode == 0
	
"""
remoteit add --name "loveboxpi" --port <service port> --type HTTP
remoteit remove --id <service id>

remoteit modify --id <service id> --enable <boolean> --port <port> --type HTTP
"""