-- =====================================================================
-- Course: 23CSE202 Database Management Systems
-- Project: Aureon - Internet Banking System
-- Group No: D4 (Amrita School of Computing, Amritapuri Campus)
--
-- Seed Data Script
-- Team Members Included:
--   1. Mehrin A S     (AM.SC.U4CSE25332)
--   2. Nithya Ajay     (AM.SC.U4CSE25339)
--   3. Rudra Rajagopal (AM.SC.U4CSE25344)
--   4. Varun Nair      (AM.SC.U4CSE25356)
-- Target Database: MySQL 8.0+
-- =====================================================================

USE aureon_db;

-- ---------------------------------------------------------------------
-- 1. SEED USERS
-- ---------------------------------------------------------------------
INSERT INTO users (user_id, full_name, date_of_birth, gender, email, phone_no, address, user_type) VALUES
(1, 'Alex User', '1998-04-15', 'Male', 'user@aureon.com', '+1 987 654 3210', '245 Park Avenue, New York, NY 10017', 'Customer'),
(2, 'Mehrin A S', '2004-09-12', 'Female', 'mehrin@aureon.com', '+91 94471 23332', 'Amrita Nagar, Clappana PO, Kollam, Kerala 690525', 'Customer'),
(3, 'Nithya Ajay', '2004-06-25', 'Female', 'nithya@aureon.com', '+91 98460 23339', 'Haripad, Alappuzha, Kerala 690514', 'Customer'),
(4, 'Rudra Rajagopal', '2004-11-29', 'Male', 'rudra@aureon.com', '+91 97455 23344', 'Kadavanthra, Kochi, Kerala 682020', 'Customer'),
(5, 'Varun Nair', '2004-03-18', 'Male', 'varun@aureon.com', '+91 96332 23356', 'Kowdiar, Thiruvananthapuram, Kerala 695003', 'Customer'),
(6, 'Elena Gilbert', '1995-07-21', 'Female', 'elena.g@example.com', '+1 415 889 1204', '742 Evergreen Terrace, Springfield, OR', 'Customer'),
(7, 'Marcus Vance', '1989-12-03', 'Male', 'marcus.v@example.com', '+1 312 455 9812', '1000 Michigan Ave, Chicago, IL', 'Customer');

-- ---------------------------------------------------------------------
-- 2. SEED LOGIN CREDENTIALS (Default passwords: User@123)
-- SHA-256 for 'User@123': 0a3b8364... (or stored hash)
-- ---------------------------------------------------------------------
INSERT INTO login_credentials (user_id, username, password_hash, status) VALUES
(1, 'alex_user', 'scrypt:32768:8:1$User@123$securehash', 'Active'),
(2, 'mehrin_as', 'scrypt:32768:8:1$User@123$securehash', 'Active'),
(3, 'nithya_ajay', 'scrypt:32768:8:1$User@123$securehash', 'Active'),
(4, 'rudra_r', 'scrypt:32768:8:1$User@123$securehash', 'Active'),
(5, 'varun_nair', 'scrypt:32768:8:1$User@123$securehash', 'Active'),
(6, 'elena_gilbert', 'scrypt:32768:8:1$User@123$securehash', 'Active'),
(7, 'marcus_v', 'scrypt:32768:8:1$User@123$securehash', 'Active');

-- ---------------------------------------------------------------------
-- 3. SEED PROFILES
-- ---------------------------------------------------------------------
INSERT INTO profiles (user_id, profile_picture, occupation, preferred_language, bio, kyc_status) VALUES
(1, 'assets/images/profile.png', 'Senior Software Engineer', 'English (US)', 'Tech enthusiast, digital banking advocate, and traveler.', 'Verified'),
(2, 'assets/images/profile.png', 'Cybersecurity Specialist', 'English', 'Passionate about secure authentication systems and cryptography.', 'Verified'),
(3, 'assets/images/profile.png', 'Financial Analyst', 'English', 'Specialized in core banking operations and card ecosystem management.', 'Verified'),
(4, 'assets/images/profile.png', 'Full-Stack Developer', 'English', 'Focused on distributed transaction systems and real-time ledgers.', 'Verified'),
(5, 'assets/images/profile.png', 'Database Architect', 'English', 'Enthusiastic about database indexing, triggers, and transactional integrity.', 'Verified'),
(6, 'assets/images/profile.png', 'UX Designer', 'English', 'Designing delightful intuitive digital banking experiences.', 'Verified'),
(7, 'assets/images/profile.png', 'Business Consultant', 'English', 'Corporate financial advisory and investments.', 'Verified');

