// converter.js (Advanced Tools24 converter)
// Requires: jsPDF, pdf.js (pdfjsLib), PDFLib (PDFLib), mammoth, XLSX, PapaParse, UTIF
// Optional: Tesseract (for OCR) and FFmpeg (for audio/video)

// Setup
const fileInput = document.getElementById('fileInput');
const formatSelect = document.getElementById('formatSelect');
const convertBtn = document.getElementById('convertBtn');
const extraOptionsRow = document.getElementById('extraOptions');
const extraInput = document.getElementById('extraInput');
const statusDiv = document.getElementById('status');
const enableOcrBtn = document.getElementById('enableOcrBtn');
const mergePdfBtn = document.getElementById('mergePdfBtn');

let OCR_ENABLED = false;
let TESSERACT = null; // will be set if OCR loaded

// Show extra options for some choices
formatSelect.addEventListener('change', () => {
  const v = formatSelect.value;
  if (v.startsWith('PDF_') || v === 'PDF_PAGES_TO_IMAGES' || v === 'PDF_SPLIT' || v === 'PDF_MERGE' || v === 'EXTRACT_PDF_TEXT') {
    extraOptionsRow.style.display = 'block';
  } else {
    extraOptionsRow.style.display = 'none';
  }

  // show merge button when user wants to merge multiple PDFs
  mergePdfBtn.style.display = v === 'PDF_MERGE' ? 'inline-block' : 'none';
});

// Enable OCR (load tesseract)
enableOcrBtn.addEventListener('click', async () => {
  if (OCR_ENABLED) {
    setStatus('OCR already enabled.');
    return;
  }
  setStatus('Loading Tesseract (OCR) — this is large (~4-8MB). Wait...');
  try {
    // user must include <script src="https://cdn.jsdelivr.net/npm/tesseract.js@4.0.2/dist/tesseract.min.js"></script> in HTML
    if (!window.Tesseract) {
      setStatus('Tesseract not found. Please enable the Tesseract script tag in index.html and reload.');
      return;
    }
    TESSERACT = window.Tesseract;
    OCR_ENABLED = true;
    setStatus('OCR enabled. Now you can convert Image → TXT (Image→Text).');
  } catch (e) {
    console.error(e);
    setStatus('Failed to enable OCR: ' + e.message);
  }
});

mergePdfBtn.addEventListener('click', async () => {
  // Allow user to select multiple files for merge
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.multiple = true;
  inp.accept = 'application/pdf';
  inp.onchange = async () => {
    const files = Array.from(inp.files);
    if (!files.length) { setStatus('No files selected'); return; }
    await mergePdfFiles(files);
  };
  inp.click();
});

convertBtn.addEventListener('click', handleConvert);

// Helpers
function setStatus(txt) {
  statusDiv.textContent = txt || '';
}

function replaceExt(filename, ext) {
  const b = filename.replace(/\.[^/.]+$/, "");
  return b + '.' + ext;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
}

// High-level dispatcher
async function handleConvert() {
  setStatus('');
  const file = fileInput.files[0];
  if (!file) { setStatus('Please choose a file first.'); return; }
  const target = formatSelect.value;
  const name = file.name;

  const type = (file.type || '').toLowerCase();

  // Image types
  if (type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(name)) {
    return handleImage(file, target, name);
  }

  // PDF
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
    return handlePdf(file, target, name);
  }

  // Text
  if (type.startsWith('text/') || /\.txt$/i.test(name) || /\.md$/i.test(name) || /\.csv$/i.test(name)) {
    return handleTextOrData(file, target, name);
  }

  // Office formats
  if (/\.docx$/i.test(name)) return handleDocx(file, target, name);
  if (/\.xlsx$/i.test(name) || /\.xls$/i.test(name)) return handleExcel(file, target, name);

  setStatus('Unsupported file type: ' + file.type + ' — try uploading PDF, image, txt, docx, xlsx, csv, md.');
}

/* -------------------------
   IMAGE HANDLING (JPG/PNG/WEBP/BMP/GIF/TIFF)
   ------------------------- */
