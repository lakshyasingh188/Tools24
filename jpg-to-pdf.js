const imageInput = document.getElementById("imageInput");
const statusText = document.getElementById("statusText");
const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const previewGrid = document.getElementById("previewGrid");
const convertBtn = document.getElementById("convertBtn");
const downloadLink = document.getElementById("downloadLink");
const cards = document.querySelectorAll(".orientation-card");
const successTick = document.getElementById("successTick");
let selectedFiles = [];
let orientation = "portrait";

/* FILE SELECT */
imageInput.addEventListener("change", () => {
  selectedFiles = [...imageInput.files];
  if (!selectedFiles.length) return;

  statusText.textContent = `${selectedFiles.length} image select ho gayi`;

  buildPreview();

  setTimeout(() => {
    page1.classList.remove("active");
    page2.classList.add("active");
  }, 500);
});

/* BUILD PREVIEW GRID */
function buildPreview() {
  previewGrid.innerHTML = "";

  selectedFiles.forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    const box = document.createElement("div");
    box.className = `preview-box ${orientation}`;
    box.appendChild(img);

    const item = document.createElement("div");
    item.className = "preview-item";
    item.appendChild(box);

    previewGrid.appendChild(item);
  });
}

/* ORIENTATION CHANGE */
cards.forEach(card => {
  card.addEventListener("click", () => {
    cards.forEach(c => c.classList.remove("active"));
    card.classList.add("active");

    orientation = card.dataset.value;
    buildPreview(); // 🔥 re-render preview
  });
});

/* CONVERT TO PDF */
convertBtn.addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4"
  });

  for (let i = 0; i < selectedFiles.length; i++) {
    const img = await loadImage(selectedFiles[i]);
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    let iw = pw;
    let ih = (img.height * iw) / img.width;

    if (ih > ph) {
      ih = ph;
      iw = (img.width * ih) / img.height;
    }

    const x = (pw - iw) / 2;
    const y = (ph - ih) / 2;

    if (i !== 0) pdf.addPage();
    pdf.addImage(img, "JPEG", x, y, iw, ih);
  }

  const blob = pdf.output("blob");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.style.display = "block";
});

/* IMAGE LOADER */
function loadImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
downloadBtn.addEventListener("click", () => {

  // 👉 yaha tumhara actual download logic hoga
  // downloadLink.click();

  // ✅ SYSTEM MEMORY ME SAVE
  localStorage.setItem("jpgPdfDownloaded", "true");

  // ✅ UI UPDATE
  successTick.style.display = "block";
  downloadBtn.style.display = "none";
  statusText.textContent = "Download completed successfully";

});
function toggleText() {
    const moreText = document.getElementById("moreText");
    const btn = document.getElementById("toggleBtn");

    if (moreText.style.display === "none") {
        moreText.style.display = "block";
        btn.innerText = "Show Less";
    } else {
        moreText.style.display = "none";
        btn.innerText = "Show More";
    }
}
