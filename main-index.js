/* =========================
   HEADER MENU TOGGLE
========================= */
function toggleMenu() {
  document.getElementById("headerMenu").classList.toggle("show");

  const overlay = document.getElementById("processingOverlay");
  if (overlay) {
    overlay.classList.toggle("active");
  }
}

/* =========================
   DARK / LIGHT MODE
========================= */
const themeToggleBtn = document.getElementById("themeToggle");

// Page load par saved theme apply ho
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    if (themeToggleBtn) {
      themeToggleBtn.innerText = "☀️ Light";
    }
  }
});

// Button click par theme change
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
      themeToggleBtn.innerText = "☀️";
    } else {
      localStorage.setItem("theme", "light");
      themeToggleBtn.innerText = "🌙";
    }
  });
}