function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function handleImage(file, target, name) {
  try {
    setStatus('Loading image...');
    const dataUrl = await readFileAsDataURL(file);

    // special case: TIFF via UTIF
    if (/\.tif|\.tiff$/i.test(name)) {
      // decode tiff and get first image
      const buf = await file.arrayBuffer();
      const ifds = UTIF.decode(buf);
      UTIF.decodeImage(buf, ifds[0]);
      const rgba = UTIF.toRGBA8(ifds[0]); // Uint8Array
      // create canvas
      const w = ifds[0].width, h = ifds[0].height;
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const imageData = new ImageData(new Uint8ClampedArray(rgba), w, h);
      ctx.putImageData(imageData, 0, 0);
      await exportCanvasBasedOnTarget(canvas, target, name);
      return;
    }

    // Regular image
    const img = new Image();
    img.src = dataUrl;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

    // If target is PDF -> put image into PDF
    if (target === 'PDF') {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      // draw image to canvas then add to pdf scaled
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL('image/png');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      // scale to fit
      const ratio = Math.min(pageW / img.width, pageH / img.height);
      const w = img.width * ratio, h = img.height * ratio;
      pdf.addImage(imgData, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(replaceExt(name, 'pdf'));
      setStatus('Image → PDF downloaded.');
      return;
    }

    // If target is TXT: attempt OCR if enabled
    if (target === 'TXT') {
      if (!OCR_ENABLED) { setStatus('OCR not enabled. Click "Enable OCR" to add Tesseract.'); return; }
      setStatus('Running OCR... (may take time)');
      // run OCR on dataUrl
      const worker = TESSERACT.createWorker();
      await worker.load();
      await worker.loadLanguage('eng'); // for Hindi you'd need traineddata for 'hin' and that increases size; english default
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(dataUrl);
      await worker.terminate();
      downloadBlob(new Blob([text], { type: 'text/plain' }), replaceExt(name, 'txt'));
      setStatus('OCR complete and TXT downloaded.');
      return;
    }

    // For image→image conversions
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    await exportCanvasBasedOnTarget(canvas, target, name);

  } catch (e) {
    console.error(e);
    setStatus('Image handling error: ' + (e.message || e));
  }
}

function exportCanvasBasedOnTarget(canvas, target, origName) {
  return new Promise((resolve) => {
    const quality = 0.92;
    const ext = (target || 'png').toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') {
      canvas.toBlob((blob) => { downloadBlob(blob, replaceExt(origName, 'jpg')); setStatus('Image converted to JPG'); resolve(); }, 'image/jpeg', quality);
    } else if (ext === 'png') {
      canvas.toBlob((blob) => { downloadBlob(blob, replaceExt(origName, 'png')); setStatus('Image converted to PNG'); resolve(); }, 'image/png');
    } else if (ext === 'webp') {
      // webp supported in most modern browsers
      canvas.toBlob((blob) => { downloadBlob(blob, replaceExt(origName, 'webp')); setStatus('Image converted to WEBP'); resolve(); }, 'image/webp', quality);
    } else if (ext === 'bmp') {
      // Canvas doesn't provide BMP directly — but we can convert PNG -> BMP using a tiny encoder (not included). Instead we save PNG with .bmp extension (some apps will accept), or create raw BMP manually.
      // Simple method: export PNG but change extension to .bmp (best-effort). For true BMP encoding, include a small encoder library.
      canvas.toBlob((blob) => { downloadBlob(blob, replaceExt(origName, 'bmp')); setStatus('Image exported (PNG data, saved as .bmp). For true BMP encoding include BMP encoder.'); resolve(); }, 'image/png');
    } else {
      // default PNG
      canvas.toBlob((blob) => { downloadBlob(blob, replaceExt(origName, ext || 'png')); setStatus('Image exported.'); resolve(); }, 'image/png');
    }
  });
}

/* -------------------------
   TEXT / CSV / MD / TXT / CSV handling
   ------------------------- */
