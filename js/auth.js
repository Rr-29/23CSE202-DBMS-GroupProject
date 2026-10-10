"use strict";

document.addEventListener("DOMContentLoaded", () => {

    initializeAuth();

});

function initializeAuth() {

    initializeAuthSwitch();

    initializePasswordToggle();

    initializeLoginForm();

    initializeRegisterForm();

    checkServerStatus();

}

function initializeAuthSwitch() {

    const loginButton = document.getElementById("loginTab");

    const registerButton = document.getElementById("registerTab");

    const loginForm = document.getElementById("loginForm");

    const registerForm = document.getElementById("registerForm");

    if (!loginButton || !registerButton ||
        !loginForm || !registerForm) {

        return;

    }

    loginButton.addEventListener("click", () => {

        loginButton.classList.add("active");

        registerButton.classList.remove("active");

        loginForm.classList.remove("hidden");

        registerForm.classList.add("hidden");

    });

    registerButton.addEventListener("click", () => {

        registerButton.classList.add("active");

        loginButton.classList.remove("active");

        registerForm.classList.remove("hidden");

        loginForm.classList.add("hidden");

    });

}

function initializePasswordToggle() {

    document.querySelectorAll(".password-toggle")
        .forEach(button => {

            button.addEventListener("click", () => {

                const input =

                    button.parentElement.querySelector("input");

                if (!input) return;

                const icon = button.querySelector("i");

                if (input.type === "password") {

                    input.type = "text";

                    if (icon) {

                        icon.classList.remove("fa-eye");

                        icon.classList.add("fa-eye-slash");

                    }

                } else {

                    input.type = "password";

                    if (icon) {

                        icon.classList.remove("fa-eye-slash");

                        icon.classList.add("fa-eye");

                    }

                }

            });

        });

}

function initializeLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!validateLogin(form)) {
            return;
        }

        const emailInput = document.getElementById("loginEmail") || form.querySelector('input[type="text"]') || form.querySelector('input[type="email"]');
        const passwordInput = document.getElementById("loginPassword") || form.querySelector('input[type="password"]');

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const alertBox = document.getElementById("loginAlert");

        if (alertBox) alertBox.style.display = "none";
        showLoader();

        try {
            const res = await AureonAPI.request("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            hideLoader();

            if (res.success) {
                showToast(res.role === "admin" ? "Welcome Administrator!" : "Login Successful!", "success");
                if (res.role === "admin") {
                    AureonAPI.setAdmin(res.user);
                    setTimeout(() => { window.location.href = res.redirect || "admin/dashboard.html"; }, 800);
                } else {
                    AureonAPI.setUser(res.user);
                    setTimeout(() => { window.location.href = res.redirect || "dashboard.html"; }, 800);
                }
            } else {
                const errMsg = res.message || "Invalid Email or Password";
                showToast(errMsg, "error");
                if (alertBox) {
                    alertBox.textContent = errMsg;
                    alertBox.style.display = "block";
                }
            }
        } catch (err) {
            hideLoader();
            const errMsg = "Connection to backend server failed. Make sure app is running (python start_server.py).";
            showToast(errMsg, "error");
            if (alertBox) {
                alertBox.textContent = errMsg;
                alertBox.style.display = "block";
            }
        }
    });
}

function validateLogin(form) {
    const emailInput = document.getElementById("loginEmail") || form.querySelector('input[type="text"]') || form.querySelector('input[type="email"]');
    const passwordInput = document.getElementById("loginPassword") || form.querySelector('input[type="password"]');

    if (!emailInput || !passwordInput) return false;

    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value;

    if (!emailVal) {
        showToast("Please enter your Email, Username, or Name.", "warning");
        emailInput.focus();
        return false;
    }

    if (!passVal) {
        showToast("Please enter your Password.", "warning");
        passwordInput.focus();
        return false;
    }

    return true;
}

