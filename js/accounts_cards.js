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
// CARDS PAGE CONTROLLER (Nithya Ajay - Module Lead)
// =====================================================================
let currentCards = [];
let activeCardIdx = 0;

async function initializeCardsPage() {
    if (!window.location.pathname.includes("cards.html") && !document.title.includes("Cards")) {
        return;
    }

    const user = AureonAPI.getUser();
    const topName = document.querySelector(".profile-dropdown h4");
    if (topName && user) topName.textContent = user.name;

    const res = await AureonAPI.request("/api/cards");
    if (!res.success || !res.cards) {
        AureonAPI.showToast("Could not retrieve card details from server.", "error");
        return;
    }

    currentCards = res.cards;
    activeCardIdx = 0;

    renderCardsList();
    setupCardSwitches();
    setupRequestCardModal();
}

function getActiveCard() {
    if (!currentCards || currentCards.length === 0) return null;
    if (activeCardIdx < 0 || activeCardIdx >= currentCards.length) activeCardIdx = 0;
    return currentCards[activeCardIdx];
}

function renderCardsList() {
    const container = document.getElementById("cardsListContainer");
    if (!container) return;

    if (currentCards.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: rgba(255,255,255,0.7); border-radius: 20px; border: 1px dashed #CBD5E1;">
                <i class="fa-solid fa-credit-card fa-3x" style="color: #94A3B8; margin-bottom: 15px;"></i>
                <h3 style="color: #1E3A8A; margin-bottom: 8px;">No Payment Cards Issued</h3>
                <p style="color: #64748B; margin-bottom: 20px;">You do not have any cards linked to your accounts yet.</p>
                <button class="btn btn-primary" onclick="triggerRequestCardModal()">
                    <i class="fa-solid fa-plus"></i> Request Your First Card
                </button>
            </div>
        `;
        updateControlsForNoCard();
        return;
    }

    container.innerHTML = currentCards.map((c, idx) => {
        const isSelected = idx === activeCardIdx;
        const isDebit = c.card_type === "Debit";
        const isVirtual = c.card_type === "Virtual";
        const isBlocked = c.status === "Blocked";
        const isFrozen = c.status === "Frozen";

        let cardClass = "glass-card bank-card-preview";
        if (isVirtual) cardClass += " virtual-card";
        if (isBlocked) cardClass += " card-blocked";
        else if (isFrozen) cardClass += " card-frozen";
        if (isSelected) cardClass += " card-selected";

        const cardScheme = c.card_number.startsWith("4") ? "fa-cc-visa" : "fa-cc-mastercard";

        return `
            <article class="${cardClass}" onclick="selectCard(${idx})" style="cursor: pointer; transition: all 0.3s ease;">
                <div class="card-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>Aureon ${c.card_type}</span>
                        <span class="badge" style="background: rgba(255,255,255,0.25); color: #fff; font-size: 0.7rem; padding: 3px 8px;">
                            ${c.status}
                        </span>
                    </div>
                    <i class="fa-brands ${cardScheme}"></i>
                </div>

                <div class="card-chip">
                    <i class="fa-solid fa-microchip"></i>
                    ${isSelected ? '<span style="float: right; font-size: 0.75rem; background: #F59E0B; color: #fff; padding: 2px 10px; border-radius: 20px; font-weight: 600;">ACTIVE SELECTION</span>' : ''}
                </div>

                <h2>${maskCardNumber(c.card_number)}</h2>

                <div class="card-footer">
                    <div>
                        <small>Card Holder</small>
                        <h4>${c.name_on_card || 'CARDHOLDER'}</h4>
                    </div>
                    <div>
                        <small>Expires</small>
                        <h4>${c.expiry_date}</h4>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    updateCardControlsUI();
    loadCardTransactions();
}

function maskCardNumber(num) {
    if (!num) return "**** **** **** ****";
    const parts = num.split(" ");
    if (parts.length === 4) {
        return `**** **** **** ${parts[3]}`;
    }
    return `**** **** **** ${num.slice(-4)}`;
}

window.selectCard = function(idx) {
    activeCardIdx = idx;
    renderCardsList();
};

function updateControlsForNoCard() {
    const badge = document.getElementById("selectedCardBadge");
    if (badge) { badge.textContent = "None"; badge.className = "badge warning"; }
    const label = document.getElementById("selectedCardNumberLabel");
    if (label) label.textContent = "No card selected";
}

function updateCardControlsUI() {
    const card = getActiveCard();
    if (!card) return;

    // 1. Status badge & Number label
    const badge = document.getElementById("selectedCardBadge");
    if (badge) {
        badge.textContent = card.status;
        badge.className = `badge ${card.status === 'Active' ? 'success' : (card.status === 'Frozen' ? 'warning' : 'danger')}`;
        if (card.status === 'Blocked') {
            badge.style.background = '#EF4444';
            badge.style.color = '#fff';
        }
    }

    const numLabel = document.getElementById("selectedCardNumberLabel");
    if (numLabel) {
        numLabel.textContent = `Card: •••• ${card.card_number.slice(-4)} (${card.card_type})`;
    }

    // 2. Switches
    const swFreeze = document.getElementById("switchFreezeCard");
    const swOnline = document.getElementById("switchOnlineTx");
    const swIntl = document.getElementById("switchIntlUsage");
    const swAtm = document.getElementById("switchAtmWithdrawal");

    if (swFreeze) {
        swFreeze.checked = card.status === "Frozen";
        swFreeze.disabled = card.status === "Blocked";
    }
    if (swOnline) {
        swOnline.checked = card.online_tx !== 0;
        swOnline.disabled = card.status === "Blocked" || card.status === "Frozen";
    }
    if (swIntl) {
        swIntl.checked = card.intl_usage === 1;
        swIntl.disabled = card.status === "Blocked" || card.status === "Frozen";
    }
    if (swAtm) {
        swAtm.checked = card.atm_usage !== 0;
        swAtm.disabled = card.status === "Blocked" || card.status === "Frozen";
    }

    // 3. Limits Table
    const elDaily = document.getElementById("valDailyLimit");
    const elAtm = document.getElementById("valAtmLimit");
    const elOnline = document.getElementById("valOnlineLimit");
    const elContact = document.getElementById("valContactlessLimit");

    if (elDaily) elDaily.textContent = AureonAPI.formatCurrency(card.daily_limit || 5000.00);
    if (elAtm) elAtm.textContent = AureonAPI.formatCurrency(card.atm_limit || 1000.00);
    if (elOnline) elOnline.textContent = AureonAPI.formatCurrency(card.online_limit || 3500.00);
    if (elContact) elContact.textContent = AureonAPI.formatCurrency(card.contactless_limit || 250.00);

    // 4. Block Card Label
    const blockLabel = document.getElementById("labelBlockCard");
    if (blockLabel) {
        blockLabel.textContent = card.status === "Blocked" ? "Unblock Card" : "Block Card";
    }
}

function setupCardSwitches() {
    const swFreeze = document.getElementById("switchFreezeCard");
    const swOnline = document.getElementById("switchOnlineTx");
    const swIntl = document.getElementById("switchIntlUsage");
    const swAtm = document.getElementById("switchAtmWithdrawal");

    if (swFreeze && !swFreeze._bound) {
        swFreeze._bound = true;
        swFreeze.addEventListener("change", async () => {
            const card = getActiveCard();
            if (!card) return;

            const res = await AureonAPI.request(`/api/cards/${card.card_id}/freeze`, { method: "POST" });
            if (res.success) {
                card.status = res.status;
                AureonAPI.showToast(res.message, "success");
                renderCardsList();
            } else {
                swFreeze.checked = !swFreeze.checked;
                AureonAPI.showToast(res.message || "Could not change freeze status.", "error");
            }
        });
    }

    const updateControlsOnServer = async () => {
        const card = getActiveCard();
        if (!card) return;

        const onlineVal = swOnline ? (swOnline.checked ? 1 : 0) : 1;
        const intlVal = swIntl ? (swIntl.checked ? 1 : 0) : 0;
        const atmVal = swAtm ? (swAtm.checked ? 1 : 0) : 1;

        const res = await AureonAPI.request(`/api/cards/${card.card_id}/controls`, {
            method: "POST",
            body: JSON.stringify({
                online_tx: onlineVal,
                intl_usage: intlVal,
                atm_usage: atmVal,
                status: card.status
            })
        });

        if (res.success) {
            card.online_tx = onlineVal;
            card.intl_usage = intlVal;
            card.atm_usage = atmVal;
            AureonAPI.showToast("Card channel preferences saved!", "success");
        } else {
            AureonAPI.showToast(res.message || "Failed to update channel controls.", "error");
        }
    };

    if (swOnline && !swOnline._bound) {
        swOnline._bound = true;
        swOnline.addEventListener("change", updateControlsOnServer);
    }
    if (swIntl && !swIntl._bound) {
        swIntl._bound = true;
        swIntl.addEventListener("change", updateControlsOnServer);
    }
    if (swAtm && !swAtm._bound) {
        swAtm._bound = true;
        swAtm.addEventListener("change", updateControlsOnServer);
    }
}

// =====================================================================
// CARD SERVICES MODALS
// =====================================================================

// 1. BLOCK / UNBLOCK CARD
window.openBlockCardModal = function() {
    const card = getActiveCard();
    if (!card) {
        AureonAPI.showToast("Please select a card first.", "warning");
        return;
    }

    const isBlocked = card.status === "Blocked";
    const modalId = "blockCardModal";
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal active";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 440px;">
            <div class="modal-header">
                <h3 style="color: ${isBlocked ? '#10B981' : '#EF4444'}; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid ${isBlocked ? 'fa-lock-open' : 'fa-triangle-exclamation'}"></i>
                    ${isBlocked ? 'Unblock Payment Card' : 'Block Lost or Stolen Card'}
                </h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div style="margin: 15px 0;">
                <p style="color: #475569; font-size: 0.95rem; margin-bottom: 12px;">
                    ${isBlocked 
                        ? `Are you sure you want to reactivate card <strong>•••• ${card.card_number.slice(-4)}</strong>? The card will be restored to Active status immediately.`
                        : `Blocking card <strong>•••• ${card.card_number.slice(-4)}</strong> will immediately decline all ATM, online, and POS transactions for your security.`
                    }
                </p>
                ${!isBlocked ? `
                    <div class="input-group" style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: 500; margin-bottom: 6px;">Reason for Blocking</label>
                        <select id="blockReasonSelect" style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                            <option value="Card Lost or Misplaced">Card Lost or Misplaced</option>
                            <option value="Suspected Fraudulent Activity">Suspected Fraudulent Activity</option>
                            <option value="Card Stolen">Card Stolen</option>
                            <option value="Temporary Precaution">Temporary Precaution</option>
                        </select>
                    </div>
                ` : ''}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                <button class="btn ${isBlocked ? 'btn-primary' : 'btn-danger'}" id="btnConfirmBlockAction" style="${!isBlocked ? 'background: #DC2626; border-color: #DC2626;' : ''}">
                    <i class="fa-solid ${isBlocked ? 'fa-check' : 'fa-ban'}"></i> ${isBlocked ? 'Confirm Unblock' : 'Permanently Block Card'}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("btnConfirmBlockAction").addEventListener("click", async () => {
        const reasonSelect = document.getElementById("blockReasonSelect");
        const reason = reasonSelect ? reasonSelect.value : "Reactivation";
        const actionType = isBlocked ? "unblock" : "block";

        const res = await AureonAPI.request(`/api/cards/${card.card_id}/block`, {
            method: "POST",
            body: JSON.stringify({ action: actionType, reason: reason })
        });

        if (res.success) {
            card.status = res.status;
            AureonAPI.showToast(res.message, "success");
            modal.remove();
            renderCardsList();
        } else {
            AureonAPI.showToast(res.message || "Failed to update card block status.", "error");
        }
    });
};

// 2. CHANGE CARD PIN
window.openChangeCardPinModal = function() {
    const card = getActiveCard();
    if (!card) {
        AureonAPI.showToast("Please select a card first.", "warning");
        return;
    }

    const modalId = "changeCardPinModal";
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal active";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 440px;">
            <div class="modal-header">
                <h3 style="color: #1E3A8A; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-key" style="color: #F59E0B;"></i> Change Card ATM PIN
                </h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <form id="formChangeCardPin" style="margin-top: 15px;">
                <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px; margin-bottom: 15px; font-size: 0.85rem; color: #1E40AF;">
                    Changing 4-digit PIN for <strong>${card.card_type} (•••• ${card.card_number.slice(-4)})</strong>.<br>
                    Default PIN for initial accounts is <code>1234</code>.
                </div>

                <div class="input-group" style="margin-bottom: 12px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Current 4-Digit PIN</label>
                    <input type="password" id="inputCurrentPin" placeholder="Enter current PIN (e.g. 1234)" maxlength="4" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                </div>

                <div class="input-group" style="margin-bottom: 12px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">New 4-Digit PIN</label>
                    <input type="password" id="inputNewPin" placeholder="4 numeric digits (e.g. 5678)" maxlength="4" pattern="[0-9]{4}" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                </div>

                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Confirm New PIN</label>
                    <input type="password" id="inputConfirmPin" placeholder="Re-enter new 4-digit PIN" maxlength="4" pattern="[0-9]{4}" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btnSubmitNewPin">
                        <i class="fa-solid fa-lock"></i> Update PIN
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("formChangeCardPin").addEventListener("submit", async (e) => {
        e.preventDefault();
        const currPin = document.getElementById("inputCurrentPin").value.trim();
        const newPin = document.getElementById("inputNewPin").value.trim();
        const confPin = document.getElementById("inputConfirmPin").value.trim();

        if (newPin !== confPin) {
            AureonAPI.showToast("New PIN and confirmation PIN do not match.", "error");
            return;
        }

        const submitBtn = document.getElementById("btnSubmitNewPin");
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

        const res = await AureonAPI.request(`/api/cards/${card.card_id}/change-pin`, {
            method: "POST",
            body: JSON.stringify({ current_pin: currPin, new_pin: newPin, confirm_pin: confPin })
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Update PIN';

        if (res.success) {
            AureonAPI.showToast(res.message, "success");
            modal.remove();
        } else {
            AureonAPI.showToast(res.message || "Failed to update card PIN.", "error");
        }
    });
};

// 3. VIEW CVV MODAL
window.openViewCVVModal = async function() {
    const card = getActiveCard();
    if (!card) {
        AureonAPI.showToast("Please select a card first.", "warning");
        return;
    }

    const res = await AureonAPI.request(`/api/cards/${card.card_id}/cvv`);
    if (!res.success) {
        AureonAPI.showToast("Could not retrieve card CVV details.", "error");
        return;
    }

    const modalId = "viewCVVModal";
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal active";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 440px;">
            <div class="modal-header">
                <h3 style="color: #1E3A8A; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-shield-halved" style="color: #2563EB;"></i> Card Security Details
                </h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div style="margin: 20px 0;">
                <div style="background: linear-gradient(135deg, #1E293B, #0F172A); color: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span style="font-size: 0.8rem; color: #94A3B8;">FULL CARD NUMBER</span>
                        <span style="font-size: 0.8rem; background: #2563EB; padding: 2px 8px; border-radius: 10px;">${card.card_type}</span>
                    </div>
                    <div style="font-size: 1.25rem; font-family: monospace; letter-spacing: 2px; margin-bottom: 20px; color: #F8FAFC;">
                        ${res.card_number}
                    </div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                        <div>
                            <small style="color: #94A3B8; display: block; font-size: 0.75rem;">EXPIRY</small>
                            <strong style="color: #F8FAFC; font-size: 1rem;">${res.expiry_date}</strong>
                        </div>
                        <div>
                            <small style="color: #94A3B8; display: block; font-size: 0.75rem;">CVV / CVC</small>
                            <strong style="color: #38BDF8; font-size: 1.2rem; font-family: monospace; letter-spacing: 2px;">${res.cvv}</strong>
                        </div>
                        <div>
                            <small style="color: #94A3B8; display: block; font-size: 0.75rem;">ATM PIN</small>
                            <strong style="color: #FBBF24; font-size: 1.1rem; font-family: monospace;">${res.pin || '1234'}</strong>
                        </div>
                    </div>
                </div>

                <p style="font-size: 0.8rem; color: #64748B; margin-top: 12px; text-align: center;">
                    <i class="fa-solid fa-lock"></i> Protected by Aureon Zero-Trust Encryption. Never share your CVV or PIN.
                </p>
            </div>
            <div style="display: flex; justify-content: flex-end;">
                <button class="btn btn-primary" onclick="document.getElementById('${modalId}').remove()">Done</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// 4. CARD STATEMENT MODAL
window.openCardStatementModal = async function() {
    const card = getActiveCard();
    if (!card) {
        AureonAPI.showToast("Please select a card first.", "warning");
        return;
    }

    const res = await AureonAPI.request(`/api/cards/${card.card_id}/statement`);
    if (!res.success) {
        AureonAPI.showToast("Could not generate card statement.", "error");
        return;
    }

    const modalId = "cardStatementModal";
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    const txns = res.transactions || [];

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal active";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 650px;">
            <div class="modal-header">
                <div>
                    <h3 style="color: #1E3A8A; margin: 0;">Card Account Statement</h3>
                    <small style="color: #64748B;">Card: •••• ${card.card_number.slice(-4)} | Account: ${card.account_no}</small>
                </div>
                <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div style="margin: 20px 0; max-height: 380px; overflow-y: auto;">
                ${txns.length === 0 ? `
                    <p style="text-align: center; color: #64748B; padding: 25px;">No transactions recorded on this card account yet.</p>
                ` : `
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid #E2E8F0; text-align: left; color: #64748B;">
                                <th style="padding: 10px 8px;">Date</th>
                                <th style="padding: 10px 8px;">Description</th>
                                <th style="padding: 10px 8px;">Type</th>
                                <th style="padding: 10px 8px; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${txns.map(t => `
                                <tr style="border-bottom: 1px solid #F1F5F9;">
                                    <td style="padding: 10px 8px; color: #64748B;">${t.transaction_time ? t.transaction_time.slice(0, 10) : 'Recent'}</td>
                                    <td style="padding: 10px 8px; font-weight: 500;">${t.description}</td>
                                    <td style="padding: 10px 8px;">
                                        <span class="badge ${t.transaction_type === 'Credit' ? 'success' : 'warning'}" style="font-size: 0.75rem;">
                                            ${t.transaction_type}
                                        </span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: ${t.transaction_type === 'Credit' ? '#16A34A' : '#DC2626'};">
                                        ${t.transaction_type === 'Credit' ? '+' : '-'}${AureonAPI.formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                `}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 15px;">
                <button class="btn btn-outline btn-sm" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> Print Statement
                </button>
                <button class="btn btn-primary" onclick="document.getElementById('${modalId}').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// 5. UPDATE SPENDING LIMITS MODAL
window.openUpdateLimitsModal = function() {
    const card = getActiveCard();
    if (!card) {
        AureonAPI.showToast("Please select a card first.", "warning");
        return;
    }

    const modalId = "updateLimitsModal";
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal active";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px;">
            <div class="modal-header">
                <h3 style="color: #1E3A8A; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-sliders" style="color: #2563EB;"></i> Customize Card Limits
                </h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <form id="formUpdateLimits" style="margin-top: 15px;">
                <div class="input-group" style="margin-bottom: 12px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Daily Spending Limit ($)</label>
                    <input type="number" id="limitDaily" value="${card.daily_limit || 5000.00}" step="100" min="500" max="25000" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                </div>

                <div class="input-group" style="margin-bottom: 12px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">ATM Cash Withdrawal Limit ($)</label>
                    <input type="number" id="limitAtm" value="${card.atm_limit || 1000.00}" step="100" min="100" max="10000" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                </div>

                <div class="input-group" style="margin-bottom: 12px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Online Purchase Limit ($)</label>
                    <input type="number" id="limitOnline" value="${card.online_limit || 3500.00}" step="100" min="200" max="20000" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                </div>

                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Contactless Tap & Pay Limit ($)</label>
                    <input type="number" id="limitContactless" value="${card.contactless_limit || 250.00}" step="50" min="50" max="1000" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btnSaveLimits">
                        <i class="fa-solid fa-floppy-disk"></i> Save Limits
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("formUpdateLimits").addEventListener("submit", async (e) => {
        e.preventDefault();
        const daily = parseFloat(document.getElementById("limitDaily").value);
        const atm = parseFloat(document.getElementById("limitAtm").value);
        const online = parseFloat(document.getElementById("limitOnline").value);
        const contactless = parseFloat(document.getElementById("limitContactless").value);

        const btn = document.getElementById("btnSaveLimits");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const res = await AureonAPI.request(`/api/cards/${card.card_id}/limits`, {
            method: "POST",
            body: JSON.stringify({
                daily_limit: daily,
                atm_limit: atm,
                online_limit: online,
                contactless_limit: contactless
            })
        });

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Limits';

        if (res.success) {
            card.daily_limit = daily;
            card.atm_limit = atm;
            card.online_limit = online;
            card.contactless_limit = contactless;
            AureonAPI.showToast("Card spending limits successfully updated!", "success");
            modal.remove();
            updateCardControlsUI();
        } else {
            AureonAPI.showToast(res.message || "Failed to update limits.", "error");
        }
    });
};

// 6. RECENT TRANSACTIONS TABLE FOR SELECTED CARD
async function loadCardTransactions() {
    const card = getActiveCard();
    const tbody = document.getElementById("cardTransactionsTableBody");
    if (!tbody || !card) return;

    const res = await AureonAPI.request(`/api/cards/${card.card_id}/statement`);
    if (!res.success || !res.transactions) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748B; padding: 20px;">No transaction records found.</td></tr>`;
        return;
    }

    const txns = res.transactions;
    if (txns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748B; padding: 20px;">No recent transactions for this card.</td></tr>`;
        return;
    }

    tbody.innerHTML = txns.slice(0, 5).map(t => {
        const isCr = t.transaction_type === 'Credit';
        return `
            <tr>
                <td>${t.transaction_time ? t.transaction_time.slice(0, 10) : 'Recent'}</td>
                <td><strong>${t.description}</strong></td>
                <td><span class="badge ${isCr ? 'success' : 'warning'}">${card.card_type} Card</span></td>
                <td><span class="badge success">${t.status || 'Completed'}</span></td>
                <td style="font-weight: 700; color: ${isCr ? '#16A34A' : '#DC2626'};">
                    ${isCr ? '+' : '-'}${AureonAPI.formatCurrency(t.amount)}
                </td>
            </tr>
        `;
    }).join("");
}

// 7. REQUEST NEW CARD MODAL
function setupRequestCardModal() {
    const requestBtn = document.getElementById("btnRequestNewCard") || document.querySelector(".topbar button.btn-primary");
    if (!requestBtn) return;

    requestBtn.onclick = triggerRequestCardModal;
}

window.triggerRequestCardModal = async function() {
    const accRes = await AureonAPI.request("/api/accounts");
    if (!accRes.success || !accRes.accounts.length) {
        AureonAPI.showToast("Please open an account first before requesting cards.", "warning");
        return;
    }

    const modalId = "requestCardModal";
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    const user = AureonAPI.getUser();

    modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal active";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px;">
            <div class="modal-header">
                <h3 style="color: #1E3A8A; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-credit-card" style="color: #2563EB;"></i> Request New Payment Card
                </h3>
                <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <form id="requestCardForm" style="margin-top: 15px;">
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Link to Account</label>
                    <select id="reqCardAcc" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px;" required>
                        ${accRes.accounts.map(a => `<option value="${a.account_no}">${a.account_type} (${a.account_no}) - Balance: ${AureonAPI.formatCurrency(a.balance)}</option>`).join("")}
                    </select>
                </div>
                <div class="input-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Card Type</label>
                    <select id="reqCardType" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px;">
                        <option value="Debit">Debit Card (Standard physical chip card)</option>
                        <option value="Virtual">Virtual Card (Instant for online subscriptions)</option>
                        <option value="Credit">Credit Card (Revolving credit card)</option>
                    </select>
                </div>
                <div class="input-group" style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 500; margin-bottom: 6px;">Name on Card</label>
                    <input type="text" id="reqCardName" value="${user.name}" required style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="btnSubmitRequestCard">
                        <i class="fa-solid fa-plus"></i> Issue Card Immediately
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("requestCardForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const account_no = document.getElementById("reqCardAcc").value;
        const card_type = document.getElementById("reqCardType").value;
        const name_on_card = document.getElementById("reqCardName").value;

        const btn = document.getElementById("btnSubmitRequestCard");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Issuing Card...';

        const res = await AureonAPI.request("/api/cards/request", {
            method: "POST",
            body: JSON.stringify({ account_no, card_type, name_on_card })
        });

        if (res.success) {
            AureonAPI.showToast(res.message || "New card successfully issued!", "success");
            modal.remove();
            initializeCardsPage();
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Issue Card Immediately';
            AureonAPI.showToast(res.message || "Failed to issue card.", "error");
        }
    });
};