-- ---------------------------------------------------------------------
-- 4. SEED SETTINGS
-- ---------------------------------------------------------------------
INSERT INTO settings (user_id, theme, language, email_alerts, sms_alerts) VALUES
(1, 'light', 'English', TRUE, TRUE),
(2, 'dark', 'English', TRUE, TRUE),
(3, 'light', 'English', TRUE, FALSE),
(4, 'dark', 'English', TRUE, TRUE),
(5, 'system', 'English', TRUE, TRUE),
(6, 'light', 'English', FALSE, TRUE),
(7, 'light', 'English', TRUE, TRUE);

-- ---------------------------------------------------------------------
-- 5. SEED ACCOUNTS
-- ---------------------------------------------------------------------
INSERT INTO accounts (account_no, user_id, account_type, balance, currency, min_balance, date_opened, status) VALUES
('AUR100234821', 1, 'Savings', 18580.75, 'USD', 100.00, '2024-01-15', 'Active'),
('AUR100239258', 1, 'Checking', 6000.00, 'USD', 50.00, '2024-03-20', 'Active'),
('AUR100234822', 2, 'Savings', 24500.00, 'USD', 100.00, '2024-02-10', 'Active'),
('AUR100234823', 3, 'Savings', 19850.50, 'USD', 100.00, '2024-02-14', 'Active'),
('AUR100234824', 4, 'Savings', 32400.00, 'USD', 100.00, '2024-01-05', 'Active'),
('AUR100234825', 5, 'Savings', 16750.25, 'USD', 100.00, '2024-02-18', 'Active'),
('AUR100234826', 6, 'Checking', 8400.00, 'USD', 50.00, '2024-04-12', 'Active'),
('AUR100234827', 7, 'Savings', 45200.00, 'USD', 100.00, '2024-03-01', 'Active');

-- ---------------------------------------------------------------------
-- 6. SEED CARDS
-- ---------------------------------------------------------------------
INSERT INTO cards (card_id, account_no, card_number, card_type, name_on_card, expiry_date, cvv, daily_limit, status, issue_date) VALUES
(1, 'AUR100234821', '4532 8921 4410 4821', 'Debit', 'Alex User', '08/29', '421', 5000.00, 'Active', '2024-01-15'),
(2, 'AUR100239258', '5412 7512 8823 9258', 'Credit', 'Alex User', '11/28', '852', 8000.00, 'Active', '2024-03-20'),
(3, 'AUR100234821', '4111 2222 3333 4444', 'Virtual', 'Alex User', '12/27', '910', 2000.00, 'Active', '2024-05-10'),
(4, 'AUR100234822', '4532 9901 2234 3321', 'Debit', 'Mehrin A S', '09/29', '332', 5000.00, 'Active', '2024-02-10'),
(5, 'AUR100234823', '4532 8812 3345 3391', 'Debit', 'Nithya Ajay', '06/29', '339', 5000.00, 'Active', '2024-02-14'),
(6, 'AUR100234824', '4532 7723 4456 3441', 'Debit', 'Rudra Rajagopal', '11/29', '344', 5000.00, 'Active', '2024-01-05'),
(7, 'AUR100234825', '4532 6634 5567 3561', 'Debit', 'Varun Nair', '03/29', '356', 5000.00, 'Active', '2024-02-18');