window.fillLogin = function(identifier, password, autoSubmit = false) {
    const emailInput = document.getElementById("loginEmail") || document.querySelector('#loginForm input[type="text"], #loginForm input[type="email"]');
    const passwordInput = document.getElementById("loginPassword") || document.querySelector('#loginForm input[type="password"]');
    const form = document.getElementById("loginForm");

    // Switch to login tab if currently on register
    const loginTab = document.getElementById("loginTab");
    if (loginTab && !loginTab.classList.contains("active")) {
        loginTab.click();
    }

    if (emailInput) {
        emailInput.value = identifier;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (passwordInput) {
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const alertBox = document.getElementById("loginAlert");
    if (alertBox) alertBox.style.display = "none";

    if (autoSubmit && form) {
        const submitBtn = document.getElementById("btnLoginSubmit") || form.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.click();
        } else {
            form.requestSubmit ? form.requestSubmit() : form.submit();
        }
    } else {
        if (typeof showToast === "function") {
            showToast(`Autofilled credentials for ${identifier}. Click Login to enter.`, "info");
        }
    }
};

window.checkServerStatus = async function() {
    const badge = document.getElementById("serverStatusBadge");
    if (!badge) return;

    try {
        const res = await AureonAPI.request("/api/health");
        if (res && res.status === "online") {
            badge.className = "server-status-badge online";
            badge.innerHTML = `<span class="status-dot"></span><span class="status-text">Backend Connected (${(res.database || "SQLite").toUpperCase()}) &bull; Ready</span>`;
        } else {
            badge.className = "server-status-badge offline";
            badge.innerHTML = `<span class="status-dot"></span><span class="status-text">Backend Offline &bull; Run start_server.py</span>`;
        }
    } catch (e) {
        badge.className = "server-status-badge offline";
        badge.innerHTML = `<span class="status-dot"></span><span class="status-text">Backend Offline &bull; Run start_server.py</span>`;
    }
};

/*==================================================
    Registration Form
==================================================*/

function initializeRegisterForm() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!validateRegistration(form)) {
            showToast("Please complete all required fields.", "warning");
            return;
        }

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const phone = document.getElementById("mobile").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        showLoader();

        try {
            const res = await AureonAPI.request("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    password: password
                })
            });

            hideLoader();

            if (res.success) {
                showToast("Account created successfully! Please log in.", "success");
                form.reset();
                // Switch to login tab
                const loginTab = document.getElementById("loginTab");
                if (loginTab) loginTab.click();
                const loginEmail = document.getElementById("loginEmail");
                if (loginEmail) loginEmail.value = email;
            } else {
                showToast(res.message || "Registration failed.", "error");
            }
        } catch (err) {
            hideLoader();
            showToast("Connection to backend server failed.", "error");
        }
    });
}

function validateRegistration(form) {

    const requiredFields =

        form.querySelectorAll("[required]");

    for (const field of requiredFields) {

        if (field.value.trim() === "") {

            field.focus();

            return false;

        }

    }

    const email =

        form.querySelector('input[type="email"]');

    if (email && !isValidEmail(email.value.trim())) {

        email.focus();

        return false;

    }

    const password =

        form.querySelector('input[type="password"]');

    if (password && password.value.length < 6) {

        password.focus();

        return false;

    }

    const confirmPassword =

        form.querySelector("#confirmPassword");

    if (confirmPassword &&
        password &&
        password.value !== confirmPassword.value) {

        showToast(

            "Passwords do not match.",

            "error"

        );

        confirmPassword.focus();

        return false;

    }

    return true;

}

/*
==================================================
 End of auth.js Part 1
==================================================
*/

/*
==================================================
 Aureon - Internet Banking System
 File: js/auth.js
 Part 2 - Forgot Password, OTP & Admin Login
==================================================
*/

"use strict";

/*==================================================
    Forgot Password
==================================================*/

