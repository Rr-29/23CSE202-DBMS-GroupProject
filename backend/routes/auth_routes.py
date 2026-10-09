"""
=====================================================================
Course: 23CSE202 Database Management Systems
Project: Aureon - Internet Banking System
Group No: D4 (Amrita School of Computing, Amritapuri Campus)

MODULE: User Identity, Authentication, Profile & Settings
CONTRIBUTOR: Mehrin A S (Roll No: AM.SC.U4CSE25332)
Entities Managed: USERS, LOGIN_CREDENTIALS, PROFILES, SETTINGS
=====================================================================
"""

from flask import Blueprint, request, jsonify
from database.db import db, hash_password, verify_password
import datetime
import random

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = (data.get('email') or data.get('username') or '').strip().lower()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({"success": False, "message": "Email/Username and password are required."}), 400

    # 1. Check if logging in as Admin
    admin_sql = "SELECT * FROM admins WHERE (LOWER(email) = %s OR LOWER(username) = %s) AND status = 'Active'"
    admin = db.query_one(admin_sql, (identifier, identifier))
    if admin and verify_password(password, admin['password_hash']):
        # Update last login
        db.execute("UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE admin_id = %s", (admin['admin_id'],))
        db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                      VALUES ('Admin', %s, 'ADMIN_LOGIN_SUCCESS', 'admins', %s, 'Administrator logged in successfully')""",
                   (admin['admin_id'], str(admin['admin_id'])))
        return jsonify({
            "success": True,
            "role": "admin",
            "redirect": "admin/dashboard.html",
            "user": {
                "id": admin['admin_id'],
                "name": admin['name'],
                "email": admin['email'],
                "role": admin['role'],
                "username": admin['username']
            }
        })

    # 2. Check Customer Credentials
    user_sql = """
        SELECT u.user_id, u.full_name, u.email, u.phone_no, u.address, u.user_type,
               l.password_hash, l.status AS login_status, p.occupation, p.preferred_language, p.kyc_status,
               s.theme
        FROM users u
        JOIN login_credentials l ON u.user_id = l.user_id
        LEFT JOIN profiles p ON u.user_id = p.user_id
        LEFT JOIN settings s ON u.user_id = s.user_id
        WHERE (LOWER(u.email) = %s OR LOWER(l.username) = %s)
    """
    user = db.query_one(user_sql, (identifier, identifier))

    if not user:
        return jsonify({"success": False, "message": "Invalid credentials. No registered user found."}), 401

    if user['login_status'] != 'Active':
        return jsonify({"success": False, "message": f"Account is {user['login_status']}. Please contact bank administrator."}), 403

    if not verify_password(password, user['password_hash']):
        db.execute("UPDATE login_credentials SET failed_attempts = failed_attempts + 1 WHERE user_id = %s", (user['user_id'],))
        return jsonify({"success": False, "message": "Incorrect password. Authentication failed."}), 401

    # Login Success - Reset failed attempts & update last_login
    db.execute("UPDATE login_credentials SET failed_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE user_id = %s", (user['user_id'],))
    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('User', %s, 'USER_LOGIN_SUCCESS', 'login_credentials', %s, 'Customer logged in successfully')""",
               (user['user_id'], str(user['user_id'])))

    # Fetch primary account number for convenience
    primary_acc = db.query_one("SELECT account_no, balance FROM accounts WHERE user_id = %s AND status = 'Active' ORDER BY account_no ASC LIMIT 1", (user['user_id'],))

    return jsonify({
        "success": True,
        "role": "customer",
        "redirect": "dashboard.html",
        "user": {
            "id": user['user_id'],
            "name": user['full_name'],
            "email": user['email'],
            "phone": user['phone_no'],
            "address": user['address'],
            "occupation": user.get('occupation', 'Professional'),
            "theme": user.get('theme', 'light'),
            "primary_account": primary_acc['account_no'] if primary_acc else None,
            "balance": primary_acc['balance'] if primary_acc else 0.00
        }
    })


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    """Customer self-registration with automatic account provisioning."""
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    dob = data.get('dob', '2000-01-01')
    gender = data.get('gender', 'Other')
    address = data.get('address', 'New York, USA').strip()

    if not full_name or not email or not password or not phone:
        return jsonify({"success": False, "message": "Full name, email, phone number, and password are required."}), 400

    # Check existing email
    exists = db.query_one("SELECT user_id FROM users WHERE LOWER(email) = %s", (email,))
    if exists:
        return jsonify({"success": False, "message": "An account with this email address already exists."}), 400

    try:
        # 1. Insert into users
        user_id = db.execute("""
            INSERT INTO users (full_name, date_of_birth, gender, email, phone_no, address, user_type)
            VALUES (%s, %s, %s, %s, %s, %s, 'Customer')
        """, (full_name, dob, gender, email, phone, address))

        # 2. Insert into login_credentials
        pwd_hash = hash_password(password)
        db.execute("""
            INSERT INTO login_credentials (user_id, username, password_hash, status)
            VALUES (%s, %s, %s, 'Active')
        """, (user_id, email, pwd_hash))

        # 3. Insert into profiles
        db.execute("""
            INSERT INTO profiles (user_id, profile_picture, occupation, preferred_language, bio, kyc_status)
            VALUES (%s, 'assets/images/profile.png', 'Banking Customer', 'English (US)', 'Aureon Digital Banking User', 'Verified')
        """, (user_id,))

        # 4. Insert into settings
        db.execute("""
            INSERT INTO settings (user_id, theme, language, email_alerts, sms_alerts)
            VALUES (%s, 'light', 'English', 1, 1)
        """, (user_id,))

        # 5. Automatically open a default Savings Account with $1,000 welcome credit
        acc_no = f"AUR100{random.randint(100000, 999999)}"
        initial_balance = 1000.00
        db.execute("""
            INSERT INTO accounts (account_no, user_id, account_type, balance, currency, min_balance, date_opened, status)
            VALUES (%s, %s, 'Savings', %s, 'USD', 100.00, CURRENT_DATE, 'Active')
        """, (acc_no, user_id, initial_balance))

        # Initial credit txn
        ref_id = f"WELCOME{int(datetime.datetime.now().timestamp())}"
        db.execute("""
            INSERT INTO transactions (account_no, transaction_type, amount, balance_after, description, category, status, reference_id)
            VALUES (%s, 'Credit', %s, %s, 'Welcome Bonus Deposit', 'Deposit', 'Completed', %s)
        """, (acc_no, initial_balance, initial_balance, ref_id))

        # Issue virtual debit card
        card_num = f"4532 {random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
        db.execute("""
            INSERT INTO cards (account_no, card_number, card_type, name_on_card, expiry_date, cvv, daily_limit, status, issue_date)
            VALUES (%s, %s, 'Debit', %s, '10/29', '339', 5000.00, 'Active', CURRENT_DATE)
        """, (acc_no, card_num, full_name))

        # Audit Log
        db.execute("""
            INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
            VALUES ('User', %s, 'USER_REGISTERED', 'users', %s, 'New customer onboarded successfully')
        """, (user_id, str(user_id)))

        return jsonify({
            "success": True,
            "message": "Account registered successfully! You can now log in with your credentials.",
            "account_no": acc_no
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500


@auth_bp.route('/api/user/profile', methods=['GET', 'POST'])
def profile():
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    if request.method == 'GET':
        sql = """
            SELECT u.user_id, u.full_name, u.email, u.phone_no, u.address, u.date_of_birth, u.gender,
                   p.occupation, p.preferred_language, p.bio, p.kyc_status, p.profile_picture
            FROM users u
            LEFT JOIN profiles p ON u.user_id = p.user_id
            WHERE u.user_id = %s
        """
        row = db.query_one(sql, (user_id,))
        if not row:
            return jsonify({"success": False, "message": "User not found."}), 404
        return jsonify({"success": True, "profile": row})

    else:
        # POST - Update profile
        data = request.get_json() or {}
        full_name = data.get('full_name')
        phone = data.get('phone_no')
        address = data.get('address')
        occupation = data.get('occupation')
        bio = data.get('bio')

        if full_name:
            db.execute("UPDATE users SET full_name = %s WHERE user_id = %s", (full_name, user_id))
        if phone:
            db.execute("UPDATE users SET phone_no = %s WHERE user_id = %s", (phone, user_id))
        if address:
            db.execute("UPDATE users SET address = %s WHERE user_id = %s", (address, user_id))
        if occupation or bio:
            db.execute("UPDATE profiles SET occupation = COALESCE(%s, occupation), bio = COALESCE(%s, bio) WHERE user_id = %s",
                       (occupation, bio, user_id))

        return jsonify({"success": True, "message": "Profile updated successfully!"})


@auth_bp.route('/api/user/settings', methods=['GET', 'POST'])
def settings():
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    if request.method == 'GET':
        row = db.query_one("SELECT * FROM settings WHERE user_id = %s", (user_id,))
        return jsonify({"success": True, "settings": row or {"theme": "light", "language": "English", "email_alerts": 1, "sms_alerts": 1}})
    else:
        data = request.get_json() or {}
        theme = data.get('theme', 'light')
        language = data.get('language', 'English')
        email_alerts = 1 if data.get('email_alerts') else 0
        sms_alerts = 1 if data.get('sms_alerts') else 0

        db.execute("""
            UPDATE settings 
            SET theme = %s, language = %s, email_alerts = %s, sms_alerts = %s, last_updated = CURRENT_TIMESTAMP
            WHERE user_id = %s
        """, (theme, language, email_alerts, sms_alerts, user_id))
        return jsonify({"success": True, "message": "Settings saved successfully!"})


@auth_bp.route('/api/user/change-password', methods=['POST'])
def change_password():
    data = request.get_json() or {}
    user_id = data.get('user_id') or 1
    current_pwd = data.get('current_password', '')
    new_pwd = data.get('new_password', '')

    if not current_pwd or not new_pwd:
        return jsonify({"success": False, "message": "Current and new password are required."}), 400

    row = db.query_one("SELECT password_hash FROM login_credentials WHERE user_id = %s", (user_id,))
    if not row or not verify_password(current_pwd, row['password_hash']):
        return jsonify({"success": False, "message": "Incorrect current password."}), 400

    new_hash = hash_password(new_pwd)
    db.execute("UPDATE login_credentials SET password_hash = %s WHERE user_id = %s", (new_hash, user_id))
    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('User', %s, 'PASSWORD_CHANGE', 'login_credentials', %s, 'Password updated securely')""",
               (user_id, str(user_id)))

    return jsonify({"success": True, "message": "Password updated successfully!"})
