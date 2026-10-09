"""
=====================================================================
Course: 23CSE202 Database Management Systems
Project: Aureon - Internet Banking System
Group No: D4 (Amrita School of Computing, Amritapuri Campus)

MODULE: Utility Bills, Admin Console & Database Analytics
CONTRIBUTOR: Varun Nair (Roll No: AM.SC.U4CSE25356)
Entities Managed: BILLS, ADMINS, AUDIT_LOGS, Database Views & Metrics
=====================================================================
"""

from flask import Blueprint, request, jsonify
from database.db import db
import datetime

admin_bill_bp = Blueprint('admin_bill_bp', __name__)

# =====================================================================
# BILLS MANAGEMENT (Varun Nair)
# =====================================================================

@admin_bill_bp.route('/api/bills', methods=['GET'])
def get_bills():
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    bills = db.query("""
        SELECT b.*, a.account_type
        FROM bills b
        LEFT JOIN accounts a ON b.account_no = a.account_no
        WHERE b.user_id = %s
        ORDER BY CASE WHEN b.status = 'Unpaid' THEN 1 ELSE 2 END, b.due_date ASC
    """, (user_id,))

    unpaid_total = sum(b['amount'] for b in bills if b['status'] == 'Unpaid')
    paid_total = sum(b['amount'] for b in bills if b['status'] == 'Paid')

    return jsonify({
        "success": True,
        "bills": bills,
        "summary": {
            "unpaid_total": unpaid_total,
            "paid_total": paid_total,
            "unpaid_count": len([b for b in bills if b['status'] == 'Unpaid']),
            "paid_count": len([b for b in bills if b['status'] == 'Paid'])
        }
    })


@admin_bill_bp.route('/api/bills/<int:bill_id>/pay', methods=['POST'])
def pay_bill(bill_id):
    data = request.get_json() or {}
    user_id = data.get('user_id') or 1
    account_no = data.get('account_no')

    if not account_no:
        return jsonify({"success": False, "message": "Please select a payment account."}), 400

    result = db.execute_bill_payment(int(user_id), bill_id, account_no)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


# =====================================================================
# ADMIN DASHBOARD & AUDIT (Varun Nair)
# =====================================================================

@admin_bill_bp.route('/api/admin/metrics', methods=['GET'])
def get_admin_metrics():
    # 1. Total deposits across all accounts
    tot_dep = db.query_one("SELECT COALESCE(SUM(balance), 0.00) AS total_deposits FROM accounts WHERE status = 'Active'")
    
    # 2. Total active customers
    tot_cust = db.query_one("SELECT COUNT(*) AS total_customers FROM users WHERE user_type = 'Customer'")
    
    # 3. Total active accounts
    tot_acc = db.query_one("SELECT COUNT(*) AS total_accounts FROM accounts WHERE status = 'Active'")
    
    # 4. Total transactions & volume
    tot_txns = db.query_one("SELECT COUNT(*) AS total_txns, COALESCE(SUM(amount), 0.00) AS total_volume FROM transactions")

    # 5. Pending bills
    tot_bills = db.query_one("SELECT COUNT(*) AS pending_bills_count, COALESCE(SUM(amount), 0.00) AS pending_amount FROM bills WHERE status = 'Unpaid'")

    # 6. Today's metrics
    today_stats = db.query_one("""
        SELECT COUNT(*) AS today_count, COALESCE(SUM(amount), 0.00) AS today_volume 
        FROM transactions 
        WHERE DATE(transaction_time) = CURRENT_DATE
    """)

    # 7. Recent 5 system activities from audit logs
    recent_activity = db.query("""
        SELECT * FROM audit_logs 
        ORDER BY timestamp DESC 
        LIMIT 10
    """)

    return jsonify({
        "success": True,
        "metrics": {
            "total_deposits": tot_dep['total_deposits'] if tot_dep else 0.00,
            "total_customers": tot_cust['total_customers'] if tot_cust else 0,
            "total_accounts": tot_acc['total_accounts'] if tot_acc else 0,
            "total_transactions": tot_txns['total_txns'] if tot_txns else 0,
            "total_volume": tot_txns['total_volume'] if tot_txns else 0.00,
            "pending_bills": tot_bills['pending_bills_count'] if tot_bills else 0,
            "today_count": today_stats['today_count'] if today_stats else 0,
            "today_volume": today_stats['today_volume'] if today_stats else 0.00
        },
        "recent_activity": recent_activity
    })


@admin_bill_bp.route('/api/admin/customers', methods=['GET'])
def get_admin_customers():
    search = request.args.get('search', '').strip().lower()
    status_filter = request.args.get('status', '').strip().lower()

    sql = """
        SELECT u.user_id, u.full_name, u.email, u.phone_no, u.address, u.created_at,
               l.status AS login_status, l.last_login,
               COUNT(DISTINCT a.account_no) AS account_count,
               COALESCE(SUM(a.balance), 0.00) AS total_balance,
               GROUP_CONCAT(a.account_no, ', ') AS account_numbers
        FROM users u
        JOIN login_credentials l ON u.user_id = l.user_id
        LEFT JOIN accounts a ON u.user_id = a.user_id
        WHERE u.user_type = 'Customer'
    """
    params = []

    if search:
        sql += " AND (LOWER(u.full_name) LIKE %s OR LOWER(u.email) LIKE %s OR LOWER(u.phone_no) LIKE %s)"
        pat = f"%{search}%"
        params.extend([pat, pat, pat])

    if status_filter and status_filter != 'all':
        sql += " AND LOWER(l.status) = %s"
        params.append(status_filter)

    sql += " GROUP BY u.user_id, u.full_name, u.email, u.phone_no, u.address, u.created_at, l.status, l.last_login ORDER BY u.user_id ASC"

    customers = db.query(sql, tuple(params))
    return jsonify({"success": True, "count": len(customers), "customers": customers})


