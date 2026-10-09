# 🏦 Aureon — Internet Banking System
## Database Management Systems Project Report (Course Code: 23CSE202)
**Department of Computer Science and Engineering**  
**Amrita School of Computing, Amritapuri Campus**  
**Semester:** S3 B.Tech CSE | **Academic Year:** 2026  
**Group Number:** D4  

---

## 👥 Team Members & Contribution Breakdown

| Roll Number | Student Name | Assigned Module & Domain | Work Contribution |
| :--- | :--- | :--- | :--- |
| **AM.SC.U4CSE25332** | **Mehrin A S** | User Identity, Authentication, Profile & Settings Module | **25%** |
| **AM.SC.U4CSE25339** | **Nithya Ajay** | Bank Accounts & Card Management Lifecycle Module | **25%** |
| **AM.SC.U4CSE25344** | **Rudra Rajagopal** | Fund Transfers, ACID Transactions & Beneficiaries Module | **25%** |
| **AM.SC.U4CSE25356** | **Varun Nair** | Utility Bills, Admin Console, Database Triggers & Analytics Module | **25%** |

---

## 1. Executive Summary & Problem Definition
Aureon is a modern, high-security, web-based digital banking application designed to deliver real-time retail and commercial banking services. Underneath its responsive interface, Aureon operates on a structured relational database engine built to guarantee financial transactional reliability, mathematical balance conservation, zero-loss audits, and role-based privilege isolation.

The relational architecture was developed following strict normalization standards (1NF, 2NF, 3NF, and BCNF), implementing referential integrity constraints, automated database triggers, database views, and ACID-compliant transaction boundaries.

---

## 2. Detailed Module & Team Member Responsibilities

### Module 1: User Identity, Authentication & Profile Management
* **Lead:** Mehrin A S (`AM.SC.U4CSE25332`)
* **Entities Managed:** `USERS`, `LOGIN_CREDENTIALS`, `PROFILES`, `SETTINGS`
* **Key Implementations:**
  - Designed the **1:1 separation** between `USERS` (identity & contact info) and `LOGIN_CREDENTIALS` (passwords, failed login attempts, status) to preserve privacy and improve database security.
  - Implemented customer self-registration with automatic initialization of profile, default settings, and opening account bonus.
  - Built secure session verification, password hashing, and user preferences (theme, language, alerts).
  - Enforced `UNIQUE` constraints on email and username determinants.

### Module 2: Bank Accounts & Card Management Lifecycle
* **Lead:** Nithya Ajay (`AM.SC.U4CSE25339`)
* **Entities Managed:** `ACCOUNTS`, `CARDS`
* **Key Implementations:**
  - Designed 1:N relationship allowing customers to own multiple accounts (Savings, Checking, Fixed Deposit).
  - Enforced check constraint `CHECK (balance >= 0.00)` and minimum balance rules.
  - Implemented card issuance engine generating unique 16-digit card numbers, CVVs, and expiry dates linked to specific accounts.
  - Built interactive card freeze/unfreeze state machine and daily spending limit tracking.

### Module 3: Beneficiaries, Fund Transfers & Transaction Ledger
* **Lead:** Rudra Rajagopal (`AM.SC.U4CSE25344`)
* **Entities Managed:** `BENEFICIARIES`, `TRANSFERS`, `TRANSACTIONS`, `TRANSACTION_HISTORY`
* **Key Implementations:**
  - Modeled the **Ternary Relationship** between source `ACCOUNTS`, recipient `BENEFICIARIES`, and financial `TRANSACTIONS`.
  - Implemented ACID atomic fund transfers: guarantees that debits and credits either succeed simultaneously or roll back cleanly without intermediate states.
  - Weak entity modeling: `TRANSACTION_HISTORY` identified by composite key `(transaction_id, history_id)`.
  - Filterable, searchable transaction ledger with statement download.

