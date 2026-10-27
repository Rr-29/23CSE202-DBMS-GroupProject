# 🏦 Aureon — Internet Banking System
> **Course:** 23CSE202 Database Management Systems | **Group No:** D4  
> **Institution:** Department of Computer Science & Engineering, Amrita School of Computing, Amritapuri Campus  
> **Semester:** S3 B.Tech CSE (Phase 2: Complete Relational Database Integration)

---



## 🚀 Quick Start Guide (Run in 10 Seconds)

### Option 1: Automatic 1-Click Launch (Recommended)
Double-click `run.bat` or run:
```bash
python start_server.py
```
*The script automatically initializes the database, loads seed records, launches the RESTful Flask engine on `http://127.0.0.1:5000`, and opens your web browser!*

### Option 2: Standard Command Line Launch
1. Ensure Python 3.10+ is installed.
2. Install dependencies (if not already installed):
   ```bash
   pip install flask flask-cors pymysql cryptography
   ```
3. Start the application:
   ```bash
   python app.py
   ```
4. Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

---

## 🔑 Demo Login Credentials

| Portal | Role | Username / Email | Password | Features Accessible |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Primary Customer | `user@aureon.com` | `User@123` | Dashboard, Transfers, Bills, Cards, Beneficiaries |
| **Customer** | Teammate (Mehrin) | `mehrin@aureon.com` | `User@123` | Personal accounts, cards, statements |
| **Customer** | Teammate (Nithya) | `nithya@aureon.com` | `User@123` | Personal accounts, cards, statements |
| **Customer** | Teammate (Rudra) | `rudra@aureon.com` | `User@123` | Personal accounts, cards, statements |
| **Customer** | Teammate (Varun) | `varun@aureon.com` | `User@123` | Personal accounts, cards, statements |
| **Admin** | System Administrator | `admin@aureon.com` | `Admin@123` | Customer management, audit logs, financial reports |

*(You can also click **Register** on `auth.html` to create a brand-new customer account with automatic welcome deposit!)*

---

## 🗄️ Relational Database Architecture

Aureon features a **3NF and BCNF normalized** relational database schema:

```
USERS (1) ───< (1) LOGIN_CREDENTIALS
  │
  ├───< (1) PROFILES
  ├───< (1) SETTINGS
  │
  ├───< (N) ACCOUNTS (1) ───< (N) CARDS
  │           │
  │           ├───< (N) TRANSACTIONS (1) ───< (N) TRANSACTION_HISTORY
  │           │           │
  │           └───────────┴───< (N) TRANSFERS >─── (N) BENEFICIARIES
  │
  └───< (N) BILLS
ADMINS (Privileged Management)
AUDIT_LOGS (System Compliance Trail)
```

### 12 Normalized Relational Tables:
1. **`users`**: Core identity & contact details (`user_id`, `full_name`, `email`, `phone_no`, `address`, `user_type`).
2. **`login_credentials`**: Separated authentication entity (`login_id`, `user_id`, `username`, `password_hash`, `last_login`, `failed_attempts`, `status`).
3. **`profiles`**: User biographical and KYC records (`profile_id`, `user_id`, `occupation`, `preferred_language`, `bio`, `kyc_status`).
4. **`settings`**: User application and security preferences (`settings_id`, `user_id`, `theme`, `language`, `email_alerts`, `sms_alerts`).
5. **`accounts`**: Bank accounts with balance constraints (`account_no`, `user_id`, `account_type`, `balance`, `min_balance`, `status`).
6. **`cards`**: Debit, credit, and virtual cards (`card_id`, `account_no`, `card_number`, `card_type`, `expiry_date`, `cvv`, `status`).
7. **`beneficiaries`**: Saved transfer recipients (`beneficiary_id`, `user_id`, `name`, `account_no`, `bank_name`, `ifsc_code`, `status`).
8. **`bills`**: Utility and service bills (`bill_id`, `user_id`, `biller_name`, `biller_type`, `account_no`, `amount`, `due_date`, `status`).
9. **`transactions`**: Authoritative immutable ledger events (`transaction_id`, `account_no`, `transaction_type`, `amount`, `balance_after`, `description`, `reference_id`).
10. **`transfers`**: Ternary transfer relationship (`transfer_id`, `source_account_no`, `beneficiary_id`, `transaction_id`, `amount`, `purpose`, `status`).
11. **`transaction_history`**: Weak historical entity dependent on transactions (`history_id`, `transaction_id`, `action`, `balance`, `remarks`).
12. **`admins`**: Administrative roles (`admin_id`, `username`, `password_hash`, `name`, `role`, `status`).
13. **`audit_logs`**: System-wide compliance and security audit trail (`log_id`, `actor_type`, `action`, `table_affected`, `details`, `timestamp`).