@admin_bill_bp.route('/api/admin/customers/<int:user_id>/toggle-status', methods=['POST'])
def toggle_customer_status(user_id):
    row = db.query_one("SELECT status FROM login_credentials WHERE user_id = %s", (user_id,))
    if not row:
        return jsonify({"success": False, "message": "User not found."}), 404

    new_status = 'Suspended' if row['status'] == 'Active' else 'Active'
    db.execute("UPDATE login_credentials SET status = %s WHERE user_id = %s", (new_status, user_id))
    
    # Audit log
    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('Admin', 1, 'CUSTOMER_STATUS_TOGGLE', 'login_credentials', %s, %s)""",
               (str(user_id), f"Customer status changed to {new_status}"))

    return jsonify({"success": True, "new_status": new_status, "message": f"Customer status changed to {new_status}."})


@admin_bill_bp.route('/api/admin/audit-logs', methods=['GET'])
def get_audit_logs():
    limit = int(request.args.get('limit', 50))
    logs = db.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT %s", (limit,))
    return jsonify({"success": True, "logs": logs})


@admin_bill_bp.route('/api/admin/reports', methods=['GET'])
def get_reports():
    # Category spending breakdown
    category_breakdown = db.query("""
        SELECT category, COUNT(*) AS count, SUM(amount) AS total_amount
        FROM transactions
        WHERE transaction_type = 'Debit'
        GROUP BY category
        ORDER BY total_amount DESC
    """)

    # Monthly volume breakdown
    monthly_data = db.query("""
        SELECT strftime('%Y-%m', transaction_time) AS month, 
               COUNT(*) AS txn_count,
               SUM(CASE WHEN transaction_type = 'Credit' THEN amount ELSE 0 END) AS credits,
               SUM(CASE WHEN transaction_type = 'Debit' THEN amount ELSE 0 END) AS debits
        FROM transactions
        GROUP BY strftime('%Y-%m', transaction_time)
        ORDER BY month DESC
        LIMIT 6
    """)

    # High value transfers
    high_value = db.query("""
        SELECT t.transfer_id, t.amount, t.transfer_date, t.purpose, t.source_account_no,
               u.full_name AS sender_name, b.name AS recipient_name
        FROM transfers t
        JOIN accounts a ON t.source_account_no = a.account_no
        JOIN users u ON a.user_id = u.user_id
        LEFT JOIN beneficiaries b ON t.beneficiary_id = b.beneficiary_id
        WHERE t.amount >= 500.00
        ORDER BY t.amount DESC
        LIMIT 10
    """)

    return jsonify({
        "success": True,
        "category_breakdown": category_breakdown,
        "monthly_data": monthly_data,
        "high_value_transfers": high_value
    })


# =====================================================================
# TEAM & PROJECT GROUP D4 CONTRIBUTORS INFORMATION
# =====================================================================
@admin_bill_bp.route('/api/team', methods=['GET'])
def get_team_info():
    """Returns official group information and module allocation."""
    return jsonify({
        "project": "Aureon - Internet Banking System",
        "course": "23CSE202 Database Management Systems",
        "semester": "Semester 3 (S3 B.Tech CSE)",
        "institution": "Amrita School of Computing, Amritapuri Campus",
        "group_id": "D4",
        "members": [
            {
                "name": "Mehrin A S",
                "roll_no": "AM.SC.U4CSE25332",
                "role": "Team Member - Module Lead",
                "module": "User Identity, Authentication & Profile Management",
                "entities": ["USERS", "LOGIN_CREDENTIALS", "PROFILES", "SETTINGS"],
                "key_contributions": "Designed 1:1 credential and profile schemas (BCNF), session management, password hashing, and user preference controls."
            },
            {
                "name": "Nithya Ajay",
                "roll_no": "AM.SC.U4CSE25339",
                "role": "Team Member - Module Lead",
                "module": "Bank Accounts & Card Management Lifecycle",
                "entities": ["ACCOUNTS", "CARDS"],
                "key_contributions": "Implemented multi-account ownership, checking/savings ledger management, debit/virtual card provisioning, and freeze/unfreeze controls."
            },
            {
                "name": "Rudra Rajagopal",
                "roll_no": "AM.SC.U4CSE25344",
                "role": "Team Lead & Architecture",
                "module": "Beneficiaries, Fund Transfers & Transaction Ledger",
                "entities": ["BENEFICIARIES", "TRANSFERS", "TRANSACTIONS", "TRANSACTION_HISTORY"],
                "key_contributions": "Engineered ternary transfer relationship model, ACID transaction rollback/commit engine, automated triggers for ledger logging, and real-time statements."
            },
            {
                "name": "Varun Nair",
                "roll_no": "AM.SC.U4CSE25356",
                "role": "Team Member - Module Lead",
                "module": "Utility Bills, Admin Console & Database Analytics",
                "entities": ["BILLS", "ADMINS", "AUDIT_LOGS"],
                "key_contributions": "Created bill settlement engine, administrative control panel, compliance audit logging, database views (vw_admin_system_metrics, vw_customer_overview), and financial reporting."
            }
        ]
    })
