/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     HEADER MENU TOGGLE (Mobile)
  ========================= */
  const menuBtn = document.getElementById("mobileMenuBtn");
  const nav = document.getElementById("appleNav");

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      nav.classList.toggle("active");
      console.log("hamburger clicked");
    });
  } else {
    console.warn("Mobile menu button ya nav nahi mila");
  }

  /* =========================
     DARK / LIGHT MODE
  ========================= */
  const themeToggleBtn = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("theme");

  // 🔹 SEO + mobile browser theme color
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  // Apply saved theme on load
  if (savedTheme === "dark") {
    document.body.classList.add("dark");

    if (themeToggleBtn) {
      themeToggleBtn.innerText = "☀️";
    }

    if (metaTheme) {
      metaTheme.setAttribute("content", "#0b1220");
    }
  } else {
    if (metaTheme) {
      metaTheme.setAttribute("content", "#ffffff");
    }
  }

  // Toggle theme on click
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function () {
      document.body.classList.toggle("dark");

      if (document.body.classList.contains("light")) {
        localStorage.setItem("theme", "dark");
        themeToggleBtn.innerText = "🌙";

        if (metaTheme) {
          metaTheme.setAttribute("content", "#0b1220");
        }

      } else {
        localStorage.setItem("theme", "light");
        themeToggleBtn.innerText = "☀️";

        if (metaTheme) {
          metaTheme.setAttribute("content", "#ffffff");
        }
      }
    });
  }

});
