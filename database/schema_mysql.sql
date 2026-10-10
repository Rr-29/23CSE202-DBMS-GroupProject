-- =====================================================================
-- Course: 23CSE202 Database Management Systems
-- Project: Aureon - Internet Banking System
-- Group No: D4 (Amrita School of Computing, Amritapuri Campus)
--
-- Contributors & Module Distribution:
--   1. Mehrin A S     (AM.SC.U4CSE25332) - User Auth, Credentials & Profile Module
--   2. Nithya Ajay     (AM.SC.U4CSE25339) - Accounts & Cards Management Module
--   3. Rudra Rajagopal (AM.SC.U4CSE25344) - Fund Transfers & ACID Transactions Module
--   4. Varun Nair      (AM.SC.U4CSE25356) - Utility Bills, Admin Console & Triggers Module
--
-- Relational Schema: 3NF & BCNF Compliant
-- Target Database: MySQL 8.0+
-- =====================================================================

DROP DATABASE IF EXISTS aureon_db;
CREATE DATABASE aureon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aureon_db;

-- ---------------------------------------------------------------------
-- 1. USERS TABLE (Core Identity) - Module: Mehrin A S
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone_no VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    user_type ENUM('Customer', 'Admin', 'Staff') DEFAULT 'Customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. LOGIN_CREDENTIALS TABLE (Separated Auth Entity) - Module: Mehrin A S
-- ---------------------------------------------------------------------
CREATE TABLE login_credentials (
    login_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    transfer_password_hash VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    failed_attempts INT DEFAULT 0,
    status ENUM('Active', 'Locked', 'Suspended') DEFAULT 'Active',
    CONSTRAINT fk_login_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. PROFILES TABLE (User Profile Information) - Module: Mehrin A S
-- ---------------------------------------------------------------------
CREATE TABLE profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    profile_picture LONGTEXT,
    occupation VARCHAR(100) DEFAULT 'Professional',
    preferred_language VARCHAR(50) DEFAULT 'English (US)',
    bio TEXT,
    kyc_status ENUM('Verified', 'Pending', 'Rejected') DEFAULT 'Verified',
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. SETTINGS TABLE (User Preferences) - Module: Mehrin A S
-- ---------------------------------------------------------------------
CREATE TABLE settings (
    settings_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    theme ENUM('light', 'dark', 'system') DEFAULT 'light',
    language VARCHAR(50) DEFAULT 'English',
    security_preferences VARCHAR(255) DEFAULT '{"two_factor": true, "sms_alerts": true, "email_alerts": true}',
    email_alerts BOOLEAN DEFAULT TRUE,
    sms_alerts BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. ACCOUNTS TABLE (Bank Accounts) - Module: Nithya Ajay
-- ---------------------------------------------------------------------
CREATE TABLE accounts (
    account_no VARCHAR(20) PRIMARY KEY,
    user_id INT NOT NULL,
    account_type ENUM('Savings', 'Checking', 'Fixed Deposit', 'Investment') DEFAULT 'Savings',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(5) DEFAULT 'USD',
    min_balance DECIMAL(10, 2) DEFAULT 50.00,
    date_opened DATE NOT NULL,
    status ENUM('Active', 'Frozen', 'Dormant', 'Closed') DEFAULT 'Active',
    CONSTRAINT chk_account_balance CHECK (balance >= 0.00),
    CONSTRAINT fk_account_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. CARDS TABLE (Debit / Credit / Virtual Cards) - Module: Nithya Ajay
-- ---------------------------------------------------------------------
CREATE TABLE cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    account_no VARCHAR(20) NOT NULL,
    card_number VARCHAR(19) NOT NULL UNIQUE,
    card_type ENUM('Debit', 'Credit', 'Virtual') DEFAULT 'Debit',
    name_on_card VARCHAR(100) NOT NULL,
    expiry_date VARCHAR(7) NOT NULL, -- Format MM/YY
    cvv VARCHAR(4) NOT NULL,
    daily_limit DECIMAL(12, 2) DEFAULT 5000.00,
    status ENUM('Active', 'Frozen', 'Blocked', 'Expired') DEFAULT 'Active',
    issue_date DATE NOT NULL,
    CONSTRAINT fk_card_account FOREIGN KEY (account_no) 
        REFERENCES accounts(account_no) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. BENEFICIARIES TABLE (Transfer Recipients) - Module: Rudra Rajagopal
-- ---------------------------------------------------------------------
CREATE TABLE beneficiaries (
    beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_no VARCHAR(30) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    transfer_type ENUM('Internal', 'NEFT', 'RTGS', 'IMPS') DEFAULT 'Internal',
    status ENUM('Active', 'Pending', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_beneficiary_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. BILLS TABLE (Utility & Services Billing) - Module: Varun Nair
-- ---------------------------------------------------------------------
CREATE TABLE bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    biller_type ENUM('Electricity', 'Water', 'Internet', 'Mobile', 'Credit Card', 'Insurance', 'Rent') NOT NULL,
    account_no VARCHAR(20) NULL,
    reference_no VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('Unpaid', 'Paid', 'Overdue') DEFAULT 'Unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME NULL,
    CONSTRAINT chk_bill_amount CHECK (amount > 0.00),
    CONSTRAINT fk_bill_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bill_account FOREIGN KEY (account_no) 
        REFERENCES accounts(account_no) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. TRANSACTIONS TABLE (Authoritative Financial Events) - Module: Rudra Rajagopal
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    account_no VARCHAR(20) NOT NULL,
    transaction_type ENUM('Credit', 'Debit', 'Transfer') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    balance_after DECIMAL(15, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    status ENUM('Completed', 'Pending', 'Failed') DEFAULT 'Completed',
    reference_id VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT chk_txn_amount CHECK (amount > 0.00),
    CONSTRAINT fk_txn_account FOREIGN KEY (account_no) 
        REFERENCES accounts(account_no) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. TRANSFERS TABLE (Ternary Relationship: Source, Beneficiary, Txn) - Module: Rudra Rajagopal
-- ---------------------------------------------------------------------
CREATE TABLE transfers (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,
    source_account_no VARCHAR(20) NOT NULL,
    beneficiary_id INT NULL,
    transaction_id INT NOT NULL UNIQUE,
    amount DECIMAL(15, 2) NOT NULL,
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purpose VARCHAR(100) DEFAULT 'Personal',
    remarks TEXT,
    status ENUM('Completed', 'Pending', 'Failed', 'Cancelled') DEFAULT 'Completed',
    CONSTRAINT chk_transfer_amount CHECK (amount > 0.00),
    CONSTRAINT fk_transfer_source FOREIGN KEY (source_account_no) 
        REFERENCES accounts(account_no) ON DELETE RESTRICT,
    CONSTRAINT fk_transfer_beneficiary FOREIGN KEY (beneficiary_id) 
        REFERENCES beneficiaries(beneficiary_id) ON DELETE SET NULL,
    CONSTRAINT fk_transfer_txn FOREIGN KEY (transaction_id) 
        REFERENCES transactions(transaction_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. TRANSACTION_HISTORY TABLE (Weak Entity Dependent on Transaction) - Module: Rudra Rajagopal
-- ---------------------------------------------------------------------
CREATE TABLE transaction_history (
    history_id INT AUTO_INCREMENT,
    transaction_id INT NOT NULL,
    action VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    viewed_by VARCHAR(100) DEFAULT 'SYSTEM',
    balance DECIMAL(15, 2) NOT NULL,
    remarks VARCHAR(255) DEFAULT 'System Ledger Entry',
    PRIMARY KEY (transaction_id, history_id),
    KEY (history_id),
    CONSTRAINT fk_history_txn FOREIGN KEY (transaction_id) 
        REFERENCES transactions(transaction_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. ADMIN TABLE (Administrative Management) - Module: Varun Nair
-- ---------------------------------------------------------------------
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    role ENUM('SuperAdmin', 'Manager', 'Auditor') DEFAULT 'SuperAdmin',
    phone_no VARCHAR(20) NOT NULL,
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 13. AUDIT_LOGS TABLE (Security & Compliance Tracking) - Module: Varun Nair
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    actor_type ENUM('User', 'Admin', 'System') NOT NULL,
    actor_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_affected VARCHAR(50) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- DATABASE VIEWS (Relational Abstractions)
-- =====================================================================

-- View 1: Customer Overview (Aggregates balances and entity counts) - Module: Nithya Ajay
CREATE OR REPLACE VIEW vw_customer_overview AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.phone_no,
    COUNT(DISTINCT a.account_no) AS total_accounts,
    COALESCE(SUM(a.balance), 0.00) AS total_balance,
    COUNT(DISTINCT c.card_id) AS total_cards,
    COUNT(DISTINCT b.bill_id) AS pending_bills_count
FROM users u
LEFT JOIN accounts a ON u.user_id = a.user_id AND a.status = 'Active'
LEFT JOIN cards c ON a.account_no = c.account_no AND c.status = 'Active'
LEFT JOIN bills b ON u.user_id = b.user_id AND b.status = 'Unpaid'
GROUP BY u.user_id, u.full_name, u.email, u.phone_no;

-- View 2: Transfer Ledger (Complete audit view for transfers) - Module: Rudra Rajagopal
CREATE OR REPLACE VIEW vw_transfer_ledger AS
SELECT 
    t.transfer_id,
    t.transfer_date,
    t.amount,
    t.purpose,
    t.remarks,
    t.status,
    a.account_no AS source_account,
    u.full_name AS sender_name,
    COALESCE(b.name, 'External Account') AS recipient_name,
    COALESCE(b.bank_name, 'Aureon Internal') AS recipient_bank,
    COALESCE(b.account_no, 'Direct') AS recipient_account,
    tx.reference_id
FROM transfers t
JOIN accounts a ON t.source_account_no = a.account_no
JOIN users u ON a.user_id = u.user_id
JOIN transactions tx ON t.transaction_id = tx.transaction_id
LEFT JOIN beneficiaries b ON t.beneficiary_id = b.beneficiary_id;

-- View 3: Admin System Metrics (High level KPI metrics) - Module: Varun Nair
CREATE OR REPLACE VIEW vw_admin_system_metrics AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE user_type = 'Customer') AS total_customers,
    (SELECT COUNT(*) FROM accounts WHERE status = 'Active') AS active_accounts,
    (SELECT COALESCE(SUM(balance), 0.00) FROM accounts WHERE status = 'Active') AS total_system_deposits,
    (SELECT COUNT(*) FROM transactions WHERE DATE(transaction_time) = CURDATE()) AS today_transactions_count,
    (SELECT COALESCE(SUM(amount), 0.00) FROM transactions WHERE DATE(transaction_time) = CURDATE()) AS today_volume,
    (SELECT COUNT(*) FROM bills WHERE status = 'Unpaid') AS total_pending_bills;

-- View 4: Pending Bills Summary - Module: Varun Nair
CREATE OR REPLACE VIEW vw_pending_bills AS
SELECT 
    b.bill_id,
    b.user_id,
    u.full_name,
    u.email,
    b.biller_name,
    b.biller_type,
    b.reference_no,
    b.amount,
    b.due_date,
    DATEDIFF(b.due_date, CURDATE()) AS days_until_due
FROM bills b
JOIN users u ON b.user_id = u.user_id
WHERE b.status = 'Unpaid'
ORDER BY b.due_date ASC;

-- =====================================================================
-- STORED PROCEDURES (ACID Encapsulation)
-- =====================================================================

DELIMITER $$

-- Procedure 1: Process Fund Transfer (Ternary Relationship Execution) - Module: Rudra Rajagopal
CREATE PROCEDURE sp_process_transfer(
    IN p_source_acc VARCHAR(20),
    IN p_beneficiary_id INT,
    IN p_dest_acc VARCHAR(20),
    IN p_amount DECIMAL(15, 2),
    IN p_purpose VARCHAR(100),
    IN p_remarks VARCHAR(255),
    OUT p_status VARCHAR(20),
    OUT p_message VARCHAR(255),
    OUT p_ref_id VARCHAR(50)
)
proc_label: BEGIN
    DECLARE v_src_balance DECIMAL(15, 2);
    DECLARE v_src_min DECIMAL(10, 2);
    DECLARE v_new_src_balance DECIMAL(15, 2);
    DECLARE v_txn_id INT;
    DECLARE v_ref VARCHAR(50);
    DECLARE v_dest_exists INT DEFAULT 0;
    
    -- Error Handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'FAILED';
        SET p_message = 'Transaction aborted due to internal database error.';
        SET p_ref_id = NULL;
    END;

    START TRANSACTION;

    -- Validate Source Account
    SELECT balance, min_balance INTO v_src_balance, v_src_min
    FROM accounts
    WHERE account_no = p_source_acc AND status = 'Active'
    FOR UPDATE;

    IF v_src_balance IS NULL THEN
        ROLLBACK;
        SET p_status = 'FAILED';
        SET p_message = 'Source account is invalid, frozen, or closed.';
        SET p_ref_id = NULL;
        LEAVE proc_label;
    END IF;

    -- Verify Sufficient Funds
    IF (v_src_balance - p_amount) < v_src_min THEN
        ROLLBACK;
        SET p_status = 'FAILED';
        SET p_message = 'Insufficient funds. Account balance cannot drop below minimum balance.';
        SET p_ref_id = NULL;
        LEAVE proc_label;
    END IF;

    -- Generate Reference ID
    SET v_ref = CONCAT('TXN', UNIX_TIMESTAMP(), FLOOR(1000 + (RAND() * 9000)));
    SET v_new_src_balance = v_src_balance - p_amount;

    -- Deduct from Source Account
    UPDATE accounts 
    SET balance = v_new_src_balance 
    WHERE account_no = p_source_acc;

    -- Record Debit Transaction
    INSERT INTO transactions (
        account_no, transaction_type, amount, balance_after, description, category, status, reference_id
    ) VALUES (
        p_source_acc, 'Debit', p_amount, v_new_src_balance, 
        CONCAT('Transfer to ', COALESCE((SELECT name FROM beneficiaries WHERE beneficiary_id = p_beneficiary_id), p_dest_acc)),
        'Transfer', 'Completed', v_ref
    );
    SET v_txn_id = LAST_INSERT_ID();

    -- Record Transfer Entity
    INSERT INTO transfers (
        source_account_no, beneficiary_id, transaction_id, amount, purpose, remarks, status
    ) VALUES (
        p_source_acc, p_beneficiary_id, v_txn_id, p_amount, p_purpose, p_remarks, 'Completed'
    );

    -- Credit Destination Account if it is an internal Aureon account
    IF p_dest_acc IS NOT NULL AND p_dest_acc != '' THEN
        SELECT COUNT(*) INTO v_dest_exists FROM accounts WHERE account_no = p_dest_acc AND status = 'Active';
        IF v_dest_exists > 0 THEN
            UPDATE accounts 
            SET balance = balance + p_amount 
            WHERE account_no = p_dest_acc;

            INSERT INTO transactions (
                account_no, transaction_type, amount, balance_after, description, category, status, reference_id
            ) VALUES (
                p_dest_acc, 'Credit', p_amount, 
                (SELECT balance FROM accounts WHERE account_no = p_dest_acc),
                CONCAT('Received transfer from ', p_source_acc),
                'Transfer', 'Completed', CONCAT(v_ref, '-CR')
            );
        END IF;
    END IF;

    -- Audit Log
    INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details)
    VALUES ('User', (SELECT user_id FROM accounts WHERE account_no = p_source_acc), 'TRANSFER_EXECUTE', 'transfers', LAST_INSERT_ID(), CONCAT('Amount: $', p_amount, ' Ref: ', v_ref));

    COMMIT;
    SET p_status = 'SUCCESS';
    SET p_message = 'Transfer processed successfully.';
    SET p_ref_id = v_ref;
END $$


-- Procedure 2: Pay Utility Bill - Module: Varun Nair
CREATE PROCEDURE sp_pay_bill(
    IN p_user_id INT,
    IN p_bill_id INT,
    IN p_account_no VARCHAR(20),
    OUT p_status VARCHAR(20),
    OUT p_message VARCHAR(255)
)
bill_label: BEGIN
    DECLARE v_amount DECIMAL(10, 2);
    DECLARE v_bill_status VARCHAR(20);
    DECLARE v_acc_balance DECIMAL(15, 2);
    DECLARE v_min_balance DECIMAL(10, 2);
    DECLARE v_biller VARCHAR(100);
    DECLARE v_ref VARCHAR(50);
    DECLARE v_new_balance DECIMAL(15, 2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'FAILED';
        SET p_message = 'Failed to execute bill payment due to database error.';
    END;

    START TRANSACTION;

    SELECT amount, status, biller_name INTO v_amount, v_bill_status, v_biller
    FROM bills WHERE bill_id = p_bill_id AND user_id = p_user_id
    FOR UPDATE;

    IF v_amount IS NULL THEN
        ROLLBACK;
        SET p_status = 'FAILED';
        SET p_message = 'Bill not found or unauthorized.';
        LEAVE bill_label;
    END IF;

    IF v_bill_status = 'Paid' THEN
        ROLLBACK;
        SET p_status = 'FAILED';
        SET p_message = 'This bill has already been paid.';
        LEAVE bill_label;
    END IF;

    SELECT balance, min_balance INTO v_acc_balance, v_min_balance
    FROM accounts WHERE account_no = p_account_no AND user_id = p_user_id AND status = 'Active'
    FOR UPDATE;

    IF v_acc_balance IS NULL OR (v_acc_balance - v_amount) < v_min_balance THEN
        ROLLBACK;
        SET p_status = 'FAILED';
        SET p_message = 'Insufficient balance in selected account to cover the bill.';
        LEAVE bill_label;
    END IF;

    SET v_new_balance = v_acc_balance - v_amount;
    SET v_ref = CONCAT('BILL', UNIX_TIMESTAMP());

    -- Deduct
    UPDATE accounts SET balance = v_new_balance WHERE account_no = p_account_no;

    -- Update bill
    UPDATE bills 
    SET status = 'Paid', account_no = p_account_no, paid_at = NOW() 
    WHERE bill_id = p_bill_id;

    -- Record transaction
    INSERT INTO transactions (
        account_no, transaction_type, amount, balance_after, description, category, status, reference_id
    ) VALUES (
        p_account_no, 'Debit', v_amount, v_new_balance,
        CONCAT('Bill Payment: ', v_biller), 'Utilities', 'Completed', v_ref
    );

    COMMIT;
    SET p_status = 'SUCCESS';
    SET p_message = CONCAT('Payment of $', v_amount, ' to ', v_biller, ' completed successfully.');
END $$


-- Procedure 3: Open New Account - Module: Nithya Ajay
CREATE PROCEDURE sp_open_account(
    IN p_user_id INT,
    IN p_account_type VARCHAR(20),
    IN p_initial_deposit DECIMAL(15, 2),
    OUT p_account_no VARCHAR(20)
)
BEGIN
    DECLARE v_acc_no VARCHAR(20);
    SET v_acc_no = CONCAT('AUR', LPAD(FLOOR(RAND() * 10000000000), 10, '0'));

    INSERT INTO accounts (account_no, user_id, account_type, balance, date_opened, status)
    VALUES (v_acc_no, p_user_id, p_account_type, p_initial_deposit, CURDATE(), 'Active');

    IF p_initial_deposit > 0 THEN
        INSERT INTO transactions (
            account_no, transaction_type, amount, balance_after, description, category, status, reference_id
        ) VALUES (
            v_acc_no, 'Credit', p_initial_deposit, p_initial_deposit,
            'Initial Account Opening Deposit', 'Deposit', 'Completed', CONCAT('INIT', UNIX_TIMESTAMP())
        );
    END IF;

    SET p_account_no = v_acc_no;
END $$

DELIMITER ;

-- =====================================================================
-- DATABASE TRIGGERS (Automated Integrity Enforcement)
-- =====================================================================

DELIMITER $$

-- Trigger 1: Record Transaction History Weak Entity Automatically - Module: Rudra Rajagopal
CREATE TRIGGER trg_record_transaction_history
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO transaction_history (
        transaction_id, action, viewed_at, viewed_by, balance, remarks
    ) VALUES (
        NEW.transaction_id, 'SYSTEM_LOG', NOW(), 'DATABASE_TRIGGER', NEW.balance_after,
        CONCAT('Auto-logged transaction ', NEW.reference_id, ' (', NEW.transaction_type, ' $', NEW.amount, ')')
    );
END $$

-- Trigger 2: Prevent Negative Balance Safety Net - Module: Nithya Ajay
CREATE TRIGGER trg_prevent_negative_balance
BEFORE UPDATE ON accounts
FOR EACH ROW
BEGIN
    IF NEW.balance < 0.00 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Violation: Account balance cannot become negative.';
    END IF;
END $$

-- Trigger 3: Audit Transfers on Insert - Module: Varun Nair
CREATE TRIGGER trg_audit_transfer_insert
AFTER INSERT ON transfers
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        actor_type, actor_id, action, table_affected, record_id, details
    ) VALUES (
        'System', 1, 'TRIGGER_TRANSFER_LOG', 'transfers', NEW.transfer_id,
        CONCAT('Transfer of $', NEW.amount, ' registered on account ', NEW.source_account_no)
    );
END $$

-- Trigger 4: Track Login Attempts - Module: Mehrin A S
CREATE TRIGGER trg_after_login_update
AFTER UPDATE ON login_credentials
FOR EACH ROW
BEGIN
    IF NEW.last_login != OLD.last_login THEN
        INSERT INTO audit_logs (
            actor_type, actor_id, action, table_affected, record_id, details
        ) VALUES (
            'User', NEW.user_id, 'USER_LOGIN_SUCCESS', 'login_credentials', NEW.login_id,
            CONCAT('User authenticated at ', NEW.last_login)
        );
    END IF;
END $$

DELIMITER ;