-- ---------------------------------------------------------------------
-- 7. SEED BENEFICIARIES
-- ---------------------------------------------------------------------
INSERT INTO beneficiaries (beneficiary_id, user_id, name, account_no, bank_name, ifsc_code, transfer_type, status) VALUES
(1, 1, 'Sarah Williams', 'AUR100234822', 'Aureon Bank', 'AURN0001001', 'Internal', 'Active'),
(2, 1, 'Michael Brown', '982145710239', 'JPMorgan Chase', 'CHASUS33', 'NEFT', 'Active'),
(3, 1, 'Alex Johnson', '441029381023', 'Bank of America', 'BOFAUS3N', 'IMPS', 'Active'),
(4, 1, 'Emily Davis', '671209384711', 'Wells Fargo', 'WFBIUS6S', 'NEFT', 'Active'),
(5, 2, 'Rudra Rajagopal', 'AUR100234824', 'Aureon Bank', 'AURN0001001', 'Internal', 'Active'),
(6, 3, 'Varun Nair', 'AUR100234825', 'Aureon Bank', 'AURN0001001', 'Internal', 'Active'),
(7, 4, 'Mehrin A S', 'AUR100234822', 'Aureon Bank', 'AURN0001001', 'Internal', 'Active'),
(8, 5, 'Nithya Ajay', 'AUR100234823', 'Aureon Bank', 'AURN0001001', 'Internal', 'Active');

-- ---------------------------------------------------------------------
-- 8. SEED BILLS
-- ---------------------------------------------------------------------
INSERT INTO bills (bill_id, user_id, biller_name, biller_type, account_no, reference_no, amount, due_date, status, paid_at) VALUES
(1, 1, 'ConEdison Power Grid', 'Electricity', NULL, 'ELEC-99214', 128.50, '2026-10-25', 'Unpaid', NULL),
(2, 1, 'Verizon Fiber Gigabit', 'Internet', NULL, 'NET-44810', 79.99, '2026-10-28', 'Unpaid', NULL),
(3, 1, 'Metro Municipal Water', 'Water', NULL, 'WTR-11923', 42.10, '2026-11-02', 'Unpaid', NULL),
(4, 1, 'Apex Platinum Credit Card', 'Credit Card', NULL, 'CC-55219', 450.00, '2026-10-20', 'Unpaid', NULL),
(5, 1, 'Cityview Highrise Rent', 'Rent', 'AUR100234821', 'RNT-202609', 1850.00, '2026-10-01', 'Paid', '2026-09-30 14:15:00'),
(6, 2, 'Kerala State Electricity Board', 'Electricity', NULL, 'KSEB-48190', 65.00, '2026-10-24', 'Unpaid', NULL),
(7, 3, 'BSNL Bharat Fiber', 'Internet', NULL, 'BSNL-10294', 49.99, '2026-10-27', 'Unpaid', NULL),
(8, 4, 'Jio AirFiber 5G', 'Internet', NULL, 'JIO-882194', 59.99, '2026-10-26', 'Unpaid', NULL),
(9, 5, 'Municipal Water Corp', 'Water', NULL, 'WTR-44021', 35.50, '2026-11-05', 'Unpaid', NULL);

-- ---------------------------------------------------------------------
-- 9. SEED TRANSACTIONS
-- ---------------------------------------------------------------------
INSERT INTO transactions (transaction_id, account_no, transaction_type, amount, transaction_time, balance_after, description, category, status, reference_id) VALUES
(1, 'AUR100234821', 'Credit', 4500.00, '2026-10-01 09:30:00', 21450.00, 'Monthly Corporate Salary Credit', 'Income', 'Completed', 'TXN105421'),
(2, 'AUR100234821', 'Debit', 1850.00, '2026-10-01 14:15:00', 19600.00, 'Cityview Rent Payment', 'Rent', 'Completed', 'TXN105390'),
(3, 'AUR100234821', 'Debit', 189.99, '2026-10-03 16:42:00', 19410.01, 'Amazon Electronics Purchase', 'Shopping', 'Completed', 'TXN105312'),
(4, 'AUR100234821', 'Debit', 86.50, '2026-10-05 11:20:00', 19323.51, 'Electricity Utility Settlement', 'Utilities', 'Completed', 'TXN105284'),
(5, 'AUR100234821', 'Debit', 15.99, '2026-10-06 19:10:00', 19307.52, 'Netflix 4K Subscription', 'Subscription', 'Completed', 'TXN105250'),
(6, 'AUR100234821', 'Debit', 500.00, '2026-10-08 10:15:00', 18807.52, 'Transfer to Sarah Williams', 'Transfer', 'Completed', 'TXN105215'),
(7, 'AUR100234821', 'Debit', 226.77, '2026-10-09 17:35:00', 18580.75, 'Whole Foods Grocery Store', 'Groceries', 'Completed', 'TXN105189'),
(8, 'AUR100239258', 'Credit', 6000.00, '2026-09-15 12:00:00', 6000.00, 'Opening Balance Transfer', 'Deposit', 'Completed', 'TXN100010');

