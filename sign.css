const pdfCanvas = document.getElementById("pdfPreview");
const pdfCtx = pdfCanvas.getContext("2d");

const signCanvas = document.getElementById("signature");
const signaturePad = new SignaturePad(signCanvas);

signCanvas.width = signCanvas.offsetWidth;
signCanvas.height = signCanvas.offsetHeight;

let pdfBytes;
let pdfImage;
let signX = 50;
let signY = 50;

// Load PDF
document.getElementById("pdfUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  pdfBytes = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1.3 });
  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;

  await page.render({
    canvasContext: pdfCtx,
    viewport
  }).promise;

  pdfImage = new Image();
  pdfImage.src = pdfCanvas.toDataURL();
});

// 🔥 PERFECT CLICK POSITION FIX
pdfCanvas.addEventListener("click", (e) => {
  if (!pdfImage) return;

  const rect = pdfCanvas.getBoundingClientRect();

  // scale ratio
  const scaleX = pdfCanvas.width / rect.width;
  const scaleY = pdfCanvas.height / rect.height;

  const canvasX = (e.clientX - rect.left) * scaleX;
  const canvasY = (e.clientY - rect.top) * scaleY;

  signX = canvasX;
  signY = pdfCanvas.height - canvasY;

  // redraw PDF
  // Load PDF and render with correct aspect ratio
document.getElementById("pdfUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  pdfBytes = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const page = await pdf.getPage(1);

  // container width ke hisaab se scale
  const containerWidth = pdfCanvas.parentElement.clientWidth;

  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = containerWidth / unscaledViewport.width;

  const viewport = page.getViewport({ scale });

  // canvas exact PDF size ke barabar
  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;

  await page.render({
    canvasContext: pdfCtx,
    viewport
  }).promise;

  // cache image
  pdfImage = new Image();
  pdfImage.src = pdfCanvas.toDataURL();
});


  // selector box EXACT click par
  const boxW = 160;
  const boxH = 70;

  pdfCtx.strokeStyle = "#22c55e";
  pdfCtx.lineWidth = 2;
  pdfCtx.strokeRect(
    canvasX - boxW / 2,
    canvasY - boxH / 2,
    boxW,
    boxH
  );
});

function clearSign() {
  signaturePad.clear();
}

// Sign PDF
async function signPdf() {
  if (!pdfBytes) {
    alert("Please upload PDF");
    return;
  }
  if (signaturePad.isEmpty()) {
    alert("Please draw signature");
    return;
  }

  const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];

  const signatureImg = await pdfDoc.embedPng(
    signaturePad.toDataURL()
  );

  page.drawImage(signatureImg, {
    x: signX - 80,
    y: signY - 35,
    width: 160,
    height: 70,
  });

  const signedPdf = await pdfDoc.save();
  downloadPdf(signedPdf);
}

function downloadPdf(bytes) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "signed.pdf";
  link.click();
}
