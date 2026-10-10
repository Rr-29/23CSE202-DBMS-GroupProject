"""
=====================================================================
Course: 23CSE202 Database Management Systems
Project: Aureon - Internet Banking System
Group No: D4 (Amrita School of Computing, Amritapuri Campus)

Team Members:
  1. Mehrin A S     (AM.SC.U4CSE25332) - User Auth & Profiles Module
  2. Nithya Ajay     (AM.SC.U4CSE25339) - Accounts & Cards Module
  3. Rudra Rajagopal (AM.SC.U4CSE25344) - Transfers & Ledger Module
  4. Varun Nair      (AM.SC.U4CSE25356) - Bills & Admin Console Module

One-Click Project Launcher & System Verifier
=====================================================================
"""

import sys
import os
import webbrowser
import threading
import time

# Ensure project root is in python path
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)

# Auto-check and install dependencies if running on a new machine
required_modules = ['flask', 'flask_cors', 'pymysql', 'cryptography']
missing_modules = []
for mod in required_modules:
    try:
        __import__(mod)
    except ImportError:
        pkg_name = 'flask-cors' if mod == 'flask_cors' else mod
        missing_modules.append(pkg_name)

if missing_modules:
    import subprocess
    print("*" * 75)
    print(f"[*] First-time setup detected: Installing missing packages ({', '.join(missing_modules)})...")
    print("[*] Please wait a moment while pip installs requirements...")
    print("*" * 75)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", *missing_modules, "--quiet"])
        print("[+] Packages installed successfully! Starting server...\n")
    except Exception as e:
        print(f"[-] Could not auto-install packages: {e}")
        print("Please run manually in terminal: pip install -r requirements.txt\n")

from app import app
from database.db import db

def open_browser():
    time.sleep(1.2)
    url = "http://127.0.0.1:5000"
    print(f"\n[Launcher] Opening Aureon Digital Banking Portal in browser: {url}\n")
    webbrowser.open(url)

if __name__ == '__main__':
    print("*" * 75)
    print("        AUREON DIGITAL BANKING SYSTEM - PHASE 2 (DBMS)")
    print("   Course: 23CSE202 Database Management Systems | Group D4")
    print("   Institution: Amrita School of Computing, Amritapuri Campus")
    print("*" * 75)
    print(" Project Contributors & Module Distribution:")
    print("   [1] Mehrin A S     (AM.SC.U4CSE25332) -> Authentication, Profile & Settings")
    print("   [2] Nithya Ajay     (AM.SC.U4CSE25339) -> Bank Accounts & Cards Management")
    print("   [3] Rudra Rajagopal (AM.SC.U4CSE25344) -> Fund Transfers & ACID Transactions")
    print("   [4] Varun Nair      (AM.SC.U4CSE25356) -> Utility Bills, Admin Console & Triggers")
    print("-" * 75)
    print(f" Database Engine  : {db.db_type.upper()} (ACID compliant with automatic triggers)")
    print(f" Web Server       : Flask RESTful Engine on http://127.0.0.1:5000")
    print("-" * 75)
    print(" Default Login Accounts:")
    print("   - Customer Portal : user@aureon.com    / User@123")
    print("   - Admin Console   : admin@aureon.com   / Admin@123")
    print("   - Teammate Demo 1 : mehrin@aureon.com  / User@123")
    print("   - Teammate Demo 2 : nithya@aureon.com  / User@123")
    print("   - Teammate Demo 3 : rudra@aureon.com   / User@123")
    print("   - Teammate Demo 4 : varun@aureon.com   / User@123")
    print("*" * 75)

    threading.Thread(target=open_browser, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, debug=False)
