import os
import sys
import webview

def main():
    if getattr(sys, 'frozen', False):
        base_dir = sys._MEIPASS
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))

    web_dir = os.path.join(base_dir, 'web')
    html_path = os.path.join(web_dir, 'index.html')

    if not os.path.exists(html_path):
        print(f"Error: Could not find HTML entry point at {html_path}")
        sys.exit(1)

    window = webview.create_window(
        title='Chinese Vocab - Liquid Glass Anki App',
        url=f'file:///{html_path.replace("\\", "/")}',
        width=1050,
        height=780,
        resizable=True,
        min_size=(600, 500),
        background_color='#0f172a'
    )

    webview.start(debug=False)

if __name__ == '__main__':
    main()
