let pdfLibDoc = null;
let signatureImgBase64 = null;
let signaturesList = []; // Saare signs yaha save honge
let drawing = false;

const pdfInput = document.getElementById('pdfInput');
const signUpload = document.getElementById('signUpload');
const pdfWrapper = document.querySelector('.pdf-wrapper');
const sigCanvas = document.getElementById('sig-canvas');
const sigCtx = sigCanvas.getContext('2d');

// 1. Render PDF Pages
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    pdfWrapper.innerHTML = ''; 
    signaturesList = []; // Reset list
    const arrayBuffer = await file.arrayBuffer();
    pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    const pdfData = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.2 });

        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-container';
        pageDiv.dataset.pageIdx = i - 1; 
        
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;

        pageDiv.appendChild(canvas);
        pdfWrapper.appendChild(pageDiv);

        // Click to add signature at this spot
        pageDiv.addEventListener('click', (ev) => {
            if (!signatureImgBase64) return alert("पहले नीचे सिग्नेचर बनाएं या अपलोड करें!");
            
            const rect = canvas.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            const y = ev.clientY - rect.top;

            addSignatureToView(pageDiv, x, y, i - 1, canvas.width, canvas.height);
        });
    }
});

// 2. UI par sign dikhana aur list mein add karna
function addSignatureToView(container, x, y, pageIdx, cW, cH) {
    const sigDiv = document.createElement('div');
    sigDiv.className = 'placed-sign';
    sigDiv.style.backgroundImage = `url(${signatureImgBase64})`;
    sigDiv.style.left = (x - 60) + 'px';
    sigDiv.style.top = (y - 25) + 'px';
    sigDiv.title = "Double click to remove";

    const sigObj = {
        id: Date.now(),
        pageIdx: pageIdx,
        x: x,
        y: y,
        canvasW: cW,
        canvasH: cH,
        imgData: signatureImgBase64
    };

    // Double click to delete
    sigDiv.addEventListener('dblclick', () => {
        container.removeChild(sigDiv);
        signaturesList = signaturesList.filter(s => s.id !== sigObj.id);
    });

    container.appendChild(sigDiv);
    signaturesList.push(sigObj);
}

// 3. Signature Drawing logic
sigCanvas.addEventListener('mousedown', () => drawing = true);
sigCanvas.addEventListener('mouseup', () => { drawing = false; sigCtx.beginPath(); signatureImgBase64 = sigCanvas.toDataURL(); });
sigCanvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = sigCanvas.getBoundingClientRect();
    sigCtx.lineWidth = 2;
    sigCtx.lineCap = 'round';
    sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    sigCtx.stroke();
});

// Clear Pad
document.getElementById('sig-clearBtn').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    signatureImgBase64 = null;
});

// Upload Digital Sign
signUpload.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            sigCtx.drawImage(img, 0, 0, sigCanvas.width, sigCanvas.height);
            signatureImgBase64 = sigCanvas.toDataURL();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// 4. Final Download with Loop
document.getElementById('downloadBtn').addEventListener('click', async () => {
    if (!pdfLibDoc || signaturesList.length === 0) return alert("Kam se kam ek jagah sign place karein!");

    const pages = pdfLibDoc.getPages();

    for (const item of signaturesList) {
        const currentPage = pages[item.pageIdx];
        const { width, height } = currentPage.getSize();
        
        const xRatio = width / item.canvasW;
        const yRatio = height / item.canvasH;

        const sigImage = await pdfLibDoc.embedPng(item.imgData);

        currentPage.drawImage(sigImage, {
            x: (item.x - 60) * xRatio,
            y: height - ((item.y + 25) * yRatio),
            width: 120 * xRatio,
            height: 50 * yRatio,
        });
    }

    const pdfBytes = await pdfLibDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Multi_Signed_Document.pdf";
    link.click();
});
