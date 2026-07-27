import json
import os
import sys
import webview

class StorageApi:
    def __init__(self, data_dir):
        self.data_file = os.path.join(data_dir, 'cards.json')
        os.makedirs(data_dir, exist_ok=True)

    def load_cards(self):
        if not os.path.exists(self.data_file):
            return []
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print("Error loading cards from file:", e)
            return []

    def save_cards(self, cards):
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(cards, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print("Error saving cards to file:", e)
            return False

def main():
    if getattr(sys, 'frozen', False):
        base_dir = sys._MEIPASS
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))

    web_dir = os.path.join(base_dir, 'web')
    html_path = os.path.join(web_dir, 'index.html')

    if not os.path.exists(html_path):
        html_path = os.path.join(base_dir, 'index_3.html')

    if not os.path.exists(html_path):
        print(f"Error: Could not find HTML entry point at {html_path}")
        sys.exit(1)

    app_data = os.environ.get('APPDATA', os.path.expanduser('~'))
    storage_dir = os.path.join(app_data, 'ChineseAnki')
    api = StorageApi(storage_dir)

    window = webview.create_window(
        title='Chinese Vocab - Liquid Glass Anki App',
        url=f'file:///{html_path.replace("\\", "/")}',
        width=1050,
        height=780,
        resizable=True,
        min_size=(600, 500),
        background_color='#0f172a',
        js_api=api
    )

    webview.start(private_mode=False, storage_path=storage_dir, debug=False)

if __name__ == '__main__':
    main()