-- ---------------------------------------------------------------------
-- 10. SEED TRANSFERS
-- ---------------------------------------------------------------------
INSERT INTO transfers (transfer_id, source_account_no, beneficiary_id, transaction_id, amount, transfer_date, purpose, remarks, status) VALUES
(1, 'AUR100234821', 1, 6, 500.00, '2026-10-08 10:15:00', 'Personal', 'Project group contribution reimbursement', 'Completed');

-- ---------------------------------------------------------------------
-- 11. SEED TRANSACTION HISTORY (Weak Entity)
-- ---------------------------------------------------------------------
INSERT INTO transaction_history (transaction_id, action, viewed_at, viewed_by, balance, remarks) VALUES
(1, 'CREATED', '2026-10-01 09:30:00', 'PAYROLL_SYSTEM', 21450.00, 'Direct deposit automated batch'),
(2, 'CREATED', '2026-10-01 14:15:00', 'WEB_PORTAL', 19600.00, 'Online scheduled rent transfer'),
(3, 'CREATED', '2026-10-03 16:42:00', 'GATEWAY_API', 19410.01, 'E-Commerce card authorization'),
(4, 'CREATED', '2026-10-05 11:20:00', 'BILL_PAY_PROC', 19323.51, 'Automated bill debit'),
(5, 'CREATED', '2026-10-06 19:10:00', 'RECURRING_SUB', 19307.52, 'Subscription mandate charge'),
(6, 'CREATED', '2026-10-08 10:15:00', 'WEB_PORTAL', 18807.52, 'Fund transfer to beneficiary Sarah Williams'),
(7, 'CREATED', '2026-10-09 17:35:00', 'POS_TERMINAL', 18580.75, 'Contactless card POS terminal payment');

-- ---------------------------------------------------------------------
-- 12. SEED ADMINS (Default password: Admin@123)
-- ---------------------------------------------------------------------
INSERT INTO admins (admin_id, username, password_hash, name, email, role, phone_no, status, last_login) VALUES
(1, 'admin@aureon.com', 'scrypt:32768:8:1$Admin@123$securehash', 'Aureon System Administrator', 'admin@aureon.com', 'SuperAdmin', '+1 800 555 0199', 'Active', '2026-10-09 18:45:00'),
(2, 'varun.admin', 'scrypt:32768:8:1$Admin@123$securehash', 'Varun Nair (Admin Lead)', 'varun.admin@aureon.com', 'Manager', '+91 96332 23356', 'Active', '2026-10-09 19:10:00');

-- ---------------------------------------------------------------------
-- 13. SEED AUDIT LOGS
-- ---------------------------------------------------------------------
INSERT INTO audit_logs (actor_type, actor_id, action, table_affected, record_id, details, ip_address) VALUES
(1, 1, 'USER_LOGIN', 'login_credentials', '1', 'Customer Alex User logged in successfully', '192.168.1.101'),
(2, 1, 'ADMIN_ACCESS', 'users', 'ALL', 'Administrator loaded customer compliance records', '192.168.1.200'),
(1, 1, 'TRANSFER_SUBMIT', 'transfers', '1', 'Initiated transfer of $500.00 to Sarah Williams', '192.168.1.101');
