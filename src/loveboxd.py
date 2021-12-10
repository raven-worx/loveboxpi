#!/usr/bin/env python3

from http.server import SimpleHTTPRequestHandler, HTTPServer
import argparse
import re
import cgi
import json
import threading
import os
import mimetypes
import urllib
import base64
import lovebox.config


class HTTPRequestHandler(SimpleHTTPRequestHandler):
	def do_POST(self):
		if re.search('/api/v1/config', self.path):
			ctype = cgi.parse_header(self.headers.get('content-type'))
			if ctype == 'application/json':
				length = int(self.headers.get('content-length'))
				rfile_str = self.rfile.read(length).decode('utf8')
				data = urllib.parse.parse_qs(rfile_str, keep_blank_values=1)
				
				lovebox.config.writeUserSettingsJSON(json)
				
				# HTTP 200: ok
				self.send_response(200)
			else:
				# HTTP 400: bad request
				self.send_response(400, "Bad Request: must give data")
		elif re.search('/api/v1/display', self.path):
			ctype = cgi.parse_header(self.headers.get('content-type'))
			if ctype[0].startswith('application/x-www-form-urlencoded'):
				formdata = cgi.FieldStorage(
					fp=self.rfile,
					headers=self.headers,
					environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': self.headers['Content-Type']}
				)
				
				imagedata = base64.b64decode( formdata["image"].value )
				
				self.send_response(200)
			else:
				# HTTP 400: bad request
				self.send_response(400, "Bad Request: unexpected content type")
		else:
			# HTTP 403: forbidden
			self.send_response(403)
		
		self.end_headers()

	def do_GET(self):
		if re.search('/api/v1/config', self.path):
			self.send_response(200)
			self.send_header('Content-Type', 'application/json')
			self.end_headers()
			data = lovebox.config.readUserSettingsJSON()
			self.wfile.write( data.encode('utf8') )
		else:
			super().do_GET() # let SimpleHTTPRequestHandler serve the files 


def main():
	host = lovebox.config.readSetting("www","host")
	port = int(lovebox.config.readSetting("www","port"))
	
	os.chdir( os.path.abspath(os.path.dirname(__file__)) + '/www' )
	
	server = HTTPServer((host, port), HTTPRequestHandler)
	print('Lovebox HTTP Server running on ' + host + ':' + str(port))
	server.serve_forever()


if __name__ == '__main__':
	main()
