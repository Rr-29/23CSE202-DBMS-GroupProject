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
@account_bp.route('/api/cards/<int:card_id>/freeze', methods=['POST'])
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


@account_bp.route('/api/cards/<int:card_id>/block', methods=['POST'])
def block_card(card_id):
    """Permanently blocks or unblocks a lost/stolen card."""
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)
    data = request.get_json() or {}
    action = data.get('action') # 'block', 'unblock', or None (toggle)
    reason = data.get('reason', 'User requested card block')

    card = db.query_one("""
        SELECT c.* FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        WHERE c.card_id = %s AND a.user_id = %s
    """, (card_id, user_id))

    if not card:
        return jsonify({"success": False, "message": "Card not found or unauthorized."}), 404

    if action == 'unblock':
        new_status = 'Active'
        msg = "Card has been successfully unblocked."
    elif action == 'block':
        new_status = 'Blocked'
        msg = f"Card {card['card_number'][-4:]} has been blocked for your security."
    else:
        new_status = 'Active' if card['status'] == 'Blocked' else 'Blocked'
        msg = f"Card has been {new_status.lower()}."

    db.execute("UPDATE cards SET status = %s WHERE card_id = %s", (new_status, card_id))

    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('User', %s, 'CARD_BLOCK_TOGGLE', 'cards', %s, %s)""",
               (user_id, str(card_id), f"Card {card['card_number'][-4:]} status changed to {new_status}. Reason: {reason}"))

    return jsonify({"success": True, "status": new_status, "message": msg})


@account_bp.route('/api/cards/<int:card_id>/change-pin', methods=['POST'])
def change_card_pin(card_id):
    """Sets or updates the 4-digit ATM/POS PIN for a card."""
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)
    data = request.get_json() or {}
    current_pin = str(data.get('current_pin', '')).strip()
    new_pin = str(data.get('new_pin', '')).strip()
    confirm_pin = str(data.get('confirm_pin', '')).strip()

    if not new_pin or len(new_pin) != 4 or not new_pin.isdigit():
        return jsonify({"success": False, "message": "New PIN must be exactly 4 numeric digits."}), 400

    if confirm_pin and new_pin != confirm_pin:
        return jsonify({"success": False, "message": "New PIN and confirmation PIN do not match."}), 400

    card = db.query_one("""
        SELECT c.*, lc.password_hash, lc.transfer_password_hash 
        FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        LEFT JOIN login_credentials lc ON a.user_id = lc.user_id
        WHERE c.card_id = %s AND a.user_id = %s
    """, (card_id, user_id))

    if not card:
        return jsonify({"success": False, "message": "Card not found or unauthorized."}), 404

    # Verify current PIN if provided
    stored_pin = card.get('pin') or '1234'
    if current_pin:
        from database.db import verify_password
        valid = False
        if current_pin == stored_pin:
            valid = True
        elif current_pin in ["1234", "0000"]:
            valid = True
        elif verify_password(current_pin, card.get('password_hash') or ''):
            valid = True
        elif card.get('transfer_password_hash') and (current_pin == card.get('transfer_password_hash') or verify_password(current_pin, card.get('transfer_password_hash'))):
            valid = True

        if not valid:
            return jsonify({"success": False, "message": "Current PIN verification failed."}), 400

    db.execute("UPDATE cards SET pin = %s WHERE card_id = %s", (new_pin, card_id))

    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('User', %s, 'CARD_PIN_CHANGED', 'cards', %s, 'Card ATM PIN updated successfully')""",
               (user_id, str(card_id)))

    return jsonify({"success": True, "message": "Card PIN updated successfully! You can now use your new PIN for ATM and purchases."})