### Module 4: Utility Bills, Admin Console & Database Analytics
* **Lead:** Varun Nair (`AM.SC.U4CSE25356`)
* **Entities Managed:** `BILLS`, `ADMINS`, `AUDIT_LOGS`, Database Views & Triggers
* **Key Implementations:**
  - Built utility bill settlement engine (Electricity, Water, Internet, Credit Card, Rent) deducting live balances and stamping settlement timestamps.
  - Designed privileged Administrator console with role-based access control (`SuperAdmin`, `Manager`).
  - Created high-performance SQL Views (`vw_customer_overview`, `vw_transfer_ledger`, `vw_admin_system_metrics`, `vw_pending_bills`).
  - Implemented automated audit logging table tracking user logins, status changes, and critical operations.

---

## 3. Relational Schema & Mathematical Normalization

### 3.1 First Normal Form (1NF)
Each attribute contains atomic, indivisible values. Repeating groups from the unnormalized model were split into distinct relations:
* `User(user_id, full_name, date_of_birth, gender, email, phone_no, address, user_type)`
* `Login_Credentials(login_id, user_id, username, password_hash, created_at, last_login, failed_attempts, status)`
* `Profile(profile_id, user_id, profile_picture, occupation, preferred_language, bio, kyc_status)`
* `Settings(settings_id, user_id, theme, language, email_alerts, sms_alerts)`
* `Account(account_no, user_id, account_type, balance, currency, min_balance, date_opened, status)`
* `Card(card_id, account_no, card_number, card_type, name_on_card, expiry_date, cvv, daily_limit, status, issue_date)`
* `Beneficiary(beneficiary_id, user_id, name, account_no, bank_name, ifsc_code, transfer_type, status)`
* `Bill(bill_id, user_id, biller_name, biller_type, account_no, reference_no, amount, due_date, status, paid_at)`
* `Transaction(transaction_id, account_no, transaction_type, amount, transaction_time, balance_after, description, category, status, reference_id)`
* `Transfer(transfer_id, source_account_no, beneficiary_id, transaction_id, amount, transfer_date, purpose, remarks, status)`
* `Transaction_History(transaction_id, history_id, action, viewed_at, viewed_by, balance, remarks)`
* `Admin(admin_id, username, password_hash, name, email, role, phone_no, status, last_login)`
* `Audit_Logs(log_id, actor_type, actor_id, action, table_affected, record_id, details, ip_address, timestamp)`

### 3.2 Second Normal Form (2NF)
Satisfies 1NF and contains **no partial dependencies** where a non-prime attribute depends on only a subset of a composite candidate key:
- Single-attribute primary keys (`user_id`, `login_id`, `account_no`, `card_id`, `bill_id`, `transfer_id`, `admin_id`) trivially satisfy 2NF.
- Composite key relation `Transaction_History(transaction_id, history_id)`: attributes `viewed_at`, `viewed_by`, `balance` depend on the whole composite key `(transaction_id, history_id)`. Hence, in 2NF.

### 3.3 Third Normal Form (3NF)
Satisfies 2NF and contains **no transitive dependencies** ($X \rightarrow Y$ and $Y \rightarrow Z$ where $Z$ is non-prime):
- Non-key descriptive data (such as user address, account balances, or biller details) are not duplicated across related tables; foreign keys are utilized exclusively. Hence, in 3NF.

### 3.4 Boyce–Codd Normal Form (BCNF)
For every non-trivial functional dependency $X \rightarrow Y$, $X$ is a superkey:
- In `USERS`, $user\_id \rightarrow \text{attributes}$ and $email \rightarrow \text{attributes}$; both determinants are candidate keys.
- In `LOGIN_CREDENTIALS`, $login\_id$, $username$, and $user\_id$ are all unique determinants.
- In `ACCOUNTS`, $account\_no$ uniquely determines balance, account_type, and user_id.
- Hence, the finalized database schema is in **BCNF**.

---

## 4. Advanced Database Implementations

