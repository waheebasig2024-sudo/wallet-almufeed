#!/usr/bin/env python3
import http.server
import socketserver
import os

class ZipHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/wallet-almufeed.zip' or self.path == '/':
            zip_path = '/home/runner/workspace/wallet-almufeed.zip'
            if os.path.exists(zip_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/zip')
                self.send_header('Content-Disposition', 'attachment; filename="wallet-almufeed.zip"')
                self.send_header('Content-Length', str(os.path.getsize(zip_path)))
                self.end_headers()
                with open(zip_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(301)
            self.send_header('Location', '/wallet-almufeed.zip')
            self.end_headers()
    def log_message(self, format, *args):
        pass

PORT = 8000
with socketserver.TCPServer(("0.0.0.0", PORT), ZipHandler) as httpd:
    httpd.serve_forever()