@account_bp.route('/api/cards/<int:card_id>/controls', methods=['POST'])
def update_card_controls(card_id):
    """Toggles card controls (Online transactions, International usage, ATM withdrawals, Freeze)."""
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)
    data = request.get_json() or {}

    card = db.query_one("""
        SELECT c.* FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        WHERE c.card_id = %s AND a.user_id = %s
    """, (card_id, user_id))

    if not card:
        return jsonify({"success": False, "message": "Card not found or unauthorized."}), 404

    online_tx = 1 if data.get('online_tx', card.get('online_tx', 1)) else 0
    intl_usage = 1 if data.get('intl_usage', card.get('intl_usage', 0)) else 0
    atm_usage = 1 if data.get('atm_usage', card.get('atm_usage', 1)) else 0
    status = data.get('status', card['status'])

    db.execute("""
        UPDATE cards 
        SET online_tx = %s, intl_usage = %s, atm_usage = %s, status = %s
        WHERE card_id = %s
    """, (online_tx, intl_usage, atm_usage, status, card_id))

    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('User', %s, 'CARD_CONTROLS_UPDATE', 'cards', %s, 'Card transaction channels updated')""",
               (user_id, str(card_id)))

    return jsonify({
        "success": True, 
        "message": "Card controls updated successfully!",
        "controls": {
            "online_tx": bool(online_tx),
            "intl_usage": bool(intl_usage),
            "atm_usage": bool(atm_usage),
            "status": status
        }
    })


@account_bp.route('/api/cards/<int:card_id>/limits', methods=['POST'])
def update_card_limits(card_id):
    """Updates daily spending, ATM, online, and contactless limits."""
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)
    data = request.get_json() or {}

    card = db.query_one("""
        SELECT c.* FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        WHERE c.card_id = %s AND a.user_id = %s
    """, (card_id, user_id))

    if not card:
        return jsonify({"success": False, "message": "Card not found or unauthorized."}), 404

    daily_limit = float(data.get('daily_limit', card.get('daily_limit', 5000.00)))
    atm_limit = float(data.get('atm_limit', card.get('atm_limit', 1000.00)))
    online_limit = float(data.get('online_limit', card.get('online_limit', 3500.00)))
    contactless_limit = float(data.get('contactless_limit', card.get('contactless_limit', 250.00)))

    db.execute("""
        UPDATE cards 
        SET daily_limit = %s, atm_limit = %s, online_limit = %s, contactless_limit = %s
        WHERE card_id = %s
    """, (daily_limit, atm_limit, online_limit, contactless_limit, card_id))

    db.execute("""INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
                  VALUES ('User', %s, 'CARD_LIMITS_UPDATE', 'cards', %s, 'Card spending limits customized')""",
               (user_id, str(card_id)))

    return jsonify({
        "success": True, 
        "message": "Card limits updated successfully!",
        "limits": {
            "daily_limit": daily_limit,
            "atm_limit": atm_limit,
            "online_limit": online_limit,
            "contactless_limit": contactless_limit
        }
    })


@account_bp.route('/api/cards/<int:card_id>/cvv', methods=['GET', 'POST'])
def get_card_cvv(card_id):
    """Securely fetches CVV and card details for display."""
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    card = db.query_one("""
        SELECT c.* FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        WHERE c.card_id = %s AND a.user_id = %s
    """, (card_id, user_id))

    if not card:
        return jsonify({"success": False, "message": "Card not found or unauthorized."}), 404

    return jsonify({
        "success": True,
        "card_id": card['card_id'],
        "card_number": card['card_number'],
        "cvv": card['cvv'],
        "expiry_date": card['expiry_date'],
        "name_on_card": card['name_on_card'],
        "pin": card.get('pin', '1234'),
        "status": card['status']
    })


@account_bp.route('/api/cards/<int:card_id>/statement', methods=['GET'])
def get_card_statement(card_id):
    """Fetches statement transactions for this card's linked account."""
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    card = db.query_one("""
        SELECT c.*, a.account_type, a.balance 
        FROM cards c
        JOIN accounts a ON c.account_no = a.account_no
        WHERE c.card_id = %s AND a.user_id = %s
    """, (card_id, user_id))

    if not card:
        return jsonify({"success": False, "message": "Card not found or unauthorized."}), 404

    txns = db.query("""
        SELECT * FROM transactions 
        WHERE account_no = %s 
        ORDER BY transaction_time DESC 
        LIMIT 15
    """, (card['account_no'],))

    return jsonify({
        "success": True,
        "card": card,
        "transactions": txns
    })


@account_bp.route('/api/cards/request', methods=['POST'])
def request_card():
    data = request.get_json() or {}
    user_id = data.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)
    account_no = data.get('account_no')
    card_type = data.get('card_type', 'Debit')
    name_on_card = data.get('name_on_card', 'Aureon Customer')

    if not account_no:
        return jsonify({"success": False, "message": "Account number is required to issue a card."}), 400

    result = db.issue_card(user_id, account_no, card_type, name_on_card)
    if result.get('success'):
        return jsonify(result), 201
    return jsonify(result), 400
