/**
 * =====================================================================
 * Course: 23CSE202 Database Management Systems
 * Project: Aureon - Internet Banking System
 * Group No: D4 (Amrita School of Computing, Amritapuri Campus)
 * 
 * MODULE: User Profile & Security Settings Controller
 * CONTRIBUTOR: Mehrin A S (Roll No: AM.SC.U4CSE25332)
 * Entities Managed: USERS, PROFILES, SETTINGS, LOGIN_CREDENTIALS
 * =====================================================================
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeProfilePage();
    initializeSettingsPage();
});

// =====================================================================
// PROFILE PAGE
// =====================================================================
async function initializeProfilePage() {
    if (!window.location.pathname.includes("profile.html") && !document.title.includes("Profile")) {
        return;
    }

    const user = AureonAPI.getUser();
    const topName = document.querySelector(".profile-dropdown h4");
    if (topName && user) topName.textContent = user.name;

    const res = await AureonAPI.request("/api/user/profile");
    if (!res.success || !res.profile) return;

    const p = res.profile;

    // Profile header
    const headerH2 = document.querySelector(".profile-info h2");
    if (headerH2) headerH2.textContent = p.full_name;
    const headerP = document.querySelector(".profile-info p");
    if (headerP) headerP.textContent = p.occupation || "Banking Customer";

    // Input fields in Personal Information
    const personalInputs = document.querySelectorAll(".dashboard-grid:nth-of-type(1) .glass-card:nth-child(1) input");
    if (personalInputs.length >= 5) {
        personalInputs[0].value = p.full_name || "";
        personalInputs[1].value = p.email || "";
        personalInputs[2].value = p.phone_no || "";
        personalInputs[3].value = p.date_of_birth || "";
        personalInputs[4].value = p.occupation || "";
    }

    // Input fields in Address Information
    const addressInputs = document.querySelectorAll(".dashboard-grid:nth-of-type(1) .glass-card:nth-child(2) input");
    if (addressInputs.length >= 1) {
        addressInputs[0].value = p.address || "";
    }

    // Save Changes Header Button
    const saveBtn = document.querySelector(".topbar button.btn-primary") || document.querySelector("header.topbar button");
    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            const updatedName = personalInputs[0] ? personalInputs[0].value.trim() : p.full_name;
            const updatedPhone = personalInputs[2] ? personalInputs[2].value.trim() : p.phone_no;
            const updatedOccupation = personalInputs[4] ? personalInputs[4].value.trim() : p.occupation;
            const updatedAddress = addressInputs[0] ? addressInputs[0].value.trim() : p.address;

            const saveRes = await AureonAPI.request("/api/user/profile", {
                method: "POST",
                body: JSON.stringify({
                    full_name: updatedName,
                    phone_no: updatedPhone,
                    occupation: updatedOccupation,
                    address: updatedAddress
                })
            });

            if (saveRes.success) {
                AureonAPI.showToast("Profile updated successfully!", "success");
                // Update local storage
                user.name = updatedName;
                user.phone = updatedPhone;
                user.address = updatedAddress;
                AureonAPI.setUser(user);
                if (topName) topName.textContent = updatedName;
                if (headerH2) headerH2.textContent = updatedName;
            } else {
                AureonAPI.showToast(saveRes.message || "Failed to update profile.", "error");
            }
        });
    }
}

// =====================================================================
// SETTINGS PAGE
// =====================================================================
async function initializeSettingsPage() {
    if (!window.location.pathname.includes("settings.html") && !document.title.includes("Settings")) {
        return;
    }

    const user = AureonAPI.getUser();
    const topName = document.querySelector(".profile-dropdown h4");
    if (topName && user) topName.textContent = user.name;

    // Load user settings
    const res = await AureonAPI.request("/api/user/settings");
    if (res.success && res.settings) {
        // Toggle checkboxes
        const switches = document.querySelectorAll("input[type='checkbox']");
        if (switches.length >= 2) {
            switches[0].checked = true; // 2FA
            switches[switches.length - 2].checked = !!res.settings.email_alerts;
            switches[switches.length - 1].checked = !!res.settings.sms_alerts;
        }
    }

    // Handle Password Change Form
    const pwdForm = document.querySelector(".glass-card form");
    if (pwdForm) {
        pwdForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const inputs = pwdForm.querySelectorAll("input[type='password']");
            if (inputs.length < 3) return;

            const currentPassword = inputs[0].value;
            const newPassword = inputs[1].value;
            const confirmPassword = inputs[2].value;

            if (newPassword.length < 6) {
                AureonAPI.showToast("New password must be at least 6 characters long.", "warning");
                return;
            }

            if (newPassword !== confirmPassword) {
                AureonAPI.showToast("New passwords do not match.", "error");
                return;
            }

            const changeRes = await AureonAPI.request("/api/user/change-password", {
                method: "POST",
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (changeRes.success) {
                AureonAPI.showToast("Password updated successfully!", "success");
                pwdForm.reset();
            } else {
                AureonAPI.showToast(changeRes.message || "Unable to update password.", "error");
            }
        });
    }

    // Save Settings Header Button
    const saveSettingsBtn = document.querySelector(".topbar button.btn-primary");
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", async () => {
            const switches = document.querySelectorAll("input[type='checkbox']");
            const emailAlerts = switches.length >= 2 ? switches[switches.length - 2].checked : true;
            const smsAlerts = switches.length >= 1 ? switches[switches.length - 1].checked : true;

            const res = await AureonAPI.request("/api/user/settings", {
                method: "POST",
                body: JSON.stringify({
                    theme: "light",
                    language: "English",
                    email_alerts: emailAlerts,
                    sms_alerts: smsAlerts
                })
            });

            if (res.success) {
                AureonAPI.showToast("Preferences saved to database!", "success");
            } else {
                AureonAPI.showToast(res.message || "Failed to save settings.", "error");
            }
        });
    }
}
