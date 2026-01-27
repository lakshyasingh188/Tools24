const uploadBox = document.getElementById("uploadBox");
const pdfInput = document.getElementById("pdfInput");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const output = document.getElementById("output");
const progress = document.getElementById("progress");

let zipBlob = null;

/* File picker */
uploadBox.addEventListener("click", () => pdfInput.click());

pdfInput.addEventListener("change", () => {
  if (pdfInput.files.length > 0) {
    uploadBox.classList.add("active");
  }
});

/* PDF.js worker */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const SCALE = 1.3;

function nextFrame() {
  return new Promise(r => requestAnimationFrame(r));
}

/* Convert */
convertBtn.addEventListener("click", async () => {
  const files = pdfInput.files;

  if (!files.length) {
    alert("Please select PDF files");
    return;
  }

  output.innerHTML = "";
  progress.innerText = "Converting...";
  downloadBtn.style.display = "none";
  zipBlob = null;

  const zip = new JSZip();

  try {
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        progress.innerText = `Converting ${file.name} (Page ${i}/${pdf.numPages})`;

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: SCALE });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgData = canvas.toDataURL("image/png");

        // preview
        const img = document.createElement("img");
        img.src = imgData;
        output.appendChild(img);

        // zip
        zip.file(
          `${file.name.replace(".pdf", "")}-page-${i}.png`,
          imgData.split(",")[1],
          { base64: true }
        );

        await nextFrame();
      }
    }

    progress.innerText = "Preparing download…";
    zipBlob = await zip.generateAsync({ type: "blob" });

    progress.innerText = "✅ Conversion completed";
    downloadBtn.style.display = "block";

  } catch (e) {
    console.error(e);
    progress.innerText = "❌ Conversion failed";
    alert("Conversion failed. Try smaller PDF.");
  }
});

/* USER-CLICK DOWNLOAD (IMPORTANT) */
downloadBtn.addEventListener("click", () => {
  if (!zipBlob) return;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = "tools24-pdf-to-png.zip";
  document.body.appendChild(link);
  link.click();
  link.remove();
});
