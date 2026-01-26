const pdfInput = document.getElementById("pdfFile");
const pagesDiv = document.getElementById("pages");
const startInput = document.getElementById("startPage");
const endInput = document.getElementById("endPage");
const splitBtn = document.getElementById("splitBtn");
const status = document.getElementById("status");

let pdfBytes = null;
let totalPages = 0;

/* LOAD & RENDER PDF */
pdfInput.addEventListener("change", async () => {
  pagesDiv.innerHTML = "";
  status.innerText = "";

  const file = pdfInput.files[0];
  pdfBytes = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  totalPages = pdf.numPages;

  startInput.value = 1;
  endInput.value = totalPages;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.6 });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const div = document.createElement("div");
    div.className = "page";
    div.dataset.page = i;

    div.appendChild(canvas);
    div.innerHTML += `<p>Page ${i}</p>`;
    pagesDiv.appendChild(div);
  }

  highlightRange();
});

/* RANGE HIGHLIGHT */
[startInput, endInput].forEach(input => {
  input.addEventListener("input", highlightRange);
});

function highlightRange() {
  const start = parseInt(startInput.value);
  const end = parseInt(endInput.value);

  document.querySelectorAll(".page").forEach(p => {
    const num = parseInt(p.dataset.page);
    p.classList.toggle("selected", num >= start && num <= end);
  });
}

/* SPLIT */
splitBtn.addEventListener("click", async () => {
  if (!pdfBytes) {
    status.innerText = "❌ Upload PDF first";
    return;
  }

  const start = parseInt(startInput.value);
  const end = parseInt(endInput.value);

  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
  const newPdf = await PDFLib.PDFDocument.create();

  for (let i = start - 1; i < end; i++) {
    const [p] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(p);
  }

  const bytes = await newPdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "split.pdf";
  a.click();

  status.innerText = "✅ PDF split successful";
});
