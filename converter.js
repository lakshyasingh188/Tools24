// converter.js
// Assumes jspdf and pdf.js are loaded (see index.html)

const fileInput = document.getElementById('fileInput');
const formatSelect = document.getElementById('formatSelect');
const convertBtn = document.getElementById('convertBtn');
const statusDiv = document.getElementById('status');

convertBtn.addEventListener('click', handleConvert);

function setStatus(txt){
  statusDiv.textContent = txt || '';
}

function handleConvert(){
  setStatus('');
  const file = fileInput.files[0];
  if (!file) { setStatus('Please upload a file first.'); return; }

  const target = formatSelect.value;
  const type = file.type || '';
  const name = file.name || 'file';

  if (type.startsWith('image/')) {
    handleImageFile(file, target, name);
  } else if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    handlePdfFile(file, target, name);
  } else if (type.startsWith('text/') || name.toLowerCase().endsWith('.txt')) {
    handleTextFile(file, target, name);
  } else {
    setStatus('Unsupported file type: ' + type);
  }
}

/* ---------------------------
   IMAGE: image -> PDF/JPG/PNG/TXT (TXT: not OCR)
   --------------------------- */
function handleImageFile(file, target, name){
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      if (target === 'PDF') {
        imageToPDF(img, name);
      } else if (target === 'JPG' || target === 'PNG') {
        imageToImage(img, target, name);
      } else if (target === 'TXT') {
        // no OCR implemented
        setStatus('Image→Text requires OCR (not included). Ask to add Tesseract.js for OCR.');
      } else {
        setStatus('Unknown target for image.');
      }
    };
    img.onerror = () => setStatus('Could not load image (CORS or corrupt file).');
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function imageToPDF(img, name){
  try{
    const { jsPDF } = window.jspdf;
    // Create PDF in portrait; scale image to fit A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // compute size preserving aspect ratio
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    const imgData = canvas.toDataURL('image/png');

    // fit into page
    const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;

    pdf.addImage(imgData, 'PNG', (pageWidth - w)/2, (pageHeight - h)/2, w, h);
    pdf.save(replaceExt(name, 'pdf'));
    setStatus('Image converted to PDF.');
  } catch (e){
    console.error(e);
    setStatus('Error creating PDF: ' + e.message);
  }
}

function imageToImage(img, target, name){
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img,0,0);
  // mime type
  const mime = target === 'JPG' ? 'image/jpeg' : 'image/png';
  const ext = target.toLowerCase();
  canvas.toBlob((blob) => {
    downloadBlob(blob, replaceExt(name, ext));
    setStatus(`Image converted to ${target}.`);
  }, mime, 0.92);
}

/* ---------------------------
   TEXT: txt -> PDF / PNG / JPG / TXT
   --------------------------- */
function handleTextFile(file, target, name){
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    if (target === 'TXT') {
      downloadBlob(new Blob([text], {type:'text/plain'}), replaceExt(name, 'txt'));
      setStatus('TXT downloaded.');
    } else if (target === 'PDF') {
      textToPDF(text, name);
    } else if (target === 'PNG' || target === 'JPG') {
      textToImage(text, target, name);
    } else {
      setStatus('Unknown target for text.');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function textToPDF(text, name){
  try{
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','mm','a4');
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin*2;
    const lineHeight = 7;
    const lines = pdf.splitTextToSize(text, pageWidth);
    pdf.text(lines, margin, margin + 5);
    pdf.save(replaceExt(name, 'pdf'));
    setStatus('TXT converted to PDF.');
  } catch (e) {
    setStatus('Error creating PDF: ' + e.message);
  }
}

function textToImage(text, target, name){
  // render text onto canvas (wrap)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 16;
  const lineHeight = fontSize * 1.3;
  const padding = 20;
  const lines = wrapTextArray(ctx, text, 800, fontSize, '16px Arial');

  const width = 1000;
  const height = Math.max(600, Math.ceil(lines.length * lineHeight) + padding*2);
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,width,height);
  ctx.fillStyle = '#000';
  ctx.font = `${fontSize}px Arial`;
  let y = padding + fontSize;
  for (const line of lines){
    ctx.fillText(line, padding, y);
    y += lineHeight;
  }
  const mime = target === 'JPG' ? 'image/jpeg' : 'image/png';
  const ext = target.toLowerCase();
  canvas.toBlob((blob) => {
    downloadBlob(blob, replaceExt(name, ext));
    setStatus(`TXT converted to ${target}.`);
  }, mime, 0.95);
}

function wrapTextArray(ctx, text, maxWidth, fontSize, font){
  ctx.font = font;
  const paragraphs = text.split('\n');
  const out = [];
  for (const p of paragraphs){
    let words = p.split(' ');
    let line = '';
    for (const w of words){
      const test = line ? (line + ' ' + w) : w;
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth - 40) {
        if (line) { out.push(line); line = w; }
        else { out.push(test); line = ''; } // single long word
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/* ---------------------------
   PDF: pdf -> PNG/JPG/TXT
   Uses pdf.js to render first page to canvas and extract text
   --------------------------- */
function handlePdfFile(file, target, name){
  const reader = new FileReader();
  reader.onload = (e) => {
    const arrayBuffer = e.target.result;
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    loadingTask.promise.then(async (pdf) => {
      setStatus('PDF loaded. Pages: ' + pdf.numPages);
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({scale: 2}); // scale for better quality
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      await page.render(renderContext).promise;

      if (target === 'PNG' || target === 'JPG') {
        const mime = target === 'JPG' ? 'image/jpeg' : 'image/png';
        const ext = target.toLowerCase();
        canvas.toBlob((blob) => {
          downloadBlob(blob, replaceExt(name, ext));
          setStatus('PDF first page converted to ' + target);
        }, mime, 0.95);
      } else if (target === 'TXT') {
        // extract text content (best-effort)
        page.getTextContent().then((textContent) => {
          const strings = textContent.items.map(i => i.str);
          const text = strings.join(' ');
          downloadBlob(new Blob([text], {type:'text/plain'}), replaceExt(name, 'txt'));
          setStatus('Extracted text from PDF (first page text).');
        }).catch((err) => {
          console.error(err);
          setStatus('Could not extract text from PDF: ' + err.message);
        });
      } else if (target === 'PDF') {
        setStatus('File is already PDF.');
      } else {
        setStatus('Unknown target for PDF.');
      }
    }).catch((err) => {
      console.error(err);
      setStatus('Error reading PDF: ' + err.message);
    });
  };
  reader.readAsArrayBuffer(file);
}

/* -------------- helpers -------------- */

function replaceExt(filename, newExt){
  const base = filename.replace(/\.[^/.]+$/, "");
  return base + '.' + newExt;
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 500);
}
