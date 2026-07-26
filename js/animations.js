"use strict";

document.addEventListener("DOMContentLoaded", () => {

    initializeScrollReveal();

    initializeFadeElements();

    initializeFloatingCards();

    initializeHoverEffects();

});

function initializeScrollReveal() {

    const revealElements = document.querySelectorAll(

        ".reveal, .glass-card, .stat-card, .feature-card"

    );

    if (!revealElements.length) return;

    const observer = new IntersectionObserver(

        (entries) => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("slide-up");

                    observer.unobserve(entry.target);

                }

            });

        },

        {

            threshold: 0.15

        }

    );

    revealElements.forEach(element => {

        observer.observe(element);

    });

}

function initializeFadeElements() {

    document.querySelectorAll(".fade-element")

        .forEach((element, index) => {

            element.style.opacity = "0";

            setTimeout(() => {

                element.classList.add("fade-in");

                element.style.opacity = "1";

            }, index * 120);

        });

}

function initializeFloatingCards() {

    document.querySelectorAll(

        ".bank-card, .balance-card"

    ).forEach(card => {

        card.classList.add("float");

    });

}

function initializeHoverEffects() {

    document.querySelectorAll(

        ".glass-card, .btn"

    ).forEach(element => {

        element.addEventListener("mouseenter", () => {

            element.style.transition = "all .3s ease";

        });

    });

}

function revealElement(element) {

    if (!element) return;

    element.classList.remove("hidden");

    element.classList.add("fade-in");

}

function hideElement(element) {

    if (!element) return;

    element.classList.add("hidden");

}

function animateCounters() {

    const counters = document.querySelectorAll("[data-counter]");

    counters.forEach(counter => {

        const target = Number(counter.dataset.counter);

        if (isNaN(target)) return;

        let value = 0;

        const increment = Math.max(1, Math.ceil(target / 80));

        const timer = setInterval(() => {

            value += increment;

            if (value >= target) {

                value = target;

                clearInterval(timer);

            }

            counter.textContent = value.toLocaleString("en-US");

        }, 20);

    });

}

function initializeLoadingScreen() {

    const loader = document.getElementById("loadingScreen");

    if (!loader) return;

    window.addEventListener("load", () => {

        loader.style.opacity = "0";

        setTimeout(() => {

            loader.style.display = "none";

        }, 500);

    });

}

function initializePageTransition() {

    document.body.classList.add("page-transition");

}

function pulseElements() {

    document.querySelectorAll(".pulse").forEach(element => {

        setInterval(() => {

            element.classList.add("pulse-active");

            setTimeout(() => {

                element.classList.remove("pulse-active");

            }, 600);

        }, 2500);

    });

}

function bounceButtons() {

    document.querySelectorAll(".bounce").forEach(button => {

        button.addEventListener("mouseenter", () => {

            button.classList.add("bounce-active");

        });

        button.addEventListener("animationend", () => {

            button.classList.remove("bounce-active");

        });

    });

}

function staggerAnimation(selector) {

    const items = document.querySelectorAll(selector);

    items.forEach((item, index) => {

        item.style.animationDelay = `${index * 0.1}s`;

        item.classList.add("slide-up");

    });

}

function enableFloating(selector) {

    document.querySelectorAll(selector).forEach(element => {

        element.classList.add("float");

    });

}

function removeAnimation(element, className) {

    if (!element) return;

    element.classList.remove(className);

}

function addAnimation(element, className) {

    if (!element) return;

    element.classList.add(className);

}

function restartAnimation(element, className) {

    if (!element) return;

    element.classList.remove(className);

    void element.offsetWidth;

    element.classList.add(className);

}

document.addEventListener("DOMContentLoaded", () => {

    animateCounters();

    initializeLoadingScreen();

    initializePageTransition();

    pulseElements();

    bounceButtons();

    staggerAnimation(".animate-list > *");

    enableFloating(".floating");

    console.log("Animations initialized.");

});