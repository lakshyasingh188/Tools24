const { PDFDocument } = PDFLib;
const slotsList = document.getElementById('slots-list');
const processBtn = document.getElementById('process-btn');
const overlay = document.getElementById('loading-overlay');
const statusText = document.getElementById('status-feedback');

// Array to hold 10 slots of file data
let fileStorage = new Array(10).fill(null);

// 1. Generate 10 file slots line-by-line
function createSlots() {
  for (let i = 0; i < 10; i++) {
    const row = document.createElement('div');
    row.className = 'slot-row';
    row.id = `slot-${i}`;
    row.innerHTML = `
            <span class="slot-index">${i + 1}</span>
            <div class="slot-label" id="label-${i}">Select PDF, JPG, or PNG</div>
            <span class="slot-status">SELECTED</span>
            <input type="file" id="file-${i}" accept=".pdf,.jpg,.jpeg,.png" hidden>
        `;

    // When row clicked, trigger the hidden file input
    row.onclick = () => document.getElementById(`file-${i}`).click();

    // Handle file selection
    const input = row.querySelector('input');
    input.onchange = (e) => handleFile(i, e.target.files[0]);

    slotsList.appendChild(row);
  }
}

// 2. Process file selection
function handleFile(index, file) {
  if (!file) return;

  fileStorage[index] = file;

  // UI Update for the row
  const row = document.getElementById(`slot-${index}`);
  const label = document.getElementById(`label-${index}`);

  row.classList.add('has-file');
  label.innerText = file.name;

  // Enable Merge button if at least one file exists
  processBtn.disabled = !fileStorage.some(f => f !== null);
}

// 3. Merging Core Logic
processBtn.onclick = async () => {
  const activeFiles = fileStorage.filter(f => f !== null);
  if (activeFiles.length === 0) return;

  // Start Loading Overlay
  overlay.style.display = 'flex';
  processBtn.disabled = true;

  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of activeFiles) {
      const arrayBuffer = await file.arrayBuffer();

      // Check if file is PDF
      if (file.type === 'application/pdf') {
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }
      // Check if file is Image (JPG/PNG)
      else if (file.type.includes('image/')) {
        let image;
        if (file.type === 'image/png') {
          image = await mergedPdf.embedPng(arrayBuffer);
        } else {
          image = await mergedPdf.embedJpg(arrayBuffer);
        }

        // Create a page matching image dimensions
        const page = mergedPdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
    }

    // Generate the final PDF
    const pdfBytes = await mergedPdf.save();

    // Auto-download result
    download(pdfBytes, "Tools24-Merged.pdf", "application/pdf");

    statusText.innerText = "Processing Complete! Downloading...";
    statusText.style.color = "#34c759";

  } catch (err) {
    console.error(err);
    statusText.innerText = "Error merging files. Please try again.";
    statusText.style.color = "#ff3b30";
  } finally {
    // Hide Loader
    overlay.style.display = 'none';
    processBtn.disabled = false;
  }
};

// Helper: Download function
function download(data, name, type) {
  const blob = new Blob([data], { type: type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

// Initialize the 10 slots on startup
createSlots();
