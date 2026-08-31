#!/usr/bin/env python3
"""Snowman site preview server — serves fred/snowman/site with no-cache headers
so Cloudflare never serves stale assets (python http.server sends no Cache-Control,
and Cloudflare was caching JS/CSS for 4h)."""
import http.server
import functools

ROOT = "/Users/deonvandenberg/.openclaw/workspace/fred/snowman/site"
PORT = 8097

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # quiet

if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler).serve_forever()
