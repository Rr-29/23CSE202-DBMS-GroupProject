"""
=====================================================================
Course: 23CSE202 Database Management Systems
Project: Aureon - Internet Banking System
Group No: D4 (Amrita School of Computing, Amritapuri Campus)

Team Members:
  1. Mehrin A S     (AM.SC.U4CSE25332) - User Auth, Credentials & Profile
  2. Nithya Ajay     (AM.SC.U4CSE25339) - Accounts & Cards Management
  3. Rudra Rajagopal (AM.SC.U4CSE25344) - Fund Transfers & ACID Transactions
  4. Varun Nair      (AM.SC.U4CSE25356) - Bills, Admin Console & Triggers

Main Flask Server Application
=====================================================================
"""

import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from database.db import db
from backend.routes.auth_routes import auth_bp
from backend.routes.account_routes import account_bp
from backend.routes.transfer_routes import transfer_bp
from backend.routes.admin_bill_routes import admin_bill_bp

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder=ROOT_DIR)
CORS(app)

# Register Module Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(account_bp)
app.register_blueprint(transfer_bp)
app.register_blueprint(admin_bill_bp)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "system": "Aureon Internet Banking System",
        "database": db.db_type,
        "group": "D4 (23CSE202 DBMS)",
        "message": "All database and API services are operational."
    })


# Static File Serving Routes
@app.route('/')
def index():
    return send_from_directory(ROOT_DIR, 'index.html')


@app.route('/<path:path>')
def serve_file(path):
    # Ensure path doesn't escape root
    file_path = os.path.join(ROOT_DIR, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(ROOT_DIR, path)
    
    # Try appending .html
    if os.path.exists(f"{file_path}.html"):
        return send_from_directory(ROOT_DIR, f"{path}.html")

    return jsonify({"error": f"File '{path}' not found."}), 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 70)
    print("           AUREON - INTERNET BANKING SYSTEM (DBMS PROJECT)")
    print("      Course: 23CSE202 DBMS | Amrita School of Computing | Group D4")
    print("=" * 70)
    print(" Team Contributors:")
    print("   [1] Mehrin A S     (AM.SC.U4CSE25332) -> Auth, Profiles & Settings")
    print("   [2] Nithya Ajay     (AM.SC.U4CSE25339) -> Bank Accounts & Cards")
    print("   [3] Rudra Rajagopal (AM.SC.U4CSE25344) -> Transfers & Transactions")
    print("   [4] Varun Nair      (AM.SC.U4CSE25356) -> Bills, Admin & Triggers")
    print("-" * 70)
    print(f" Database Active : {db.db_type.upper()}")
    print(f" Server URL      : http://127.0.0.1:{port}")
    print(f" Admin Portal    : http://127.0.0.1:{port}/admin/dashboard.html")
    print(f" Customer Portal : http://127.0.0.1:{port}/auth.html")
    print("=" * 70)
    app.run(host='0.0.0.0', port=port, debug=True)
