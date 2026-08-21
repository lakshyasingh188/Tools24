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
        themeToggleBtn.innerText = "☀️";

        if (metaTheme) {
          metaTheme.setAttribute("content", "#0b1220");
        }

      } else {
        localStorage.setItem("theme", "light");
        themeToggleBtn.innerText = "🌙";

        if (metaTheme) {
          metaTheme.setAttribute("content", "#ffffff");
        }
      }
    });
  }

});
/* ===== Tools24 FAQ Accordion ===== */
(function () {
  "use strict";

  function initTools24FAQ() {
    var list = document.getElementById("tools24-faq-list");
    if (!list) return;

    var questions = list.querySelectorAll(".tools24-faq__question");

    questions.forEach(function (btn) {
      var item = btn.closest(".tools24-faq__item");
      var answerId = btn.getAttribute("aria-controls");
      var answer = answerId ? document.getElementById(answerId) : null;

      if (!item || !answer) return;

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";

        // Close all other items first (accordion behavior)
        questions.forEach(function (otherBtn) {
          if (otherBtn !== btn) {
            var otherItem = otherBtn.closest(".tools24-faq__item");
            var otherAnswerId = otherBtn.getAttribute("aria-controls");
            var otherAnswer = otherAnswerId ? document.getElementById(otherAnswerId) : null;
            
            otherBtn.setAttribute("aria-expanded", "false");
            if (otherItem) otherItem.classList.remove("is-open");
            if (otherAnswer) otherAnswer.setAttribute("hidden", "");
          }
        });

        // Toggle the clicked item
        if (isOpen) {
          btn.setAttribute("aria-expanded", "false");
          item.classList.remove("is-open");
          answer.setAttribute("hidden", "");
        } else {
          btn.setAttribute("aria-expanded", "true");
          item.classList.add("is-open");
          answer.removeAttribute("hidden");
        }
      });

      // Keyboard accessibility (Arrow keys, Home, End)
      btn.addEventListener("keydown", function (e) {
        var current = Array.prototype.indexOf.call(questions, btn);
        var target = null;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          target = questions[(current + 1) % questions.length];
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          target = questions[(current - 1 + questions.length) % questions.length];
        } else if (e.key === "Home") {
          e.preventDefault();
          target = questions[0];
        } else if (e.key === "End") {
          e.preventDefault();
          target = questions[questions.length - 1];
        }

        if (target) target.focus();
      });
    });
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTools24FAQ);
  } else {
    initTools24FAQ();
  }
})();
