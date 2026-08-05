import functools
import json
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import webview


class StorageApi:
    def __init__(self, data_dir):
        self.data_file = os.path.join(data_dir, 'cards.json')
        os.makedirs(data_dir, exist_ok=True)

    def load_cards(self):
        if not os.path.exists(self.data_file):
            return {}
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if data is not None else {}
        except Exception as e:
            print("Error loading cards from file:", e)
            return {}

    def save_cards(self, cards):
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(cards, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print("Error saving cards to file:", e)
            return False

    def export_deck(self, filename, content):
        try:
            save_path = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename=filename,
                file_types=('JSON Files (*.json)', 'All Files (*.*)')
            )
            if save_path:
                if isinstance(save_path, (list, tuple)):
                    save_path = save_path[0]
                if save_path:
                    with open(save_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    return True
        except Exception as e:
            print("Error exporting deck:", e)
        return False


def resolve_web_dir(base_dir):
    # If running as PyInstaller executable, check live project directory & working directory first
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(os.path.abspath(sys.executable))
        cwd_dir = os.getcwd()
        
        candidates = [
            os.path.join(cwd_dir, 'web'),
            os.path.join(exe_dir, 'web'),
            os.path.join(os.path.dirname(exe_dir), 'web')
        ]
        
        for candidate in candidates:
            if os.path.exists(os.path.join(candidate, 'index.html')):
                return candidate

    web_dir = os.path.join(base_dir, 'web')
    if os.path.exists(os.path.join(web_dir, 'index.html')):
        return web_dir

    fallback_html = os.path.join(base_dir, 'index_3.html')
    if os.path.exists(fallback_html):
        return base_dir

    raise FileNotFoundError(f"Could not find HTML entry point in {base_dir}")


def start_local_web_server(web_dir):
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            return

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            super().end_headers()

    handler = functools.partial(QuietHandler, directory=web_dir)
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread


def build_entry_url(base_dir):
    web_dir = resolve_web_dir(base_dir)
    server, _ = start_local_web_server(web_dir)
    host, port = server.server_address
    return f'http://{host}:{port}/index.html', server


def main():
    if getattr(sys, 'frozen', False):
        base_dir = sys._MEIPASS
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))

    try:
        entry_url, server = build_entry_url(base_dir)
    except FileNotFoundError as exc:
        print(f"Error: {exc}")
        sys.exit(1)

    app_data = os.environ.get('APPDATA', os.path.expanduser('~'))
    storage_dir = os.path.join(app_data, 'ChineseAnki')
    api = StorageApi(storage_dir)

    window = webview.create_window(
        title='Chinese Vocab - Liquid Glass Anki App',
        url=entry_url,
        width=1050,
        height=780,
        resizable=True,
        min_size=(600, 500),
        background_color='#0f172a',
        js_api=api
    )

    try:
        webview.start(private_mode=False, storage_path=storage_dir, debug=False)
    finally:
        server.shutdown()
        server.server_close()

if __name__ == '__main__':
    main()
