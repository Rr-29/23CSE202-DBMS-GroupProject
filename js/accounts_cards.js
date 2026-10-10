/**
 * =====================================================================
 * Course: 23CSE202 Database Management Systems
 * Project: Aureon - Internet Banking System
 * Group No: D4 (Amrita School of Computing, Amritapuri Campus)
 * 
 * MODULE: Accounts & Cards Management Controller
 * CONTRIBUTOR: Nithya Ajay (Roll No: AM.SC.U4CSE25339)
 * =====================================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeAccountsPage();
    initializeCardsPage();
});

// =====================================================================
// ACCOUNTS PAGE
// =====================================================================
async function initializeAccountsPage() {
    if (!window.location.pathname.includes("accounts.html") && !document.title.includes("Accounts")) {
        return;
    }

    const user = AureonAPI.getUser();
    const topName = document.querySelector(".profile-dropdown h4");
    if (topName && user) topName.textContent = user.name;

    const res = await AureonAPI.request("/api/accounts");
    if (!res.success || !res.accounts) return;

    // Update Stat Cards
    let savingsTotal = 0;
    let checkingTotal = 0;
    res.accounts.forEach(acc => {
        if (acc.account_type === 'Savings') savingsTotal += acc.balance;
        else checkingTotal += acc.balance;
    });

    const statSavings = document.getElementById("statSavingsBalance");
    if (statSavings) statSavings.textContent = AureonAPI.formatCurrency(savingsTotal);

    const statCurrent = document.getElementById("statCurrentBalance");
    if (statCurrent) statCurrent.textContent = AureonAPI.formatCurrency(checkingTotal);

    const statTotal = document.getElementById("statTotalBalance");
    if (statTotal) statTotal.textContent = AureonAPI.formatCurrency(res.summary.total_balance);

    // Render Accounts into Table
    const tableBody = document.getElementById("accountsTableBody") || document.querySelector("table tbody");
    if (tableBody) {
        if (res.accounts.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748B;">No bank accounts found. Click "Open New Account" above to create one.</td></tr>`;
        } else {
            tableBody.innerHTML = res.accounts.map(acc => `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fa-solid ${acc.account_type === 'Savings' ? 'fa-piggy-bank' : 'fa-building-columns'}" style="color: #2563EB;"></i>
                            <strong>Aureon ${acc.account_type}</strong>
                        </div>
                    </td>
                    <td><code>${acc.account_no}</code></td>
                    <td style="font-weight: 700; color: #1E3A8A; font-size: 1.05rem;">${AureonAPI.formatCurrency(acc.balance)}</td>
                    <td>
                        <span class="badge ${acc.status === 'Active' ? 'success' : 'warning'}">
                            ${acc.status}
                        </span>
                    </td>
                    <td>
                        <a href="transfer.html?from=${acc.account_no}" class="btn btn-primary btn-sm" style="padding: 6px 14px; font-size: 0.8rem; margin-right: 6px; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fa-solid fa-paper-plane"></i> Transfer
                        </a>
                        <a href="transactions.html" class="btn btn-outline btn-sm" style="padding: 6px 14px; font-size: 0.8rem;">
                            Ledger
                        </a>
                    </td>
                </tr>
            `).join("");
        }
    }

    // Modal to Open New Account
    setupNewAccountModal();
}

function setupNewAccountModal() {
    const openBtns = document.querySelectorAll("#btnOpenNewAccount, .section-header button, .welcome-banner button");
    openBtns.forEach(btn => {
        // Remove existing listener clone to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let modal = document.getElementById("openAccountModal");
            if (modal) modal.remove();

            modal = document.createElement("div");
            modal.id = "openAccountModal";
            modal.className = "modal active";
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 480px; padding: 28px; border-radius: 16px;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <div>
                            <h3 style="color: #1E3A8A; margin: 0; font-size: 1.25rem;">Open New Aureon Account</h3>
                            <small style="color: #64748B;">Instant automated provisioning</small>
                        </div>
                        <button type="button" class="modal-close" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748B;" onclick="document.getElementById('openAccountModal').remove()">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <form id="openAccountForm">
                        <div class="input-group" style="margin-bottom: 16px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #1F2937;">Account Type</label>
                            <select id="newAccType" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-family: inherit; font-size: 0.95rem;">
                                <option value="Savings">Savings Account (4.5% APY, Min $100)</option>
                                <option value="Checking">Checking Account (Zero Maintenance, Min $50)</option>
                                <option value="Fixed Deposit">Fixed Deposit (7.2% APY, Min $500)</option>
                                <option value="Investment">Investment Wealth Account (Min $250)</option>
                            </select>
                        </div>
                        <div class="input-group" style="margin-bottom: 22px;">
                            <label style="display: block; font-weight: 600; margin-bottom: 6px; color: #1F2937;">Initial Opening Deposit (USD)</label>
                            <input type="number" id="newAccDeposit" min="50" step="10" value="500" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-family: inherit; font-size: 0.95rem;">
                            <small style="color: #64748B; font-size: 0.8rem;">Minimum deposit of $50.00 will be credited directly to your new ledger.</small>
                        </div>
                        <button type="submit" class="btn btn-primary full-width" style="padding: 12px; font-weight: 600; font-size: 1rem; border-radius: 10px;">
                            <i class="fa-solid fa-plus"></i> Confirm & Provision Account
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById("openAccountForm").addEventListener("submit", async (ev) => {
                ev.preventDefault();
                const accType = document.getElementById("newAccType").value;
                const deposit = parseFloat(document.getElementById("newAccDeposit").value);

                const submitBtn = ev.target.querySelector("button[type='submit']");
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Provisioning...';

                const res = await AureonAPI.request("/api/accounts/open", {
                    method: "POST",
                    body: JSON.stringify({ account_type: accType, initial_deposit: deposit })
                });

                if (res.success) {
                    AureonAPI.showToast(res.message || "New account provisioned successfully!", "success");
                    modal.remove();
                    initializeAccountsPage();
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Confirm & Provision Account';
                    AureonAPI.showToast(res.message || "Failed to open account.", "error");
                }
            });
        });
    });
}

// =====================================================================
// CARDS PAGE
// =====================================================================
async function initializeCardsPage() {
    if (!window.location.pathname.includes("cards.html") && !document.title.includes("Cards")) {
        return;
    }

    const user = AureonAPI.getUser();
    const topName = document.querySelector(".profile-dropdown h4");
    if (topName && user) topName.textContent = user.name;

    const res = await AureonAPI.request("/api/cards");
    if (!res.success || !res.cards) return;

    // Render Cards Container
    const cardListContainer = document.querySelector(".cards-slider") || document.querySelector(".dashboard-grid");
    if (cardListContainer && res.cards.length > 0) {
        cardListContainer.innerHTML = res.cards.map((c, idx) => {
            const isDebit = c.card_type === "Debit";
            const bgGrad = isDebit ? "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)" : 
                           c.card_type === "Credit" ? "linear-gradient(135deg, #1F2937 0%, #374151 100%)" :
                           "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)";
            const isFrozen = c.status === "Frozen";

            return `
                <div class="glass-card" style="padding: 24px; margin-bottom: 20px;">
                    <div style="background: ${bgGrad}; color: #fff; border-radius: 16px; padding: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin-bottom: 18px; position: relative; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                            <span style="font-weight: 700; font-size: 1.2rem; letter-spacing: 1px;">Aureon</span>
                            <span class="badge" style="background: rgba(255,255,255,0.2); color: #fff;">${c.card_type}</span>
                        </div>
                        <div style="font-size: 1.3rem; letter-spacing: 3px; font-family: monospace; margin-bottom: 25px;">
                            ${c.card_number}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                            <div>
                                <small style="opacity: 0.8; font-size: 0.75rem;">CARD HOLDER</small>
                                <div style="font-weight: 600; text-transform: uppercase;">${c.name_on_card}</div>
                            </div>
                            <div>
                                <small style="opacity: 0.8; font-size: 0.75rem;">EXPIRES</small>
                                <div style="font-weight: 600;">${c.expiry_date}</div>
                            </div>
                            <div style="font-size: 1.5rem;">
                                <i class="fa-brands fa-cc-${c.card_number.startsWith('4') ? 'visa' : 'mastercard'}"></i>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="color: #64748B; font-size: 0.85rem;">Status: </span>
                            <span class="badge ${isFrozen ? 'warning' : 'success'}">${c.status}</span>
                            <span style="margin-left: 15px; color: #64748B; font-size: 0.85rem;">CVV: <code>•••</code></span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-outline btn-sm" onclick="toggleCardFreeze(${c.card_id})" style="padding: 6px 14px;">
                                <i class="fa-solid ${isFrozen ? 'fa-lock-open' : 'fa-snowflake'}"></i> ${isFrozen ? 'Unfreeze' : 'Freeze Card'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    setupRequestCardModal();
}

async function toggleCardFreeze(cardId) {
    const res = await AureonAPI.request(`/api/cards/${cardId}/toggle-status`, { method: "POST" });
    if (res.success) {
        AureonAPI.showToast(res.message, "success");
        initializeCardsPage();
    } else {
        AureonAPI.showToast(res.message, "error");
    }
}

function setupRequestCardModal() {
    const requestBtn = document.querySelector(".topbar button.btn-primary") || document.querySelector("button[data-action='new-card']");
    if (!requestBtn) return;

    requestBtn.addEventListener("click", async () => {
        const accRes = await AureonAPI.request("/api/accounts");
        if (!accRes.success || !accRes.accounts.length) {
            AureonAPI.showToast("No active accounts available to issue card against.", "warning");
            return;
        }

        let modal = document.getElementById("requestCardModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "requestCardModal";
            modal.className = "modal active";
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 style="color: #1E3A8A;">Request Payment Card</h3>
                        <button class="modal-close" onclick="document.getElementById('requestCardModal').remove()">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <form id="requestCardForm">
                        <div class="input-group" style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: 500; margin-bottom: 6px;">Link to Account</label>
                            <select id="reqCardAcc" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px;" required>
                                ${accRes.accounts.map(a => `<option value="${a.account_no}">${a.account_type} (${a.account_no.slice(-4)})</option>`).join("")}
                            </select>
                        </div>
                        <div class="input-group" style="margin-bottom: 15px;">
                            <label style="display: block; font-weight: 500; margin-bottom: 6px;">Card Type</label>
                            <select id="reqCardType" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px;">
                                <option value="Debit">Debit Card (Standard physical chip card)</option>
                                <option value="Virtual">Virtual Card (Instant for online subscriptions)</option>
                                <option value="Credit">Credit Card (Revolving credit line)</option>
                            </select>
                        </div>
                        <div class="input-group" style="margin-bottom: 20px;">
                            <label style="display: block; font-weight: 500; margin-bottom: 6px;">Name on Card</label>
                            <input type="text" id="reqCardName" value="${AureonAPI.getUser().name}" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px;">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">
                            <i class="fa-solid fa-credit-card"></i> Issue Card
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById("requestCardForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                const account_no = document.getElementById("reqCardAcc").value;
                const card_type = document.getElementById("reqCardType").value;
                const name_on_card = document.getElementById("reqCardName").value;

                const res = await AureonAPI.request("/api/cards/request", {
                    method: "POST",
                    body: JSON.stringify({ account_no, card_type, name_on_card })
                });

                if (res.success) {
                    AureonAPI.showToast(res.message, "success");
                    modal.remove();
                    initializeCardsPage();
                } else {
                    AureonAPI.showToast(res.message, "error");
                }
            });
        } else {
            modal.classList.add("active");
        }
    });
}