### 4.1 ACID-Compliant Fund Transfer Algorithm
```sql
START TRANSACTION;
-- 1. Lock sender account row to prevent race conditions (lost updates)
SELECT balance, min_balance FROM accounts WHERE account_no = p_source_acc FOR UPDATE;

-- 2. Verify solvency
IF (balance - amount) < min_balance THEN
    ROLLBACK; -- Reject transaction
END IF;

-- 3. Execute balanced debit and credit
UPDATE accounts SET balance = balance - amount WHERE account_no = p_source_acc;
UPDATE accounts SET balance = balance + amount WHERE account_no = p_dest_acc;

-- 4. Authoritative ledger entry
INSERT INTO transactions (...) VALUES (...);
INSERT INTO transfers (...) VALUES (...);
COMMIT;
```

### 4.2 Automated Database Triggers
1. **`trg_record_transaction_history`**: Fires `AFTER INSERT ON transactions` to automatically write into the weak historical entity `transaction_history`.
2. **`trg_prevent_negative_balance`**: Fires `BEFORE UPDATE ON accounts` to reject any operation attempting to write a negative balance.
3. **`trg_audit_transfer_insert`**: Fires `AFTER INSERT ON transfers` to log the event to `audit_logs`.
4. **`trg_after_login_update`**: Fires `AFTER UPDATE ON login_credentials` to maintain an audit trail of authenticated sessions.

### 4.3 Database Views
1. **`vw_customer_overview`**: Joins `users`, `accounts`, `cards`, and `bills` to aggregate customer total net worth, active card count, and pending liabilities.
2. **`vw_transfer_ledger`**: Provides a denormalized historical view joining source accounts, recipients, transfer remarks, and transaction references for statement printing.
3. **`vw_admin_system_metrics`**: Computes system-wide aggregate KPIs (total deposits, active customer count, 24-hour volume).
4. **`vw_pending_bills`**: Computes overdue status and days remaining until due dates across utility billers.

---

## 5. Technology Stack
* **Frontend:** Semantic HTML5, Glassmorphism CSS3, Responsive Grid/Flexbox, Vanilla ES6+ JavaScript.
* **Backend:** Python Flask RESTful Microframework with Flask-CORS.
* **Database Layer:** Dual-Engine Architecture:
  - **SQLite 3:** Zero-configuration instant execution for grading & portability.
  - **MySQL 8.0:** Production enterprise relational database scripts (`schema_mysql.sql`, `seed_data.sql`).

---

## 6. Viva / Oral Defense Questions Cheat Sheet

**Q1: How does your database ensure that two transfers at the same second don't overdraft an account?**  
*Answer (Rudra/Nithya):* "We use ACID transactions with row-level pessimistic locking (`FOR UPDATE` in MySQL and atomic transactions in SQLite). When a debit is initiated, the account row is locked, its balance verified against the minimum balance constraint, updated, and only released upon commit. If funds are insufficient, a rollback is executed."

**Q2: Why did you separate `USERS` and `LOGIN_CREDENTIALS` into two tables?**  
*Answer (Mehrin):* "To enforce the principle of least privilege and strict 1:1 normalization in BCNF. Identity data (name, DOB, phone, address) changes infrequently and may be displayed in profiles, whereas authentication data (password hashes, failed attempts, lock states) is security-critical and should not be accessed by regular profile queries."

**Q3: How is the Transfer relationship modeled in your ER diagram?**  
*Answer (Rudra/Varun):* "Transfer is modeled as a **Ternary Relationship** connecting the source `ACCOUNT`, the recipient `BENEFICIARY`, and the resulting financial `TRANSACTION`. Each participant's descriptive attributes remain in their own relation, while `TRANSFERS` stores transfer-specific metadata like amount, purpose, and date."

**Q4: How do triggers assist your application?**  
*Answer (Varun/Nithya):* "Triggers enforce automated data integrity at the database layer independently of application logic. For example, `trg_record_transaction_history` automatically writes to the weak historical ledger, while `trg_prevent_negative_balance` acts as an absolute safety net preventing negative balances even if raw SQL is executed."

---
*Submitted for evaluation in partial fulfillment of the requirements for 23CSE202 Database Management Systems, Amrita Vishwa Vidyapeetham.*
