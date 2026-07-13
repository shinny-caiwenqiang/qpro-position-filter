import json
import os
import sys
import threading
import urllib.error
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


LOCAL_PAGE = "http://127.0.0.1:8812/"
QPRO_ORIGIN = "http://127.0.0.1:8811"
PAGE_FILE = os.path.join(getattr(sys, "_MEIPASS", os.path.dirname(__file__)), "index.html")


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        self.handle_request()

    def do_POST(self):
        self.handle_request()

    def handle_request(self):
        if self.path == "/" and self.command == "GET":
            with open(PAGE_FILE, "rb") as page:
                content = page.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        if not self.path.startswith("/api/"):
            self.send_error(404)
            return

        try:
            content = None
            if self.command == "POST":
                content = self.rfile.read(int(self.headers.get("Content-Length", "0")))
            request = urllib.request.Request(
                QPRO_ORIGIN + self.path[4:],
                data=content,
                method=self.command,
                headers={"Content-Type": self.headers.get("Content-Type", "application/json")},
            )
            with urllib.request.urlopen(request, timeout=8) as upstream:
                payload = upstream.read()
                self.send_response(upstream.status)
                self.send_header("Content-Type", upstream.headers.get_content_type() + "; charset=utf-8")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except urllib.error.HTTPError as error:
            payload = error.read()
            self.send_response(error.code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as error:
            payload = json.dumps({"ok": False, "error": str(error)}).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

    def log_message(self, format, *args):
        return


def main():
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 8812), Handler)
    except OSError:
        webbrowser.open(LOCAL_PAGE)
        return
    threading.Timer(0.25, lambda: webbrowser.open(LOCAL_PAGE)).start()
    server.serve_forever()


if __name__ == "__main__":
    main()
