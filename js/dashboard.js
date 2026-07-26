document.addEventListener("DOMContentLoaded", () => {

    initializeDashboard();

});

function initializeDashboard() {

    initializeSidebarToggle();

    initializeProfileDropdown();

    initializeBalanceToggle();

    initializeQuickActions();

    animateDashboardCards();

}

function initializeSidebarToggle() {

    const toggleButton = document.getElementById("sidebarToggle");

    const sidebar = document.querySelector(".sidebar");

    if (!toggleButton || !sidebar) return;

    toggleButton.addEventListener("click", () => {

        sidebar.classList.toggle("collapsed");

        document.body.classList.toggle("sidebar-collapsed");

    });

}

function initializeProfileDropdown() {

    const profileButton = document.querySelector(".profile-dropdown");

    const dropdownMenu = document.querySelector(".profile-menu");

    if (!profileButton || !dropdownMenu) return;

    profileButton.addEventListener("click", (event) => {

        event.stopPropagation();

        dropdownMenu.classList.toggle("active");

    });

    document.addEventListener("click", () => {

        dropdownMenu.classList.remove("active");

    });

}

function initializeBalanceToggle() {

    const toggleButton = document.getElementById("balanceToggle");

    const balance = document.getElementById("accountBalance");

    if (!toggleButton || !balance) return;

    let hidden = false;

    toggleButton.addEventListener("click", () => {

        hidden = !hidden;

        if (hidden) {

            balance.dataset.original = balance.textContent;

            balance.textContent = "••••••••";

            toggleButton.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';

        } else {

            balance.textContent = balance.dataset.original;

            toggleButton.innerHTML =
                '<i class="fa-solid fa-eye"></i>';

        }

    });

}

function initializeQuickActions() {

    document.querySelectorAll(".quick-action")
        .forEach(button => {

            button.addEventListener("click", () => {

                const action =
                    button.dataset.action || "selected";

                showToast(
                    `${action} action selected.`,
                    "success"
                );

            });

        });

}

function animateDashboardCards() {

    const cards = document.querySelectorAll(

        ".stat-card, .glass-card"

    );

    cards.forEach((card, index) => {

        card.style.opacity = "0";

        card.style.transform = "translateY(20px)";

        setTimeout(() => {

            card.style.transition =
                "all 0.5s ease";

            card.style.opacity = "1";

            card.style.transform =
                "translateY(0)";

        }, index * 120);

    });

}

function displayWelcomeMessage() {

    const welcome = document.getElementById("welcomeMessage");

    if (!welcome) return;

    const hour = new Date().getHours();

    let message = "Welcome";

    if (hour < 12) {

        message = "Good Morning";

    } else if (hour < 18) {

        message = "Good Afternoon";

    } else {

        message = "Good Evening";

    }

    welcome.textContent = `${message}, User`;

}

document.addEventListener(

    "DOMContentLoaded",

    displayWelcomeMessage

);

function initializeTransactionSearch() {

    const searchInput =
        document.getElementById("transactionSearch");

    const table =
        document.querySelector(".transactions-card table");

    if (!searchInput || !table) return;

    const rows = table.querySelectorAll("tbody tr");

    searchInput.addEventListener("input", () => {

        const keyword =
            searchInput.value.toLowerCase().trim();

        rows.forEach(row => {

            const content =
                row.textContent.toLowerCase();

            row.style.display =
                content.includes(keyword)
                    ? ""
                    : "none";

        });

    });

}

