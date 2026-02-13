import { supabase } from "./supabase.js";

const pagePath = window.location.pathname;
const stars = document.querySelectorAll(".star-input span");
const container = document.getElementById("ratingContainer");

/* ===== STAR CLICK ===== */
stars.forEach(star => {
  star.addEventListener("click", async () => {

    const ratingValue = parseInt(star.dataset.value);

    // Check login
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // 🚀 Google login open automatically
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.href
        }
      });
      return;
    }

    // Highlight stars
    highlightStars(ratingValue);

    // Save rating
    const { error } = await supabase.from("ratings").upsert({
      user_id: user.id,
      page: pagePath,
      rating: ratingValue
    });

    if (error) {
      console.error(error);
      alert("Error saving rating");
      return;
    }

    loadRatings();
  });
});

/* ===== Highlight Stars ===== */
function highlightStars(value) {
  stars.forEach(star => {
    star.classList.toggle("active", star.dataset.value <= value);
  });
}

/* ===== Load Ratings ===== */
async function loadRatings() {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("page", pagePath)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  container.innerHTML = "";

  data.forEach(item => {

    const starsDisplay =
      "★".repeat(item.rating) +
      "☆".repeat(5 - item.rating);

    container.innerHTML += `
      <div class="rating-card">
        <div class="stars">${starsDisplay}</div>
        <p class="review-text">User rated this page.</p>
        <div class="user-name">
          User: ${item.user_id.substring(0,6)}
        </div>
      </div>
    `;
  });
}

/* ===== Auto Load ===== */
loadRatings();
