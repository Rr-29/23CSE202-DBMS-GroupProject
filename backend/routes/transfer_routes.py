"""
=====================================================================
Course: 23CSE202 Database Management Systems
Project: Aureon - Internet Banking System
Group No: D4 (Amrita School of Computing, Amritapuri Campus)

MODULE: Beneficiaries, Fund Transfers & Transaction Ledger
CONTRIBUTOR: Rudra Rajagopal (Roll No: AM.SC.U4CSE25344)
Entities Managed: BENEFICIARIES, TRANSFERS, TRANSACTIONS, TRANSACTION_HISTORY
=====================================================================
"""

from flask import Blueprint, request, jsonify
from database.db import db
import datetime

transfer_bp = Blueprint('transfer_bp', __name__)

@transfer_bp.route('/api/beneficiaries', methods=['GET'])
def get_beneficiaries():
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)

    beneficiaries = db.query("""
        SELECT * FROM beneficiaries
        WHERE user_id = %s AND status = 'Active'
        ORDER BY name ASC
    """, (user_id,))

    return jsonify({"success": True, "beneficiaries": beneficiaries})


@transfer_bp.route('/api/beneficiaries/add', methods=['POST'])
def add_beneficiary():
    data = request.get_json() or {}
    user_id = data.get('user_id') or 1
    name = data.get('name', '').strip()
    account_no = data.get('account_no', '').strip()
    bank_name = data.get('bank_name', 'Aureon Bank').strip()
    ifsc_code = data.get('ifsc_code', 'AURN0001001').strip().upper()
    transfer_type = data.get('transfer_type', 'Internal')

    if not name or not account_no:
        return jsonify({"success": False, "message": "Recipient name and account number are required."}), 400

    ben_id = db.execute("""
        INSERT INTO beneficiaries (user_id, name, account_no, bank_name, ifsc_code, transfer_type, status)
        VALUES (%s, %s, %s, %s, %s, %s, 'Active')
    """, (int(user_id), name, account_no, bank_name, ifsc_code, transfer_type))

    return jsonify({
        "success": True,
        "message": f"Beneficiary {name} added successfully!",
        "beneficiary_id": ben_id
    }), 201


@transfer_bp.route('/api/beneficiaries/<int:ben_id>', methods=['DELETE'])
def delete_beneficiary(ben_id):
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    db.execute("UPDATE beneficiaries SET status = 'Inactive' WHERE beneficiary_id = %s AND user_id = %s",
               (ben_id, int(user_id)))
    return jsonify({"success": True, "message": "Beneficiary removed successfully."})


@transfer_bp.route('/api/transfers/execute', methods=['POST'])
def execute_transfer():
    data = request.get_json() or {}
    user_id = data.get('user_id') or 1
    source_acc = data.get('source_account', '').strip()
    beneficiary_id = data.get('beneficiary_id')
    dest_acc = data.get('dest_account')
    amount = float(data.get('amount', 0.00))
    purpose = data.get('purpose', 'Personal')
    remarks = data.get('remarks', '')

    if not source_acc:
        return jsonify({"success": False, "message": "Please select a source account."}), 400
    
    if not beneficiary_id and not dest_acc:
        return jsonify({"success": False, "message": "Please select a recipient beneficiary or enter an account number."}), 400

    if beneficiary_id:
        beneficiary_id = int(beneficiary_id)

    result = db.execute_transfer(
        user_id=int(user_id),
        source_acc=source_acc,
        beneficiary_id=beneficiary_id,
        dest_acc=dest_acc,
        amount=amount,
        purpose=purpose,
        remarks=remarks
    )

    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@transfer_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    user_id = request.args.get('user_id') or request.headers.get('X-User-Id') or 1
    user_id = int(user_id)
    
    txn_type = request.args.get('type')
    status = request.args.get('status')
    search = request.args.get('search', '').strip().lower()
    limit = int(request.args.get('limit', 50))

    base_query = """
        SELECT t.*, a.account_type
        FROM transactions t
        JOIN accounts a ON t.account_no = a.account_no
        WHERE a.user_id = %s
    """
    params = [user_id]

    if txn_type and txn_type.lower() != 'all':
        base_query += " AND LOWER(t.transaction_type) = %s"
        params.append(txn_type.lower())

    if status and status.lower() != 'all':
        base_query += " AND LOWER(t.status) = %s"
        params.append(status.lower())

    if search:
        base_query += " AND (LOWER(t.description) LIKE %s OR LOWER(t.reference_id) LIKE %s OR LOWER(t.category) LIKE %s)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern])

    base_query += " ORDER BY t.transaction_time DESC LIMIT %s"
    params.append(limit)

    transactions = db.query(base_query, tuple(params))
    return jsonify({"success": True, "count": len(transactions), "transactions": transactions})


@transfer_bp.route('/api/transactions/<reference_id>/receipt', methods=['GET'])
def get_receipt(reference_id):
    txn = db.query_one("""
        SELECT t.*, a.account_type, u.full_name, u.email,
               tr.purpose, tr.remarks, b.name AS beneficiary_name, b.bank_name AS beneficiary_bank
        FROM transactions t
        JOIN accounts a ON t.account_no = a.account_no
        JOIN users u ON a.user_id = u.user_id
        LEFT JOIN transfers tr ON t.transaction_id = tr.transaction_id
        LEFT JOIN beneficiaries b ON tr.beneficiary_id = b.beneficiary_id
        WHERE t.reference_id = %s
    """, (reference_id,))

    if not txn:
        return jsonify({"success": False, "message": "Transaction not found."}), 404

    return jsonify({"success": True, "receipt": txn})