---

## ⚡ Advanced Database Features

* **ACID Transactions:** Row-level locking with atomic debits and credits ensures balance conservation with zero overdrafts.
* **Database Triggers:**
  - `trg_prevent_negative_balance`: Pre-update trigger ensuring account balances never fall below zero.
  - `trg_record_transaction_history`: Post-insert trigger automatically updating the transaction history ledger.
  - `trg_audit_transfer_insert`: Logs transfer operations into security audit trails.
* **Database Views:**
  - `vw_customer_overview`: Aggregates customer total balances, active accounts, and card counts.
  - `vw_transfer_ledger`: Joins sender, recipient, and transaction references for statement printing.
  - `vw_admin_system_metrics`: High-level executive KPI metrics for administrators.
  - `vw_pending_bills`: Upcoming utility invoices sorted by urgency.
* **Dual-Engine Support:**
  - **SQLite 3:** Runs natively out of the box with zero setup.
  - **MySQL 8.0:** Full MySQL DDL scripts provided in `database/schema_mysql.sql` and `database/seed_data.sql`.

---

## 📁 Project Directory Structure

```
23CSE202-DBMS-GroupProject/
├── database/
│   ├── schema_mysql.sql       # Full MySQL 8.0 DDL (Tables, Views, Triggers, Stored Procedures)
│   ├── seed_data.sql          # Realistic seed records for MySQL
│   ├── aureon.db              # Embedded SQLite database (auto-created & seeded)
│   └── db.py                  # Dual-engine database adapter (ACID transactional methods)
├── backend/
│   └── routes/
│       ├── auth_routes.py     # Module 1: Auth & Profiles (Mehrin A S)
│       ├── account_routes.py  # Module 2: Accounts & Cards (Nithya Ajay)
│       ├── transfer_routes.py # Module 3: Transfers & Transactions (Rudra Rajagopal)
│       └── admin_bill_routes.py # Module 4: Bills & Admin (Varun Nair)
├── css/                       # Clean glassmorphism styling
├── js/
│   ├── api.js                 # Shared API client & Group D4 Modal helper
│   ├── auth.js                # Login & Registration controller
│   ├── accounts_cards.js      # Accounts & Cards controller
│   ├── transfers.js           # Transfers & Ledger controller
│   ├── admin.js               # Admin dashboard & Customers controller
│   └── profile_settings.js    # Profile & Preferences controller
├── assets/images/             # Avatar & graphic assets
├── app.py                     # Main Flask RESTful server
├── start_server.py            # One-click launch script with browser auto-open
├── run.bat                    # Windows batch launcher
├── PROJECT_REPORT.md          # Comprehensive DBMS College Project Report
└── README.md                  # Project Documentation
```

---

## 🎓 Academic Course Details
* **Course Title:** Database Management Systems (23CSE202)
* **Semester:** S3 B.Tech Computer Science and Engineering
* **Department:** Computer Science and Engineering
* **Campus:** Amrita School of Computing, Amritapuri Campus, Amrita Vishwa Vidyapeetham
