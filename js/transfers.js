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

    // 3. Handle Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const sourceAccount = fromSelect.value;
        const beneficiaryId = benSelect ? benSelect.value : null;
        const amount = parseFloat(document.getElementById("amount").value);
        const purpose = document.getElementById("purpose") ? document.getElementById("purpose").value : "Personal";
        const remarks = document.getElementById("remarks") ? document.getElementById("remarks").value : "";

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

        // Submit to API
        const submitBtn = form.querySelector("button[type='submit']");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Transaction...';

        const result = await AureonAPI.request("/api/transfers/execute", {
            method: "POST",
            body: JSON.stringify({
                source_account: sourceAccount,
                beneficiary_id: beneficiaryId,
                amount: amount,
                purpose: purpose,
                remarks: remarks
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
            AureonAPI.showToast(result.message, "error");
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
