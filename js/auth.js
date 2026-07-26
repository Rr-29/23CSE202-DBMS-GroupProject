"use strict";

document.addEventListener("DOMContentLoaded", () => {

    initializeAuth();

});

function initializeAuth() {

    initializeAuthSwitch();

    initializePasswordToggle();

    initializeLoginForm();

    initializeRegisterForm();

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

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        if (!validateLogin(form)) {

            showToast(

                "Please enter valid login details.",

                "error"

            );

            return;

        }

        const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;

    showLoader();

    setTimeout(() => {

        hideLoader();

        // Admin Login
        if (
            email === "admin@aureon.com" &&
            password === "Admin@123"
        ) {

            showToast(
                "Welcome Administrator!",
                "success"
            );

            window.location.href = "admin/dashboard.html";
            return;
        }

        if (
            email === "user@aureon.com" &&
            password === "User@123"
        ) {

            showToast(
                "Login Successful!",
                "success"
            );

            window.location.href = "dashboard.html";
            return;
        }

        // Invalid Login
        showToast(
            "Invalid Email or Password",
            "error"
        );

    }, 1200);

    });

}

function validateLogin(form) {

    const email =

        form.querySelector('input[type="email"]');

    const password =

        form.querySelector('input[type="password"]');

    if (!email || !password) {

        return false;

    }

    if (!isValidEmail(email.value.trim())) {

        return false;

    }

    if (password.value.trim().length < 6) {

        return false;

    }

    return true;

}

/*==================================================
    Registration Form
==================================================*/

function initializeRegisterForm() {

    const form = document.getElementById("registerForm");

    if (!form) return;

    form.addEventListener("submit", (event) => {

        event.preventDefault();

        if (!validateRegistration(form)) {

            showToast(

                "Please complete all required fields.",

                "warning"

            );

            return;

        }

        showLoader();

        setTimeout(() => {

            hideLoader();

            showToast(

                "Registration completed successfully.",

                "success"

            );

            form.reset();

        }, 1400);

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