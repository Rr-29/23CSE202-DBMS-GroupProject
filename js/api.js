/**
 * =====================================================================
 * Course: 23CSE202 Database Management Systems
 * Project: Aureon - Internet Banking System
 * Group No: D4 (Amrita School of Computing, Amritapuri Campus)
 * 
 * Shared Client-Side API & State Engine
 * Handles communication with Flask REST API & SQLite/MySQL Backend
 * =====================================================================
 */

"use strict";

const AureonAPI = (() => {
    // Dynamically detect base URL
    const isFileProtocol = window.location.protocol === "file:";
    const isDifferentPort = window.location.port !== "5000" && window.location.port !== "";
    const API_BASE = (isFileProtocol || isDifferentPort) ? "http://127.0.0.1:5000" : "";

    // Session Management
    function getUser() {
        const stored = localStorage.getItem("aureon_user");
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        // Default fallback customer for seamless demo
        return {
            id: 1,
            name: "Alex User",
            email: "user@aureon.com",
            phone: "+1 987 654 3210",
            primary_account: "AUR100234821",
            balance: 18580.75
        };
    }

    function setUser(user) {
        localStorage.setItem("aureon_user", JSON.stringify(user));
    }

    function getAdmin() {
        const stored = localStorage.getItem("aureon_admin");
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        return {
            id: 1,
            name: "Aureon System Administrator",
            email: "admin@aureon.com",
            role: "SuperAdmin"
        };
    }

    function setAdmin(admin) {
        localStorage.setItem("aureon_admin", JSON.stringify(admin));
    }

    function logout(isAdmin = false) {
        if (isAdmin) {
            localStorage.removeItem("aureon_admin");
            window.location.href = "../auth.html";
        } else {
            localStorage.removeItem("aureon_user");
            window.location.href = "auth.html";
        }
    }

    // Generic Fetch Wrapper
    async function request(endpoint, options = {}) {
        const user = getUser();
        const headers = {
            "Content-Type": "application/json",
            "X-User-Id": user ? user.id : 1,
            ...(options.headers || {})
        };

        let reqBody = options.body;
        if (reqBody && typeof reqBody === "string" && (!options.headers || options.headers["Content-Type"] !== "multipart/form-data")) {
            try {
                const parsed = JSON.parse(reqBody);
                if (user && user.id && !parsed.user_id) {
                    parsed.user_id = user.id;
                    reqBody = JSON.stringify(parsed);
                }
            } catch (e) {}
        }

        const url = `${API_BASE}${endpoint}`;
        try {
            const response = await fetch(url, { ...options, headers, body: reqBody });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            return {
                success: false,
                message: "Unable to connect to Aureon Banking Server. Please ensure Python backend is running."
            };
        }
    }

    // Toast Notification System
    function showToast(message, type = "info") {
        let container = document.querySelector(".toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            container.style.position = "fixed";
            container.style.top = "20px";
            container.style.right = "20px";
            container.style.zIndex = "999999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "12px";
            container.style.pointerEvents = "none";
            document.body.appendChild(container);
        }

        const iconClass = type === "success" ? "fa-circle-check" : 
                          type === "error" ? "fa-circle-xmark" : 
                          type === "warning" ? "fa-triangle-exclamation" : "fa-circle-info";
        const borderColor = type === "success" ? "#10B981" : 
                            type === "error" ? "#EF4444" : 
                            type === "warning" ? "#F59E0B" : "#2563EB";

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.style.minWidth = "300px";
        toast.style.maxWidth = "440px";
        toast.style.background = "#ffffff";
        toast.style.borderRadius = "12px";
        toast.style.padding = "14px 18px";
        toast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.18)";
        toast.style.display = "flex";
        toast.style.alignItems = "flex-start";
        toast.style.gap = "14px";
        toast.style.borderLeft = `5px solid ${borderColor}`;
        toast.style.pointerEvents = "auto";
        toast.style.transition = "all 0.35s ease";

        toast.innerHTML = `
            <i class="fa-solid ${iconClass}" style="color: ${borderColor}; font-size: 1.3rem; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <strong style="display: block; font-size: 0.95rem; color: #1F2937; margin-bottom: 2px;">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <p style="margin: 0; font-size: 0.88rem; color: #4B5563; line-height: 1.4;">${message}</p>
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(30px)";
            setTimeout(() => toast.remove(), 350);
        }, 4000);
    }

    function formatCurrency(amount) {
        const num = parseFloat(amount) || 0;
        return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatDate(dateStr) {
        if (!dateStr) return "Today";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
        } catch (e) {
            return dateStr;
        }
    }

    // Modal to Showcase Group Members & Contributions
    function showTeamModal() {
        let modal = document.getElementById("teamContributionModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "teamContributionModal";
            modal.className = "modal active";
            modal.innerHTML = `
                <div class="modal-content" style="width: min(780px, 95%); max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <div>
                            <h2 style="color: #1E3A8A; margin-bottom: 4px;">DBMS Course Project - Group D4</h2>
                            <small style="color: #6B7280; font-weight: 500;">23CSE202 Database Management Systems | Amrita School of Computing</small>
                        </div>
                        <button class="modal-close" onclick="document.getElementById('teamContributionModal').remove()">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style="margin-top: 15px;">
                        <p style="font-size: 0.95rem; color: #374151; margin-bottom: 20px;">
                            <strong>Aureon Internet Banking System</strong> is built with a 3NF/BCNF relational database architecture, ACID-compliant transactions, triggers, views, and stored procedures across 4 specialized modules.
                        </p>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 15px;">
                            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #2563EB; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">M</div>
                                    <div>
                                        <h4 style="margin: 0; color: #1E3A8A;">Mehrin A S</h4>
                                        <small style="color: #6B7280;">AM.SC.U4CSE25332</small>
                                    </div>
                                </div>
                                <span class="badge" style="background: #DBEAFE; color: #1D4ED8; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Module: Auth & User Security</span>
                                <p style="font-size: 0.85rem; color: #4B5563; margin-top: 8px;">
                                    User registration, credential separation (1:1), session verification, preferences, and profile management.
                                </p>
                            </div>

                            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #10B981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">N</div>
                                    <div>
                                        <h4 style="margin: 0; color: #1E3A8A;">Nithya Ajay</h4>
                                        <small style="color: #6B7280;">AM.SC.U4CSE25339</small>
                                    </div>
                                </div>
                                <span class="badge" style="background: #D1FAE5; color: #047857; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Module: Accounts & Cards</span>
                                <p style="font-size: 0.85rem; color: #4B5563; margin-top: 8px;">
                                    Savings & checking account lifecycle, balance tracking, debit/credit/virtual cards issuing, and freeze toggles.
                                </p>
                            </div>

                            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #F59E0B; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">R</div>
                                    <div>
                                        <h4 style="margin: 0; color: #1E3A8A;">Rudra Rajagopal</h4>
                                        <small style="color: #6B7280;">AM.SC.U4CSE25344</small>
                                    </div>
                                </div>
                                <span class="badge" style="background: #FEF3C7; color: #B45309; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Module: Transfers & Transactions</span>
                                <p style="font-size: 0.85rem; color: #4B5563; margin-top: 8px;">
                                    Ternary fund transfers, beneficiary management, atomic transactions, ledger integrity, and statement generation.
                                </p>
                            </div>

                            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #8B5CF6; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">V</div>
                                    <div>
                                        <h4 style="margin: 0; color: #1E3A8A;">Varun Nair</h4>
                                        <small style="color: #6B7280;">AM.SC.U4CSE25356</small>
                                    </div>
                                </div>
                                <span class="badge" style="background: #EDE9FE; color: #6D28D9; font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; font-weight: 600;">Module: Bills, Admin & Triggers</span>
                                <p style="font-size: 0.85rem; color: #4B5563; margin-top: 8px;">
                                    Utility bill settlement engine, admin analytics console, database audit trails, triggers, and aggregated views.
                                </p>
                            </div>
                        </div>

                        <div style="margin-top: 20px; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 15px;">
                            <button class="btn btn-primary" onclick="document.getElementById('teamContributionModal').remove()" style="padding: 8px 24px;">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.classList.add("active");
        }
    }

    return {
        API_BASE,
        getUser,
        setUser,
        getAdmin,
        setAdmin,
        logout,
        request,
        showToast,
        formatCurrency,
        formatDate,
        showTeamModal
    };
})();
