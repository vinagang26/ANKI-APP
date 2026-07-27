import os
import sys
import subprocess

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    
    # Check pywebview availability
    try:
        import webview
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pywebview", "--quiet"])
    
    # Launch main app
    import main
    main.main()