function initializeForgotPassword() {

    const form = document.getElementById("forgotPasswordForm");

    if (!form) return;

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const email = form.querySelector('input[type="email"]');

        if (!email || !isValidEmail(email.value.trim())) {

            showToast(
                "Please enter a valid email address.",
                "error"
            );

            return;
        }

        showLoader();

        setTimeout(() => {

            hideLoader();

            showToast(
                "OTP has been sent successfully.",
                "success"
            );

            window.location.href = "otp.html";

        }, 1200);

    });

}

/*==================================================
    OTP Input
==================================================*/

function initializeOTPInputs() {

    const inputs = document.querySelectorAll(".otp-input");

    if (!inputs.length) return;

    inputs.forEach((input, index) => {

        input.addEventListener("input", () => {

            input.value = input.value.replace(/\D/g, "");

            if (input.value && index < inputs.length - 1) {

                inputs[index + 1].focus();

            }

        });

        input.addEventListener("keydown", (event) => {

            if (
                event.key === "Backspace" &&
                !input.value &&
                index > 0
            ) {

                inputs[index - 1].focus();

            }

        });

    });

}

/*==================================================
    OTP Verification
==================================================*/

function initializeOTPVerification() {

    const form = document.getElementById("otpForm");

    if (!form) return;

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const code = Array.from(
            document.querySelectorAll(".otp-input")
        ).map(input => input.value).join("");

        if (code.length !== 6) {

            showToast(
                "Please enter the 6-digit OTP.",
                "warning"
            );

            return;
        }

        showLoader();

        setTimeout(() => {

            hideLoader();

            showToast(
                "OTP verified successfully.",
                "success"
            );

            window.location.href = "auth.html";

        }, 1200);

    });

}

/*==================================================
    Resend OTP Timer
==================================================*/

function initializeResendTimer() {

    const timer = document.getElementById("otpTimer");
    const resend = document.getElementById("resendOTP");

    if (!timer || !resend) return;

    let seconds = 60;

    resend.style.pointerEvents = "none";
    resend.style.opacity = "0.5";

    const interval = setInterval(() => {

        timer.textContent = seconds;

        seconds--;

        if (seconds < 0) {

            clearInterval(interval);

            timer.textContent = "0";

            resend.style.pointerEvents = "auto";
            resend.style.opacity = "1";

        }

    }, 1000);

    resend.addEventListener("click", () => {

        showToast(
            "A new OTP has been sent.",
            "success"
        );

        location.reload();

    });

}

/*==================================================
    Admin Login
==================================================*/

function initializeAdminLogin() {

    const form = document.getElementById("adminLoginForm");

    if (!form) return;

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const email = document.getElementById("adminEmail");
        const password = document.getElementById("adminPassword");

        if (
            !email ||
            !password ||
            !isValidEmail(email.value.trim()) ||
            password.value.length < 6
        ) {

            showToast(
                "Invalid administrator credentials.",
                "error"
            );

            return;

        }

        showLoader();

        setTimeout(() => {

            hideLoader();

            showToast(
                "Administrator login successful.",
                "success"
            );

            window.location.href = "dashboard.html";

        }, 1200);

    });

}

/*==================================================
    Authentication Helpers
==================================================*/

function clearAuthForms() {

    document.querySelectorAll("form").forEach(form => {

        form.reset();

    });

}

function disableAuthForm(formId) {

    const form = document.getElementById(formId);

    if (!form) return;

    form.querySelectorAll("input, button").forEach(element => {

        element.disabled = true;

    });

}

function enableAuthForm(formId) {

    const form = document.getElementById(formId);

    if (!form) return;

    form.querySelectorAll("input, button").forEach(element => {

        element.disabled = false;

    });

}

/*==================================================
    Initialize Additional Modules
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeForgotPassword();

    initializeOTPInputs();

    initializeOTPVerification();

    initializeResendTimer();

    initializeAdminLogin();

});

/*
==================================================
 End of auth.js
==================================================
*/