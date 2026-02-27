let pdfLibDoc = null;
let sigX = 0, sigY = 0;
let signatureImgBase64 = null;
let pdfScale = 1;

const pdfInput = document.getElementById('pdfInput');
const signUpload = document.getElementById('signUpload');
const pdfCanvas = document.getElementById('pdf-render');
const sigCanvas = document.getElementById('sig-canvas');
const sigCtx = sigCanvas.getContext('2d');
const overlay = document.getElementById('signature-overlay');

// 1. PDF Preview Load & Render
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    // PDF.js setup for rendering
    const pdfData = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.5 }); // High quality preview
    pdfCanvas.height = viewport.height;
    pdfCanvas.width = viewport.width;
    
    const renderContext = {
        canvasContext: pdfCanvas.getContext('2d'),
        viewport: viewport
    };
    await page.render(renderContext).promise;
    
    document.getElementById('preview-container').style.display = 'block';
});

// 2. Signature Drawing Logic
let drawing = false;
sigCanvas.addEventListener('mousedown', () => drawing = true);
sigCanvas.addEventListener('mouseup', () => { 
    drawing = false; 
    sigCtx.beginPath(); 
    updateOverlay(); 
});
sigCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = sigCanvas.getBoundingClientRect();
    sigCtx.lineWidth = 2;
    sigCtx.lineCap = 'round';
    sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    sigCtx.stroke();
});

// 3. Update Preview Overlay
function updateOverlay() {
    signatureImgBase64 = sigCanvas.toDataURL('image/png');
    overlay.style.backgroundImage = `url(${signatureImgBase64})`;
}

// 4. Click on PDF to Position
pdfCanvas.addEventListener('click', (e) => {
    const rect = pdfCanvas.getBoundingClientRect();
    sigX = e.clientX - rect.left;
    sigY = e.clientY - rect.top;
    
    overlay.style.left = (sigX - 75) + 'px'; 
    overlay.style.top = (sigY - 30) + 'px';
    overlay.style.display = 'block';
});

// 5. Digital Sign Upload Fix
signUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            sigCtx.drawImage(img, 0, 0, sigCanvas.width, sigCanvas.height);
            updateOverlay();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Clear Button
document.getElementById('sig-clearBtn').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    overlay.style.display = 'none';
    signatureImgBase64 = null;
});

// 6. FINAL DOWNLOAD LOGIC (Fixed)
document.getElementById('downloadBtn').addEventListener('click', async () => {
    try {
        if (!pdfLibDoc) return alert("Pehle PDF upload karein!");
        if (!signatureImgBase64) return alert("Signature draw ya upload karein!");
        if (overlay.style.display === 'none') return alert("PDF par click karke sign ki jagah select karein!");

        const pages = pdfLibDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Embed signature image
        const sigImage = await pdfLibDoc.embedPng(signatureImgBase64);

        // Coordinate Mapping Logic
        // PDF point system: (0,0) is bottom-left
        // Canvas pixel system: (0,0) is top-left
        const xRatio = width / pdfCanvas.width;
        const yRatio = height / pdfCanvas.height;

        const finalWidth = 150 * xRatio;
        const finalHeight = 60 * yRatio;
        const finalX = (sigX - 75) * xRatio;
        const finalY = height - ((sigY + 30) * yRatio); // Inverting Y axis

        firstPage.drawImage(sigImage, {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight,
        });

        // Save and Trigger Download
        const pdfBytes = await pdfLibDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Signed_Document_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error(err);
        alert("Download fail ho gaya: " + err.message);
    }
});
