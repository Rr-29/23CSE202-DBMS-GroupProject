"""
=====================================================================
Course: 23CSE202 Database Management Systems
Project: Aureon - Internet Banking System
Group No: D4 (Amrita School of Computing, Amritapuri Campus)

MODULE: Bank Accounts & Card Management Lifecycle
CONTRIBUTOR: Nithya Ajay (Roll No: AM.SC.U4CSE25339)
Entities Managed: ACCOUNTS, CARDS
=====================================================================
"""

from flask import Blueprint, request, jsonify
from database.db import db

account_bp = Blueprint('account_bp', __name__)

@account_bp.route('/api/accounts', methods=['GET'])
def get_accounts():
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    # 1. Fetch user accounts
    accounts = db.query("""
        SELECT a.account_no, a.account_type, a.balance, a.currency, a.min_balance, a.date_opened, a.status,
               (SELECT COUNT(*) FROM cards c WHERE c.account_no = a.account_no AND c.status = 'Active') AS active_cards_count
        FROM accounts a
        WHERE a.user_id = %s
        ORDER BY a.date_opened ASC
    """, (user_id,))

    # 2. Calculate Aggregates
    total_balance = sum(acc['balance'] for acc in accounts)
    
    # Calculate Income & Expenses from transactions
    stats = db.query_one("""
        SELECT 
            COALESCE(SUM(CASE WHEN t.transaction_type = 'Credit' THEN t.amount ELSE 0 END), 0.00) AS total_income,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'Debit' THEN t.amount ELSE 0 END), 0.00) AS total_expenses
        FROM transactions t
        JOIN accounts a ON t.account_no = a.account_no
        WHERE a.user_id = %s AND t.status = 'Completed'
    """, (user_id,))

    income = stats['total_income'] if stats else 0.00
    expenses = stats['total_expenses'] if stats else 0.00
    savings = max(0.00, total_balance * 0.55) # approximate allocation

    return jsonify({
        "success": True,
        "accounts": accounts,
        "summary": {
            "total_balance": total_balance,
            "total_accounts": len(accounts),
            "total_income": income,
            "total_expenses": expenses,
            "total_savings": savings
        }
    })


@account_bp.route('/api/accounts/<account_no>', methods=['GET'])
def get_account_details(account_no):
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    account = db.query_one("""
        SELECT a.*, u.full_name, u.email, u.phone_no
        FROM accounts a
        JOIN users u ON a.user_id = u.user_id
        WHERE a.account_no = %s AND a.user_id = %s
    """, (account_no, user_id))

    if not account:
        return jsonify({"success": False, "message": "Account not found."}), 404

    # Fetch recent transactions on this account
    transactions = db.query("""
        SELECT transaction_id, transaction_type, amount, balance_after, description, category, status, reference_id,
               transaction_time
        FROM transactions
        WHERE account_no = %s
        ORDER BY transaction_time DESC
        LIMIT 20
    """, (account_no,))

    cards = db.query("SELECT * FROM cards WHERE account_no = %s", (account_no,))

    return jsonify({
        "success": True,
        "account": account,
        "transactions": transactions,
        "cards": cards
    })


@account_bp.route('/api/accounts/open', methods=['POST'])
def open_account():
    data = request.get_json() or {}
    user_id = data.get('user_id') or request.headers.get('X-User-Id') or request.args.get('user_id') or 1
    user_id = int(user_id)
    account_type = data.get('account_type', 'Savings')
    initial_deposit = float(data.get('initial_deposit', 100.00))

    result = db.open_account(user_id, account_type, initial_deposit)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400


@account_bp.route('/api/cards', methods=['GET'])
def get_cards():
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    cards = db.query("""
        SELECT c.*, a.account_type, a.balance
        FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        WHERE a.user_id = %s
        ORDER BY c.card_id ASC
    """, (user_id,))

    return jsonify({"success": True, "cards": cards})


@account_bp.route('/api/cards/<int:card_id>/toggle-status', methods=['POST'])
def toggle_card_status(card_id):
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    card = db.query_one("""
        SELECT c.* FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        WHERE c.card_id = %s AND a.user_id = %s
    """, (card_id, user_id))

    if not card:
        return jsonify({"success": False, "message": "Card not found or unauthorized."}), 404

    new_status = 'Frozen' if card['status'] == 'Active' else 'Active'
    db.execute("UPDATE cards SET status = %s WHERE card_id = %s", (new_status, card_id))
    
    # Audit trail
    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('User', %s, 'CARD_STATUS_UPDATE', 'cards', %s, %s)""",
               (user_id, str(card_id), f"Card {card['card_number'][-4:]} updated to {new_status}"))

    return jsonify({"success": True, "status": new_status, "message": f"Card has been {new_status.lower()}."})


@account_bp.route('/api/cards/request', methods=['POST'])
def request_card():
    data = request.get_json() or {}
    user_id = data.get('user_id') or 1
    account_no = data.get('account_no')
    card_type = data.get('card_type', 'Debit')
    name_on_card = data.get('name_on_card', 'Aureon Customer')

    if not account_no:
        return jsonify({"success": False, "message": "Account number is required to issue a card."}), 400

    result = db.issue_card(int(user_id), account_no, card_type, name_on_card)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400
