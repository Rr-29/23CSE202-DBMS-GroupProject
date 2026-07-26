"use strict";

document.addEventListener("DOMContentLoaded", () => {

    initializeAdmin();

});

function initializeAdmin() {

    initializeCustomerSearch();

    initializeCustomerFilter();

    initializeCustomerActions();

    initializeReportFilters();

    initializeAdminNotifications();

}

function initializeCustomerSearch() {

    const searchInput = document.getElementById("customerSearch");

    const table = document.querySelector(".transactions-card table");

    if (!searchInput || !table) return;

    const rows = table.querySelectorAll("tbody tr");

    searchInput.addEventListener("input", () => {

        const keyword = searchInput.value
            .toLowerCase()
            .trim();

        rows.forEach(row => {

            const content = row.textContent.toLowerCase();

            row.style.display = content.includes(keyword)
                ? ""
                : "none";

        });

    });

}


function initializeCustomerFilter() {

    const filter = document.getElementById("customerStatus");

    if (!filter) return;

    const rows = document.querySelectorAll(
        ".transactions-card tbody tr"
    );

    filter.addEventListener("change", () => {

        const selected = filter.value.toLowerCase();

        rows.forEach(row => {

            if (
                selected === "all" ||
                row.textContent.toLowerCase().includes(selected)
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    });

}

function initializeCustomerActions() {

    document.querySelectorAll("[data-admin-action]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const action = button.dataset.adminAction;

                switch (action) {

                    case "view":

                        showToast(
                            "Opening customer profile...",
                            "success"
                        );

                        break;

                    case "edit":

                        showToast(
                            "Customer editor opened.",
                            "success"
                        );

                        break;

                    case "approve":

                        showToast(
                            "Customer approved successfully.",
                            "success"
                        );

                        break;

                    case "delete":

                        if (confirm(
                            "Delete this customer?"
                        )) {

                            const row = button.closest("tr");

                            if (row) {

                                row.remove();

                            }

                            showToast(
                                "Customer removed.",
                                "warning"
                            );

                        }

                        break;

                    default:

                        showToast(
                            "Action completed.",
                            "success"
                        );

                }

            });

        });

}

function initializeReportFilters() {

    const generateButton =
        document.getElementById("generateReport");

    if (!generateButton) return;

    generateButton.addEventListener("click", () => {

        showLoader();

        setTimeout(() => {

            hideLoader();

            showToast(
                "Report generated successfully.",
                "success"
            );

        }, 1200);

    });

}


function initializeAdminNotifications() {

    document.querySelectorAll(".admin-notification")
        .forEach(item => {

            item.addEventListener("click", () => {

                item.classList.remove("unread");

                showToast(
                    "Notification marked as read.",
                    "success"
                );

            });

        });

}


function updateAdminGreeting() {

    const banner =
        document.getElementById("adminGreeting");

    if (!banner) return;

    const hour = new Date().getHours();

    let greeting = "Welcome";

    if (hour < 12) {

        greeting = "Good Morning";

    } else if (hour < 18) {

        greeting = "Good Afternoon";

    } else {

        greeting = "Good Evening";

    }

    banner.textContent =
        `${greeting}, Administrator`;

}

document.addEventListener(
    "DOMContentLoaded",
    updateAdminGreeting
);


function animateKPICounters() {

    const counters = document.querySelectorAll("[data-admin-count]");

    counters.forEach(counter => {

        const target = Number(counter.dataset.adminCount);

        if (isNaN(target)) return;

        let current = 0;

        const increment = Math.max(1, Math.ceil(target / 80));

        const timer = setInterval(() => {

            current += increment;

            if (current >= target) {

                current = target;

                clearInterval(timer);

            }

            counter.textContent = current.toLocaleString("en-US");

        }, 20);

    });

}


function initializeAdminCharts() {

    const bars = document.querySelectorAll(".dummy-chart .bar");

    if (!bars.length) return;

    bars.forEach((bar, index) => {

        const finalHeight = bar.style.height || "60%";

        bar.style.height = "0";

        setTimeout(() => {

            bar.style.transition = "height .8s ease";

            bar.style.height = finalHeight;

        }, index * 100);

    });

}

function initializeExportButtons() {

    document.querySelectorAll(".export-report").forEach(button => {

        button.addEventListener("click", () => {

            const format = button.dataset.format || "Report";

            showLoader();

            setTimeout(() => {

                hideLoader();

                showToast(
                    `${format} exported successfully.`,
                    "success"
                );

            }, 1200);

        });

    });

}


function initializeAdminRefresh() {

    const refreshButton = document.getElementById("refreshAdmin");

    if (!refreshButton) return;

    refreshButton.addEventListener("click", () => {

        showLoader();

        setTimeout(() => {

            hideLoader();

            animateKPICounters();

            initializeAdminCharts();

            updateLastRefresh();

            showToast(
                "Admin dashboard refreshed.",
                "success"
            );

        }, 1000);

    });

}

function updateLastRefresh() {

    const element = document.getElementById("lastRefresh");

    if (!element) return;

    element.textContent = new Date().toLocaleTimeString(
        "en-US",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


function initializeReportDownloads() {

    document.querySelectorAll(".download-report").forEach(button => {

        button.addEventListener("click", () => {

            showToast(
                "Report download started.",
                "success"
            );

        });

    });

}


function highlightAdminMenu() {

    const currentPage =
        window.location.pathname.split("/").pop();

    document.querySelectorAll(".sidebar-menu a")
        .forEach(link => {

            const href = link.getAttribute("href");

            if (href === currentPage) {

                link.classList.add("active");

            }

        });

}


function startAdminClock() {

    updateLastRefresh();

    setInterval(updateLastRefresh, 60000);

}


document.addEventListener("DOMContentLoaded", () => {

    animateKPICounters();

    initializeAdminCharts();

    initializeExportButtons();

    initializeAdminRefresh();

    initializeReportDownloads();

    highlightAdminMenu();

    startAdminClock();

    console.log("Aureon Admin Dashboard Ready.");

});

