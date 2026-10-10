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
    const headerH2 = document.getElementById("profileDisplayName") || document.querySelector(".profile-info h2");
    if (headerH2) headerH2.textContent = p.full_name;

    const headerP = document.getElementById("profileDisplayOccupation") || document.querySelector(".profile-info p");
    if (headerP) headerP.textContent = p.occupation || "Banking Customer";

    const avatarImg = document.getElementById("profileAvatarImg") || document.querySelector(".profile-avatar img");
    if (avatarImg && p.profile_picture) {
        avatarImg.src = p.profile_picture;
    }

    // Populate Input fields by explicit ID
    const nameInput = document.getElementById("profileFullName");
    if (nameInput) nameInput.value = p.full_name || "";

    const emailInput = document.getElementById("profileEmail");
    if (emailInput) emailInput.value = p.email || "";

    const phoneInput = document.getElementById("profilePhone");
    if (phoneInput) phoneInput.value = p.phone_no || "";

    const dobInput = document.getElementById("profileDob");
    if (dobInput) dobInput.value = p.date_of_birth || "";

    const occInput = document.getElementById("profileOccupation");
    if (occInput) occInput.value = p.occupation || "";

    const addressInput = document.getElementById("profileAddress");
    if (addressInput) addressInput.value = p.address || "";

    const cityInput = document.getElementById("profileCity");
    if (cityInput) cityInput.value = p.city || "New York";

    const bioInput = document.getElementById("profileBio");
    if (bioInput) bioInput.value = p.bio || "";

    // 1. CHANGE PHOTO HANDLER
    const changePhotoBtn = document.getElementById("btnChangePhoto");
    const fileInput = document.getElementById("avatarFileInput");

    if (changePhotoBtn && fileInput) {
        changePhotoBtn.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                AureonAPI.showToast("Please choose an image file (PNG/JPG).", "warning");
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const dataUrl = event.target.result;

                // Update UI immediately
                if (avatarImg) avatarImg.src = dataUrl;
                document.querySelectorAll(".profile-dropdown img, .sidebar-logo img").forEach(img => {
                    img.src = dataUrl;
                });

                // Save to database
                const photoRes = await AureonAPI.request("/api/user/profile", {
                    method: "POST",
                    body: JSON.stringify({
                        profile_picture: dataUrl
                    })
                });

                if (photoRes.success) {
                    AureonAPI.showToast("Profile photo updated successfully!", "success");
                    // Persist to local storage
                    user.profile_picture = dataUrl;
                    AureonAPI.setUser(user);
                } else {
                    AureonAPI.showToast(photoRes.message || "Failed to save photo.", "error");
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // 2. SAVE CHANGES HANDLER (Top button and Bottom button)
    async function handleProfileSave(btn) {
        const updatedName = nameInput ? nameInput.value.trim() : p.full_name;
        const updatedPhone = phoneInput ? phoneInput.value.trim() : p.phone_no;
        const updatedOccupation = occInput ? occInput.value.trim() : p.occupation;
        const updatedAddress = addressInput ? addressInput.value.trim() : p.address;
        const updatedBio = bioInput ? bioInput.value.trim() : p.bio;

        if (!updatedName) {
            AureonAPI.showToast("Full Name cannot be empty.", "warning");
            return;
        }

        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const saveRes = await AureonAPI.request("/api/user/profile", {
            method: "POST",
            body: JSON.stringify({
                full_name: updatedName,
                phone_no: updatedPhone,
                occupation: updatedOccupation,
                address: updatedAddress,
                bio: updatedBio
            })
        });

        btn.disabled = false;
        btn.innerHTML = originalText;

        if (saveRes.success) {
            AureonAPI.showToast("Profile changes saved successfully to database!", "success");
            // Update local storage
            user.name = updatedName;
            user.phone = updatedPhone;
            user.address = updatedAddress;
            user.occupation = updatedOccupation;
            AureonAPI.setUser(user);

            if (topName) topName.textContent = updatedName;
            if (headerH2) headerH2.textContent = updatedName;
            if (headerP) headerP.textContent = updatedOccupation;
        } else {
            AureonAPI.showToast(saveRes.message || "Failed to update profile.", "error");
        }
    }

    const saveTopBtn = document.getElementById("btnSaveProfile") || document.querySelector(".topbar button.btn-primary");
    if (saveTopBtn) {
        saveTopBtn.addEventListener("click", () => handleProfileSave(saveTopBtn));
    }

    const saveBottomBtn = document.getElementById("btnSaveProfileBottom");
    if (saveBottomBtn) {
        saveBottomBtn.addEventListener("click", () => handleProfileSave(saveBottomBtn));
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

    // Handle Transfer Password Form in Settings
    const trfPinForm = document.getElementById("formTransferPinSettings");
    if (trfPinForm) {
        trfPinForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const curPwd = document.getElementById("settingsCurrentTrfPwd").value;
            const newPwd = document.getElementById("settingsNewTrfPwd").value;
            const confPwd = document.getElementById("settingsConfirmTrfPwd").value;

            if (newPwd !== confPwd) {
                AureonAPI.showToast("New transfer passwords do not match.", "error");
                return;
            }

            if (newPwd.length < 4) {
                AureonAPI.showToast("Transfer password must be at least 4 characters.", "warning");
                return;
            }

            const submitBtn = trfPinForm.querySelector("button[type='submit']");
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const res = await AureonAPI.request("/api/user/transfer-password", {
                method: "POST",
                body: JSON.stringify({
                    current_password: curPwd,
                    new_transfer_password: newPwd
                })
            });

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-key"></i> Update Transfer Password';

            if (res.success) {
                AureonAPI.showToast(res.message, "success");
                trfPinForm.reset();
            } else {
                AureonAPI.showToast(res.message || "Failed to update transfer password.", "error");
            }
        });
    }
}
