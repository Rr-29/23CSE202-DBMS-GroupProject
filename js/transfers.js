/**
 * =====================================================================
 * Course: 23CSE202 Database Management Systems
 * Project: Aureon - Internet Banking System
 * Group No: D4 (Amrita School of Computing, Amritapuri Campus)
 * 
 * MODULE: Fund Transfers & Transactions Logic
 * CONTRIBUTOR: Rudra Rajagopal (Roll No: AM.SC.U4CSE25344)
 * =====================================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeTransferPage();
    initializeTransactionsPage();
});

// =====================================================================
// TRANSFER PAGE LOGIC
// =====================================================================
async function initializeTransferPage() {
    const form = document.getElementById("transferForm");
    const fromSelect = document.getElementById("fromAccount");
    const benSelect = document.getElementById("beneficiary");

    if (!form || !fromSelect) return;

    // Set user name in header
    const user = AureonAPI.getUser();
    const topName = document.querySelector(".profile-dropdown h4");
    if (topName && user) topName.textContent = user.name;

    // 1. Load User Accounts into Source Dropdown
    const accRes = await AureonAPI.request("/api/accounts");
    if (accRes.success && accRes.accounts) {
        fromSelect.innerHTML = '<option value="">Select Account</option>';
        accRes.accounts.forEach(acc => {
            const opt = document.createElement("option");
            opt.value = acc.account_no;
            opt.textContent = `${acc.account_type} (${acc.account_no.slice(-4)}) - Balance: ${AureonAPI.formatCurrency(acc.balance)}`;
            fromSelect.appendChild(opt);
        });

        // Auto select first account if available
        if (accRes.accounts.length > 0) {
            fromSelect.selectedIndex = 1;
        }
    }

    // 2. Load Beneficiaries into Recipient Dropdown
    if (benSelect) {
        const benRes = await AureonAPI.request("/api/beneficiaries");
        if (benRes.success && benRes.beneficiaries) {
            benSelect.innerHTML = '<option value="">Select Beneficiary</option>';
            benRes.beneficiaries.forEach(ben => {
                const opt = document.createElement("option");
                opt.value = ben.beneficiary_id;
                opt.textContent = `${ben.name} (${ben.bank_name} - ${ben.account_no.slice(-4)})`;
                benSelect.appendChild(opt);
            });

            // Check if query param specifies a beneficiary
            const urlParams = new URLSearchParams(window.location.search);
            const benParam = urlParams.get("beneficiary");
            if (benParam) {
                benSelect.value = benParam;
            }
        }
    }

    // Password toggle for transfer password
    const toggleBtn = document.getElementById("toggleTransferPassword");
    const pwdInput = document.getElementById("transferPassword");
    if (toggleBtn && pwdInput) {
        toggleBtn.addEventListener("click", () => {
            const isPassword = pwdInput.type === "password";
            pwdInput.type = isPassword ? "text" : "password";
            const icon = toggleBtn.querySelector("i");
            if (icon) {
                icon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
            }
        });
    }

    // 3. Handle Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const sourceAccount = fromSelect.value;
        const beneficiaryId = benSelect ? benSelect.value : null;
        const amount = parseFloat(document.getElementById("amount").value);
        const purpose = document.getElementById("purpose") ? document.getElementById("purpose").value : "Personal";
        const remarks = document.getElementById("remarks") ? document.getElementById("remarks").value : "";
        const transferPassword = document.getElementById("transferPassword") ? document.getElementById("transferPassword").value.trim() : "";

        if (!sourceAccount) {
            AureonAPI.showToast("Please choose a source account to debit.", "warning");
            return;
        }

        if (!beneficiaryId) {
            AureonAPI.showToast("Please select a beneficiary recipient.", "warning");
            return;
        }

        if (!amount || amount <= 0) {
            AureonAPI.showToast("Please enter a valid amount greater than zero.", "warning");
            return;
        }

        if (!transferPassword) {
            AureonAPI.showToast("Please enter your Transfer Password / PIN to authorize.", "warning");
            const pwField = document.getElementById("transferPassword");
            if (pwField) pwField.focus();
            return;
        }

        // Submit to API
        const submitBtn = form.querySelector("button[type='submit']");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authorizing & Processing...';

        const result = await AureonAPI.request("/api/transfers/execute", {
            method: "POST",
            body: JSON.stringify({
                source_account: sourceAccount,
                beneficiary_id: beneficiaryId,
                amount: amount,
                purpose: purpose,
                remarks: remarks,
                transfer_password: transferPassword
            })
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (result.success) {
            AureonAPI.showToast(result.message, "success");
            showReceiptModal(result);
            form.reset();
            // Refresh account dropdown balances
            initializeTransferPage();
        } else {
            AureonAPI.showToast(result.message || "Transfer declined.", "error");
        }
    });
}

function showReceiptModal(data) {
    let modal = document.getElementById("transferReceiptModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "transferReceiptModal";
        modal.className = "modal active";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 460px;">
            <div style="width: 60px; height: 60px; background: #D1FAE5; color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 1.8rem;">
                <i class="fa-solid fa-check"></i>
            </div>
            <h3 style="color: #1E3A8A; margin-bottom: 4px;">Transfer Successful!</h3>
            <p style="color: #6B7280; font-size: 0.9rem; margin-bottom: 20px;">Your transaction has been committed to the ledger.</p>

            <div style="background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 12px; padding: 18px; text-align: left; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B;">Amount Transferred:</span>
                    <strong style="color: #0F172A; font-size: 1.1rem;">${AureonAPI.formatCurrency(data.amount)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B;">Recipient:</span>
                    <span style="font-weight: 600;">${data.recipient}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B;">Reference ID:</span>
                    <code>${data.reference_id}</code>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748B;">Timestamp:</span>
                    <span style="font-size: 0.85rem;">${data.date}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 8px; margin-top: 8px;">
                    <span style="color: #64748B;">Remaining Balance:</span>
                    <strong style="color: #2563EB;">${AureonAPI.formatCurrency(data.new_balance)}</strong>
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="document.getElementById('transferReceiptModal').remove()" style="flex: 1;">
                    Done
                </button>
                <a href="transactions.html" class="btn btn-outline" style="flex: 1;">
                    View Statement
                </a>
            </div>
        </div>
    `;
    modal.classList.add("active");
}

// =====================================================================
// TRANSACTIONS PAGE LOGIC
// =====================================================================
async function initializeTransactionsPage() {
    const table = document.querySelector(".transactions-card table tbody");
    const searchInput = document.querySelector(".filter-bar input[type='text']");
    const typeSelect = document.querySelector(".filter-bar select:nth-of-type(1)");
    const statusSelect = document.querySelector(".filter-bar select:nth-of-type(2)");
    const downloadBtn = document.querySelector(".topbar button.btn-primary");

    // Check if on transactions page
    if (!window.location.pathname.includes("transactions.html") && !document.title.includes("Transactions")) {
        return;
    }

    const user = AureonAPI.getUser();
    const topName = document.querySelector(".profile-dropdown h4");
    if (topName && user) topName.textContent = user.name;

    async function fetchAndRenderTransactions() {
        if (!table) return;
        const type = typeSelect ? typeSelect.value : "All";
        const status = statusSelect ? statusSelect.value : "All";
        const search = searchInput ? searchInput.value : "";

        let query = `/api/transactions?`;
        if (type && type !== "All Types") query += `type=${type}&`;
        if (status && status !== "All Status") query += `status=${status}&`;
        if (search) query += `search=${encodeURIComponent(search)}&`;

        const res = await AureonAPI.request(query);
        if (!res.success || !res.transactions) {
            table.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px;">Unable to load transactions.</td></tr>`;
            return;
        }

        const countHeader = document.querySelector(".transactions-card .section-header span");
        if (countHeader) countHeader.textContent = `Showing ${res.transactions.length} recorded events`;

        if (res.transactions.length === 0) {
            table.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #9CA3AF;">No matching transactions found.</td></tr>`;
            return;
        }

        table.innerHTML = res.transactions.map(t => {
            const isCredit = t.transaction_type === "Credit";
            const amountClass = isCredit ? "style='color: #10B981; font-weight: 600;'" : "style='color: #EF4444; font-weight: 600;'";
            const sign = isCredit ? "+" : "-";
            const badgeClass = t.status === "Completed" ? "badge success" : t.status === "Pending" ? "badge warning" : "badge danger";

            return `
                <tr>
                    <td>${AureonAPI.formatDate(t.transaction_time)}</td>
                    <td><code>${t.reference_id}</code></td>
                    <td><strong>${t.description}</strong></td>
                    <td><span class="badge info">${t.category || t.transaction_type}</span></td>
                    <td><span class="${badgeClass}">${t.status}</span></td>
                    <td ${amountClass}>${sign}${AureonAPI.formatCurrency(t.amount)}</td>
                </tr>
            `;
        }).join("");
    }

    if (searchInput) searchInput.addEventListener("input", fetchAndRenderTransactions);
    if (typeSelect) typeSelect.addEventListener("change", fetchAndRenderTransactions);
    if (statusSelect) statusSelect.addEventListener("change", fetchAndRenderTransactions);

    // Initial fetch
    fetchAndRenderTransactions();

    // Download Statement Action
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            window.print();
        });
    }
}

// =====================================================================
// QUICK PAY TEAMMATE & TRANSFER PASSWORD MODAL HELPERS
// =====================================================================

window.selectTeammateRecipient = function(accNo, name) {
    const benSelect = document.getElementById("beneficiary");
    if (!benSelect) return;

    let opt = Array.from(benSelect.options).find(o => o.value === accNo || o.textContent.includes(accNo.slice(-4)));
    if (!opt) {
        opt = document.createElement("option");
        opt.value = accNo;
        opt.textContent = `${name} (${accNo})`;
        benSelect.appendChild(opt);
    }
    benSelect.value = opt.value;
    AureonAPI.showToast(`Selected payee: ${name}`, "info");
};

window.openTransferPasswordModal = function() {
    let modal = document.getElementById("transferPasswordModal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "transferPasswordModal";
    modal.className = "modal active";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 460px; padding: 26px; border-radius: 16px;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                <div>
                    <h3 style="color: #1E3A8A; margin: 0; font-size: 1.25rem;">
                        <i class="fa-solid fa-shield-halved" style="color: #2563EB;"></i> Set / Edit Transfer Password
                    </h3>
                    <small style="color: #64748B;">Used to authorize all outgoing fund transfers</small>
                </div>
                <button type="button" class="modal-close" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748B;" onclick="document.getElementById('transferPasswordModal').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <form id="editTransferPasswordForm">
                <div class="input-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem;">Current Password (or Login Password)</label>
                    <input type="password" id="curTransferPwd" placeholder="Enter current password (default: 1234 or User@123)" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 0.95rem;">
                    <small style="color: #64748B; font-size: 0.78rem;">Default is <code>1234</code> or your account login password.</small>
                </div>
                <div class="input-group" style="margin-bottom: 14px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem;">New Transfer Password / Security PIN</label>
                    <input type="password" id="newTransferPwd" placeholder="Create new transfer password (min 4 chars)" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 0.95rem;">
                </div>
                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 0.9rem;">Confirm New Transfer Password</label>
                    <input type="password" id="confirmTransferPwd" placeholder="Confirm new transfer password" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 0.95rem;">
                </div>
                <button type="submit" class="btn btn-primary full-width" style="padding: 12px; font-weight: 600; font-size: 0.95rem; border-radius: 10px;">
                    <i class="fa-solid fa-floppy-disk"></i> Save Transfer Password
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("editTransferPasswordForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const curPwd = document.getElementById("curTransferPwd").value;
        const newPwd = document.getElementById("newTransferPwd").value;
        const confPwd = document.getElementById("confirmTransferPwd").value;

        if (newPwd !== confPwd) {
            AureonAPI.showToast("New passwords do not match.", "error");
            return;
        }

        if (newPwd.length < 4) {
            AureonAPI.showToast("Password must be at least 4 characters.", "warning");
            return;
        }

        const submitBtn = e.target.querySelector("button[type='submit']");
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const res = await AureonAPI.request("/api/user/transfer-password", {
            method: "POST",
            body: JSON.stringify({
                current_password: curPwd,
                new_transfer_password: newPwd
            })
        });

        if (res.success) {
            AureonAPI.showToast(res.message, "success");
            modal.remove();
            // Pre-fill the transfer password field on the page
            const pagePw = document.getElementById("transferPassword");
            if (pagePw) pagePw.value = newPwd;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Transfer Password';
            AureonAPI.showToast(res.message || "Failed to update transfer password.", "error");
        }
    });
};
