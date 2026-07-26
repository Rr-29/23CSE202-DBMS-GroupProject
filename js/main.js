"use strict";

document.addEventListener("DOMContentLoaded", () => {

    initializeApplication();

});

function initializeApplication() {

    initializeSmoothScroll();

    initializeDropdowns();

    initializeMobileNavigation();

}

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


function initializeSmoothScroll() {

    $$('a[href^="#"]').forEach(link => {

        link.addEventListener("click", function (event) {

            const targetId = this.getAttribute("href");

            if (targetId === "#") return;

            const target = document.querySelector(targetId);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({

                behavior: "smooth",
                block: "start"

            });

        });

    });

}

function initializeMobileNavigation() {

    const toggleButton = $("#mobileMenuToggle");

    const navigation = $(".nav-links");

    if (!toggleButton || !navigation) return;

    toggleButton.addEventListener("click", () => {

        navigation.classList.toggle("active");

        toggleButton.classList.toggle("active");

    });

}

function initializeDropdowns() {

    const dropdownButtons = $$(".dropdown-toggle");

    dropdownButtons.forEach(button => {

        button.addEventListener("click", function (event) {

            event.stopPropagation();

            const dropdown = this.closest(".dropdown");

            if (!dropdown) return;

            closeDropdowns(dropdown);

            dropdown.classList.toggle("active");

        });

    });

    document.addEventListener("click", () => {

        closeDropdowns();

    });

}

function closeDropdowns(exceptDropdown = null) {

    $$(".dropdown").forEach(dropdown => {

        if (dropdown !== exceptDropdown) {

            dropdown.classList.remove("active");

        }

    });

}

window.addEventListener("resize", () => {

    if (window.innerWidth > 992) {

        const navigation = $(".nav-links");

        if (navigation) {

            navigation.classList.remove("active");

        }

    }

});

console.log(
    "%cAureon Internet Banking System",
    "color:#2563EB;font-size:18px;font-weight:bold;"
);

console.log(
    "%cFrontend Initialized Successfully",
    "color:#10B981;font-size:14px;"
);

function openModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.add("active");

    document.body.style.overflow = "hidden";

}

function closeModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) return;

    modal.classList.remove("active");

    document.body.style.overflow = "";

}

document.addEventListener("click", (event) => {

    if (event.target.classList.contains("modal")) {

        event.target.classList.remove("active");

        document.body.style.overflow = "";

    }

});

$$(".modal-close").forEach(button => {

    button.addEventListener("click", () => {

        const modal = button.closest(".modal");

        if (!modal) return;

        modal.classList.remove("active");

        document.body.style.overflow = "";

    });

});

function showToast(message, type = "success") {

    let container = document.querySelector(".toast-container");

    if (!container) {

        container = document.createElement("div");

        container.className = "toast-container";

        document.body.appendChild(container);

    }

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    let icon = "fa-circle-info";

    if (type === "success") icon = "fa-circle-check";

    if (type === "error") icon = "fa-circle-xmark";

    if (type === "warning") icon = "fa-triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-content">
            <strong>${type.toUpperCase()}</strong>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform = "translateX(30px)";

        setTimeout(() => toast.remove(), 300);

    }, 3000);

}


function showLoader() {

    let loader = document.getElementById("pageLoader");

    if (!loader) {

        loader = document.createElement("div");

        loader.id = "pageLoader";

        loader.className = "loader-overlay";

        loader.innerHTML = `
            <div class="loader"></div>
        `;

        document.body.appendChild(loader);

    }

    loader.style.display = "flex";

}

function hideLoader() {

    const loader = document.getElementById("pageLoader");

    if (!loader) return;

    loader.style.display = "none";

}


function enableButton(button) {

    if (!button) return;

    button.disabled = false;

    button.classList.remove("disabled");

}

function disableButton(button) {

    if (!button) return;

    button.disabled = true;

    button.classList.add("disabled");

}

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-US", {

        style: "currency",

        currency: "USD"

    }).format(amount);

}

function generateRandomId(length = 8) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {

        result += characters.charAt(

            Math.floor(Math.random() * characters.length)

        );

    }

    return result;

}

$$("input").forEach(input => {

    input.addEventListener("blur", () => {

        input.value = input.value.trim();

    });

});

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        document.querySelectorAll(".modal.active")
            .forEach(modal => {

                modal.classList.remove("active");

            });

        document.body.style.overflow = "";

    }

});

function createScrollTopButton() {

    const button = document.createElement("button");

    button.id = "scrollTopButton";

    button.className = "btn btn-primary scroll-top-btn";

    button.innerHTML =
        '<i class="fa-solid fa-arrow-up"></i>';

    document.body.appendChild(button);

    button.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

    window.addEventListener("scroll", () => {

        if (window.scrollY > 300) {

            button.classList.add("show");

        } else {

            button.classList.remove("show");

        }

    });

}

document.addEventListener("DOMContentLoaded", () => {

    createScrollTopButton();

});

function applyPageTransition() {

    document.body.classList.add("page-transition");

}

window.addEventListener("load", applyPageTransition);

function validateRequiredFields(form) {

    let valid = true;

    const fields = form.querySelectorAll("[required]");

    fields.forEach(field => {

        if (field.value.trim() === "") {

            field.classList.add("input-error");

            valid = false;

        } else {

            field.classList.remove("input-error");

        }

    });

    return valid;

}

function isValidEmail(email) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(email);

}

document.querySelectorAll(".numbers-only")
    .forEach(input => {

        input.addEventListener("input", () => {

            input.value = input.value.replace(/\D/g, "");

        });

    });


function animateOnScroll() {

    const elements = document.querySelectorAll(

        ".fade-on-scroll"

    );

    const observer = new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("fade-in");

                    observer.unobserve(entry.target);

                }

            });

        },

        {

            threshold: 0.2

        }

    );

    elements.forEach(element => {

        observer.observe(element);

    });

}

document.addEventListener(

    "DOMContentLoaded",

    animateOnScroll

);

function debounce(callback, delay = 300) {

    let timeout;

    return (...args) => {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}

async function copyToClipboard(text) {

    try {

        await navigator.clipboard.writeText(text);

        showToast(

            "Copied to clipboard.",

            "success"

        );

    }

    catch {

        showToast(

            "Unable to copy text.",

            "error"

        );

    }

}

function getCurrentDate() {

    return new Date().toLocaleDateString(

        "en-US",

        {

            year: "numeric",

            month: "long",

            day: "numeric"

        }

    );

}

document.addEventListener(

    "DOMContentLoaded",

    () => {

        const yearElement =

            document.getElementById("currentYear");

        if (yearElement) {

            yearElement.textContent =

                new Date().getFullYear();

        }

    }

);

window.addEventListener("online", () => {

    showToast(

        "Internet connection restored.",

        "success"

    );

});

window.addEventListener("offline", () => {

    showToast(

        "You are currently offline.",

        "warning"

    );

});


window.addEventListener("error", (event) => {

    console.error(

        "Application Error:",

        event.message

    );

});

document.addEventListener(

    "DOMContentLoaded",

    () => {

        console.log(

            "Aureon UI loaded successfully."

        );

    }

);
