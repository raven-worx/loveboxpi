#!/usr/bin/env python3

from http.server import SimpleHTTPRequestHandler, HTTPServer
import re
import cgi
import json
import threading
import os
import mimetypes
import urllib
import lovebox.config
import lovebox.controller

class HTTPRequestHandler(SimpleHTTPRequestHandler):
	def do_POST(self):
		if re.search('/api/v1/settings', self.path):
			ctype = cgi.parse_header(self.headers.get('content-type'))
			if ctype[0] == 'application/json':
				length = int(self.headers.get('content-length'))
				data = self.rfile.read(length).decode('utf8')
				
				if lovebox.config.writeSettingsJSON(data):
					self.send_response(200)
				else:
					self.send_response(500)
			else:
				self.send_response(400, "Bad Request: no data provided")
		elif re.search('/api/v1/display', self.path):
			ctype = cgi.parse_header(self.headers.get('content-type'))
			if ctype[0].startswith('application/x-www-form-urlencoded'):
				formdata = cgi.FieldStorage(
					fp=self.rfile,
					headers=self.headers,
					environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': self.headers['Content-Type']}
				)
				
				imageData64 = formdata["image"].value
				lovebox.controller.setMessage( imageData64 )
				
				self.send_response(200)
			else:
				self.send_response(400, "Bad Request: unexpected content type")
		else:
			self.send_response(403)
		
		self.end_headers()
	
	def do_GET(self):
		if re.search('/api/v1/settings', self.path):
			self.send_response(200)
			self.send_header('Content-Type', 'application/json')
			self.end_headers()
			data = lovebox.config.readSettingsJSON()
			self.wfile.write( data.encode('utf8') )
		else:
			super().do_GET() # let SimpleHTTPRequestHandler serve the files 
	
	def do_DELETE(self):
		if re.search('/api/v1/display', self.path):
			lovebox.controller.clearMessage()
			self.send_response(200)
		else:
			self.send_response(403)
		self.end_headers()

def main():
	lovebox.controller.init()
	
	host = lovebox.config.readSetting("www","host")
	port = int(lovebox.config.readSetting("www","port"))
	
	os.chdir( os.path.abspath(os.path.dirname(__file__)) + '/www' )
	
	server = HTTPServer((host, port), HTTPRequestHandler)
	print('Lovebox HTTP Server running on ' + host + ':' + str(port))
	server.serve_forever()


if __name__ == '__main__':
	main()