async function handleTextOrData(file, target, name) {
  const txt = await file.text();
  const lower = target.toUpperCase();

  if (lower === 'TXT') {
    // If user uploaded .md or .csv, return raw text
    downloadBlob(new Blob([txt], { type: 'text/plain' }), replaceExt(name, 'txt'));
    setStatus('TXT downloaded.');
    return;
  }

  if (lower === 'PDF') {
    // convert text to PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 12;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const lines = pdf.splitTextToSize(txt, pageWidth);
    pdf.text(lines, margin, margin + 8);
    pdf.save(replaceExt(name, 'pdf'));
    setStatus('Text → PDF saved.');
    return;
  }

  if (lower === 'PNG' || lower === 'JPG' || lower === 'WEBP') {
    // render text to canvas and export as image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 16;
    const padding = 20;
    ctx.font = `${fontSize}px Arial`;
    // wrap by width 900 px
    const width = 1000;
    const words = txt.split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? (line + ' ' + w) : w;
      if (ctx.measureText(test).width > width - padding * 2) {
        lines.push(line); line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    const height = Math.max(600, lines.length * (fontSize * 1.4) + padding * 2);
    canvas.width = width; canvas.height = height;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000'; ctx.font = `${fontSize}px Arial`;
    let y = padding + fontSize;
    for (const l of lines) { ctx.fillText(l, padding, y); y += fontSize * 1.4; }
    const mime = lower === 'JPG' ? 'image/jpeg' : (lower === 'WEBP' ? 'image/webp' : 'image/png');
    canvas.toBlob((blob) => { downloadBlob(blob, replaceExt(name, lower.toLowerCase())); setStatus('Text → Image saved.'); }, mime, 0.95);
    return;
  }

  if (lower === 'CSV') {
    // If user uploaded CSV, just return CSV. If they uploaded markdown or txt, attempt to parse via PapaParse
    const parsed = Papa.parse(txt, { header: true });
    const json = JSON.stringify(parsed.data, null, 2);
    downloadBlob(new Blob([json], { type: 'application/json' }), replaceExt(name, 'json'));
    setStatus('CSV parsed and JSON downloaded.');
    return;
  }

  if (lower === 'MD') {
    // If user uploaded .md, just save as .md or convert to PDF
    // Simple conversion: render to jsPDF as text
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(txt, 180);
    pdf.text(lines, 10, 10);
    pdf.save(replaceExt(name, 'pdf'));
    setStatus('Markdown → PDF saved (simple conversion).');
    return;
  }

  setStatus('Unhandled data conversion: ' + target);
}

/* -------------------------
   DOCX handling (mammoth.js)
   ------------------------- */
async function handleDocx(file, target, name) {
  setStatus('Reading DOCX...');
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    if (target === 'TXT') {
      downloadBlob(new Blob([text], { type: 'text/plain' }), replaceExt(name, 'txt'));
      setStatus('DOCX → TXT saved.');
      return;
    }
    if (target === 'PDF') {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(text, 180);
      pdf.text(lines, 10, 10);
      pdf.save(replaceExt(name, 'pdf'));
      setStatus('DOCX → PDF saved (text-only).');
      return;
    }
    if (target === 'DOCX') {
      downloadBlob(new Blob([arrayBuffer]), name);
      setStatus('DOCX downloaded.');
      return;
    }
    // fallback: save extracted text
    downloadBlob(new Blob([text], { type: 'text/plain' }), replaceExt(name, 'txt'));
    setStatus('DOCX processed and TXT saved.');
  } catch (e) {
    console.error(e);
    setStatus('DOCX processing failed: ' + e.message);
  }
}

/* -------------------------
   EXCEL handling (SheetJS)
   ------------------------- */
async function handleExcel(file, target, name) {
  setStatus('Reading Excel...');
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
  // Convert to CSV for simplicity (first sheet)
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) { setStatus('No sheets found'); return; }
  if (target === 'CSV' || target === 'TXT') {
    const csv = XLSX.utils.sheet_to_csv(firstSheet);
    downloadBlob(new Blob([csv], { type: 'text/csv' }), replaceExt(name, 'csv'));
    setStatus('Excel → CSV saved.');
    return;
  }
  if (target === 'JSON') {
    const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    downloadBlob(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }), replaceExt(name, 'json'));
    setStatus('Excel → JSON saved.');
    return;
  }
  if (target === 'PDF') {
    const csv = XLSX.utils.sheet_to_csv(firstSheet);
    // render csv text to pdf
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(csv, 180);
    pdf.text(lines, 10, 10);
    pdf.save(replaceExt(name, 'pdf'));
    setStatus('Excel (first sheet) → PDF saved.');
    return;
  }
  setStatus('Excel processed. (Try CSV, JSON or PDF target).');
}

/* -------------------------
   PDF handling: render page(s), extract text, split, merge
   ------------------------- */
