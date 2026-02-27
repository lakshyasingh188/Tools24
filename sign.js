let pdfLibDoc = null;
let sigX = 0, sigY = 0;
let signatureImgBase64 = null;

const pdfInput = document.getElementById('pdfInput');
const signUpload = document.getElementById('signUpload');
const pdfCanvas = document.getElementById('pdf-render');
const sigCanvas = document.getElementById('sig-canvas');
const sigCtx = sigCanvas.getContext('2d');
const overlay = document.getElementById('signature-overlay');

// 1. PDF Load logic
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    const pdfData = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.5 });
    pdfCanvas.height = viewport.height;
    pdfCanvas.width = viewport.width;
    
    await page.render({
        canvasContext: pdfCanvas.getContext('2d'),
        viewport: viewport
    }).promise;
    
    document.getElementById('preview-container').style.display = 'block';
});

// 2. Click to Place Signature
pdfCanvas.addEventListener('click', (e) => {
    const rect = pdfCanvas.getBoundingClientRect();
    sigX = e.clientX - rect.left;
    sigY = e.clientY - rect.top;
    
    overlay.style.left = (sigX - 75) + 'px'; 
    overlay.style.top = (sigY - 30) + 'px';
    overlay.style.display = 'block';
    
    // Ensure overlay matches current canvas/image
    updateOverlay(); 
});

// 3. Drawing Logic
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

// 4. DIGITAL SIGN UPLOAD FIX
signUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Canvas clear karke naya image draw karna
            sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            
            // Image ko canvas ke size mein fit karna
            const hRatio = sigCanvas.width / img.width;
            const vRatio = sigCanvas.height / img.height;
            const ratio  = Math.min(hRatio, vRatio);
            const centerShift_x = (sigCanvas.width - img.width * ratio) / 2;
            const centerShift_y = (sigCanvas.height - img.height * ratio) / 2;
            
            sigCtx.drawImage(img, 0, 0, img.width, img.height,
                           centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
            
            updateOverlay(); // Preview update
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function updateOverlay() {
    // Hamesha canvas se current image uthao
    signatureImgBase64 = sigCanvas.toDataURL('image/png');
    overlay.style.backgroundImage = `url(${signatureImgBase64})`;
}

document.getElementById('sig-clearBtn').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    overlay.style.display = 'none';
    signatureImgBase64 = null;
});

// 5. DOWNLOAD LOGIC
document.getElementById('downloadBtn').addEventListener('click', async () => {
    try {
        if (!pdfLibDoc || !signatureImgBase64) {
            alert("Pehle PDF upload karein aur Signature draw/upload karein!");
            return;
        }

        const pages = pdfLibDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Canvas se latest image lene ke liye dobara call
        updateOverlay(); 

        const sigImage = await pdfLibDoc.embedPng(signatureImgBase64);

        const xRatio = width / pdfCanvas.width;
        const yRatio = height / pdfCanvas.height;

        // Final PDF coordinates
        const finalX = (sigX - 75) * xRatio;
        const finalY = height - ((sigY + 30) * yRatio);

        firstPage.drawImage(sigImage, {
            x: finalX,
            y: finalY,
            width: 150 * xRatio,
            height: 60 * yRatio,
        });

        const pdfBytes = await pdfLibDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "Signed_Document.pdf";
        link.click();

    } catch (err) {
        console.error(err);
        alert("Kucch gadbad hui: " + err.message);
    }
});
