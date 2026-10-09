/**
 * =====================================================================
 * Course: 23CSE202 Database Management Systems
 * Project: Aureon - Internet Banking System
 * Group No: D4 (Amrita School of Computing, Amritapuri Campus)
 * 
 * MODULE: Administrator Management & Database Analytics
 * CONTRIBUTOR: Varun Nair (Roll No: AM.SC.U4CSE25356)
 * Entities Managed: ADMINS, AUDIT_LOGS, Database Views & Reports
 * =====================================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeAdminDashboard();
    initializeCustomerManagement();
    initializeReportsPage();
});

// =====================================================================
// ADMIN DASHBOARD
// =====================================================================
async function initializeAdminDashboard() {
    if (!window.location.pathname.includes("dashboard.html") && !document.title.includes("Admin | Dashboard")) {
        return;
    }

    if (typeof AureonAPI === "undefined") return;

    // Load Metrics
    const res = await AureonAPI.request("/api/admin/metrics");
    if (!res.success || !res.metrics) return;

    const m = res.metrics;

    // Update KPI stat cards
    const statCards = document.querySelectorAll(".stats-grid .stat-card h2");
    if (statCards.length >= 4) {
        statCards[0].textContent = m.total_customers.toLocaleString();
        statCards[1].textContent = m.total_accounts.toLocaleString();
        statCards[2].textContent = AureonAPI.formatCurrency(m.total_deposits);
        statCards[3].textContent = m.total_transactions.toLocaleString();
    }

    // Populate Recent Administrative Activity table from audit logs
    const auditTable = document.querySelector(".transactions-card table tbody");
    if (auditTable && res.recent_activity) {
        if (res.recent_activity.length > 0) {
            auditTable.innerHTML = res.recent_activity.map(log => {
                const badge = log.action.includes("SUCCESS") || log.action.includes("EXECUTE") ? "badge success" : "badge warning";
                return `
                    <tr>
                        <td>${AureonAPI.formatDate(log.timestamp)}</td>
                        <td><strong>${log.actor_type} #${log.actor_id}</strong></td>
                        <td>${log.details || log.action}</td>
                        <td><code>${log.table_affected}</code></td>
                        <td><span class="${badge}">Recorded</span></td>
                    </tr>
                `;
            }).join("");
        }
    }
}

// =====================================================================
// CUSTOMER MANAGEMENT
// =====================================================================
async function initializeCustomerManagement() {
    if (!window.location.pathname.includes("customers.html") && !document.title.includes("Customers")) {
        return;
    }

    if (typeof AureonAPI === "undefined") return;

    const tableBody = document.querySelector(".transactions-card table tbody");
    const searchInput = document.getElementById("customerSearch") || document.querySelector("input[type='text']");
    const statusSelect = document.getElementById("customerStatus") || document.querySelector("select");

    async function loadCustomers() {
        if (!tableBody) return;
        const search = searchInput ? searchInput.value : "";
        const status = statusSelect ? statusSelect.value : "all";

        let url = `/api/admin/customers?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (status && status !== "all") url += `status=${status}&`;

        const res = await AureonAPI.request(url);
        if (!res.success || !res.customers) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px;">Unable to load customers.</td></tr>`;
            return;
        }

        if (res.customers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #9CA3AF;">No matching customer records found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = res.customers.map(c => {
            const isSuspended = c.login_status === "Suspended";
            const badge = isSuspended ? "badge danger" : "badge success";

            return `
                <tr>
                    <td><strong>#${c.user_id}</strong></td>
                    <td>
                        <strong>${c.full_name}</strong><br>
                        <small style="color: #64748B;">${c.email}</small>
                    </td>
                    <td><code>${c.account_numbers || 'None'}</code></td>
                    <td><strong style="color: #2563EB;">${AureonAPI.formatCurrency(c.total_balance)}</strong></td>
                    <td>${c.phone_no}</td>
                    <td><span class="${badge}">${c.login_status}</span></td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-outline btn-sm" onclick="toggleCustomerStatus(${c.user_id}, '${c.full_name}')" style="padding: 5px 10px; font-size: 0.8rem;">
                                <i class="fa-solid ${isSuspended ? 'fa-user-check' : 'fa-user-slash'}"></i> ${isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    if (searchInput) searchInput.addEventListener("input", loadCustomers);
    if (statusSelect) statusSelect.addEventListener("change", loadCustomers);

    loadCustomers();
}

async function toggleCustomerStatus(userId, name) {
    const res = await AureonAPI.request(`/api/admin/customers/${userId}/toggle-status`, { method: "POST" });
    if (res.success) {
        AureonAPI.showToast(res.message, "success");
        initializeCustomerManagement();
    } else {
        AureonAPI.showToast(res.message, "error");
    }
}

// =====================================================================
// REPORTS PAGE
// =====================================================================
async function initializeReportsPage() {
    if (!window.location.pathname.includes("reports.html") && !document.title.includes("Reports")) {
        return;
    }

    if (typeof AureonAPI === "undefined") return;

    const res = await AureonAPI.request("/api/admin/reports");
    if (!res.success) return;

    // High Value Transfers Table
    const tableBody = document.querySelector(".transactions-card table tbody");
    if (tableBody && res.high_value_transfers) {
        if (res.high_value_transfers.length > 0) {
            tableBody.innerHTML = res.high_value_transfers.map(t => `
                <tr>
                    <td>#TRF-${t.transfer_id}</td>
                    <td>${AureonAPI.formatDate(t.transfer_date)}</td>
                    <td><strong>${t.sender_name}</strong> (${t.source_account_no.slice(-4)})</td>
                    <td><strong>${t.recipient_name || 'Direct Transfer'}</strong></td>
                    <td><span class="badge info">${t.purpose}</span></td>
                    <td style="color: #2563EB; font-weight: 700;">${AureonAPI.formatCurrency(t.amount)}</td>
                </tr>
            `).join("");
        }
    }

    // Print / Export
    const exportBtn = document.querySelector(".topbar button.btn-primary") || document.getElementById("generateReport");
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            window.print();
        });
    }
}