async function handlePdf(file, target, name) {
  setStatus('Loading PDF...');
  const arrayBuffer = await file.arrayBuffer();
  const extra = extraInput.value || '';

  if (target === 'EXTRACT_PDF_TEXT' || target === 'EXTRACT_PDF_TEXT'.toUpperCase()) {
    // Extract text (all pages)
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const txt = await page.getTextContent();
      const pageText = txt.items.map(i => i.str).join(' ');
      fullText += `\n\n--- Page ${p} ---\n\n` + pageText;
    }
    downloadBlob(new Blob([fullText], { type: 'text/plain' }), replaceExt(name, 'txt'));
    setStatus('Extracted text from PDF (all pages).');
    return;
  }

  if (target === 'PDF_PAGES_TO_IMAGES') {
    // parse pages option: pages=1-3 or pages=all
    const pagesArg = parseOption(extra, 'pages') || 'all';
    const scale = parseFloat(parseOption(extra, 'scale') || '2') || 2;
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pagesToProcess = [];
    if (pagesArg === 'all') {
      for (let i = 1; i <= pdf.numPages; i++) pagesToProcess.push(i);
    } else {
      // parse ranges like 1-3,5
      pagesToProcess.push(...expandPageRanges(pagesArg));
    }
    // convert each page to image and download (or zip)
    for (const p of pagesToProcess) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      // download as png
      await new Promise((res) => {
        canvas.toBlob((blob) => { downloadBlob(blob, replaceExt(name, `page-${p}.png`)); setStatus(`Downloaded page ${p} as PNG`); res(); }, 'image/png');
      });
    }
    setStatus('PDF pages exported as images.');
    return;
  }

  if (target === 'PDF_MERGE') {
    setStatus('Use Merge button to select PDFs and merge them.');
    return;
  }

  if (target === 'PDF_SPLIT') {
    // split into pages: create separate PDF for each page
    const pagesArg = parseOption(extra, 'pages') || 'all';
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const pagesToProcess = pagesArg === 'all' ? Array.from({length: pdfLibDoc.getPageCount()}, (_,i)=>i+1) : expandPageRanges(pagesArg);
    let counter = 0;
    for (const p of pagesToProcess) {
      const newDoc = await PDFLib.PDFDocument.create();
      const [copied] = await newDoc.copyPages(pdfLibDoc, [p-1]);
      newDoc.addPage(copied);
      const buf = await newDoc.save();
      downloadBlob(new Blob([buf], { type: 'application/pdf' }), replaceExt(name, `page-${p}.pdf`));
      counter++;
    }
    setStatus(`PDF split: ${counter} files created.`);
    return;
  }

  // Default: if target is image/pdf/txt etc handled earlier
  setStatus('PDF action complete.');
}

// Utility parse for extra option like "pages=1-3,scale=2"
function parseOption(extra, key) {
  if (!extra) return null;
  const parts = extra.split(',').map(s => s.trim());
  for (const p of parts) {
    if (p.includes('=')) {
      const [k, v] = p.split('=').map(s => s.trim());
      if (k === key) return v;
    }
  }
  return null;
}

// expand "1-3,5" => [1,2,3,5]
function expandPageRanges(str) {
  const out = [];
  const parts = str.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [a,b] = part.split('-').map(Number);
      for (let i=a;i<=b;i++) out.push(i);
    } else {
      const n = Number(part);
      if (!isNaN(n)) out.push(n);
    }
  }
  return out;
}

/* -------------------------
   PDF Merge (PDF-lib)
   ------------------------- */
async function mergePdfFiles(files) {
  setStatus('Merging PDFs...');
  try {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const file of files) {
      const ab = await file.arrayBuffer();
      const donor = await PDFLib.PDFDocument.load(ab);
      const copied = await mergedPdf.copyPages(donor, donor.getPageIndices());
      copied.forEach(p => mergedPdf.addPage(p));
    }
    const mergedBuf = await mergedPdf.save();
    downloadBlob(new Blob([mergedBuf], { type: 'application/pdf' }), 'merged.pdf');
    setStatus('Merged PDF downloaded.');
  } catch (e) {
    console.error(e);
    setStatus('Merge failed: ' + e.message);
  }
}

/* -------------------------
   Small utilities for compression (optional)
   - compressPdf: simple approach: render pages to images at lower quality then rebuild PDF.
   ------------------------- */
async function compressPdf(arrayBuffer, quality = 0.7, scale = 1.2) {
  // This is a best-effort client-side compress: render each page to image and rebuild PDF
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const { jsPDF } = window.jspdf;
  const outPdf = new jsPDF();

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (p > 1) outPdf.addPage();
    outPdf.addImage(dataUrl, 'JPEG', 0, 0, outPdf.internal.pageSize.getWidth(), outPdf.internal.pageSize.getHeight());
  }
  return outPdf.save(); // returns ArrayBuffer
}