function initializeTransactionFilter() {

    const filter =
        document.getElementById("transactionFilter");

    const rows =
        document.querySelectorAll(
            ".transactions-card tbody tr"
        );

    if (!filter || !rows.length) return;

    filter.addEventListener("change", () => {

        const value =
            filter.value.toLowerCase();

        rows.forEach(row => {

            if (
                value === "all" ||
                row.textContent.toLowerCase().includes(value)
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });

}

function initializeNotifications() {

    document
        .querySelectorAll(".notification-card")
        .forEach(card => {

            card.addEventListener("click", () => {

                card.classList.remove("unread");

                showToast(
                    "Notification opened.",
                    "success"
                );

            });

        });

}

function initializeBeneficiaries() {

    document
        .querySelectorAll(".beneficiary-card")
        .forEach(card => {

            card.addEventListener("click", () => {

                document
                    .querySelectorAll(".beneficiary-card")
                    .forEach(item =>
                        item.classList.remove("selected")
                    );

                card.classList.add("selected");

            });

        });

}

function initializeAccountSelection() {

    document
        .querySelectorAll(".account-card")
        .forEach(card => {

            card.addEventListener("click", () => {

                document
                    .querySelectorAll(".account-card")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                card.classList.add("active");

            });

        });

}

function initializeBillPayments() {

    document
        .querySelectorAll(".pay-bill")
        .forEach(button => {

            button.addEventListener("click", () => {

                showLoader();

                setTimeout(() => {

                    hideLoader();

                    showToast(
                        "Bill payment initiated.",
                        "success"
                    );

                }, 1000);

            });

        });

}

function initializeCardControls() {

    document
        .querySelectorAll(".card-action")
        .forEach(button => {

            button.addEventListener("click", () => {

                const action =
                    button.dataset.action || "Card";

                showToast(
                    `${action} completed successfully.`,
                    "success"
                );

            });

        });

}

function initializeTransferButton() {

    const transferButton =
        document.getElementById("transferButton");

    if (!transferButton) return;

    transferButton.addEventListener("click", () => {

        showLoader();

        setTimeout(() => {

            hideLoader();

            showToast(
                "Transfer request submitted.",
                "success"
            );

        }, 1200);

    });

}

document.addEventListener("DOMContentLoaded", () => {

    initializeTransactionSearch();

    initializeTransactionFilter();

    initializeNotifications();

    initializeBeneficiaries();

    initializeAccountSelection();

    initializeBillPayments();

    initializeCardControls();

    initializeTransferButton();

});

function animateStatistics() {

    const counters = document.querySelectorAll("[data-count]");

    counters.forEach(counter => {

        const target = Number(counter.dataset.count);

        if (isNaN(target)) return;

        let current = 0;

        const increment = Math.max(1, Math.ceil(target / 100));

        const timer = setInterval(() => {

            current += increment;

            if (current >= target) {

                current = target;

                clearInterval(timer);

            }

            counter.textContent =
                current.toLocaleString("en-US");

        }, 20);

    });

}

function initializeCharts() {

    const bars = document.querySelectorAll(".dummy-chart .bar");

    if (!bars.length) return;

    bars.forEach((bar, index) => {

        const finalHeight =
            bar.style.height || "60%";

        bar.style.height = "0";

        setTimeout(() => {

            bar.style.transition =
                "height 0.8s ease";

            bar.style.height = finalHeight;

        }, index * 120);

    });

}

function loadRecentActivities() {

    const table =
        document.querySelector(".transactions-card tbody");

    if (!table) return;

    table.classList.add("fade-in");

}

function refreshDashboard() {

    const refreshButton =
        document.getElementById("refreshDashboard");

    if (!refreshButton) return;

    refreshButton.addEventListener("click", () => {

        showLoader();

        setTimeout(() => {

            hideLoader();

            initializeCharts();

            animateStatistics();

            showToast(
                "Dashboard refreshed successfully.",
                "success"
            );

        }, 1200);

    });

}

function updateLastUpdated() {

    const element =
        document.getElementById("lastUpdated");

    if (!element) return;

    const now = new Date();

    element.textContent =
        now.toLocaleTimeString("en-US", {

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"

        });

}

function startAutoRefresh() {

    updateLastUpdated();

    setInterval(() => {

        updateLastUpdated();

    }, 60000);

}

function formatBalanceElements() {

    document.querySelectorAll("[data-balance]")
        .forEach(element => {

            const amount =
                Number(element.dataset.balance);

            if (!isNaN(amount)) {

                element.textContent =
                    formatCurrency(amount);

            }

        });

}

function showDailyGreeting() {

    const greeting =
        document.getElementById("dailyGreeting");

    if (!greeting) return;

    const hour = new Date().getHours();

    let text = "Have a productive day!";

    if (hour < 12) {

        text = "Good morning!";

    } else if (hour < 18) {

        text = "Good afternoon!";

    } else {

        text = "Good evening!";

    }

    greeting.textContent = text;

}

function highlightCurrentMenu() {

    const page =
        window.location.pathname.split("/").pop();

    document
        .querySelectorAll(".sidebar-menu a")
        .forEach(link => {

            const href = link.getAttribute("href");

            if (href === page) {

                link.classList.add("active");

            }

        });

}

document.addEventListener("DOMContentLoaded", () => {

    animateStatistics();

    initializeCharts();

    loadRecentActivities();

    refreshDashboard();

    startAutoRefresh();

    formatBalanceElements();

    showDailyGreeting();

    highlightCurrentMenu();

    console.log(
        "Dashboard initialized successfully."
    );

});