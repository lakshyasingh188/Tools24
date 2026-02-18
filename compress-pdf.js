const pdfInput = document.getElementById("pdfInput");
const fileInfo = document.getElementById("fileInfo");
const slider = document.getElementById("compressionSlider");
const percentValue = document.getElementById("percentValue");
const loadingBox = document.getElementById("loadingBox");
const downloadBtn = document.getElementById("downloadBtn");
const completeMessage = document.getElementById("completeMessage");

/* Show slider percentage */
slider.addEventListener("input", () => {
    percentValue.textContent = slider.value + "%";
});

/* File selected indicator */
pdfInput.addEventListener("change", () => {
    if(pdfInput.files.length > 0){
        fileInfo.innerHTML = "✔ Selected: " + pdfInput.files[0].name;
    }
});

async function compressPDF(){

    if(!pdfInput.files.length){
        alert("Please select a PDF first.");
        return;
    }

    loadingBox.style.display = "block";
    downloadBtn.style.display = "none";
    completeMessage.innerHTML = "";

    const file = pdfInput.files[0];
    const arrayBuffer = await file.arrayBuffer();

    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const newPdf = await PDFLib.PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

    pages.forEach(page => newPdf.addPage(page));

    const compressedBytes = await newPdf.save({
        useObjectStreams:true,
        compress:true
    });

    const blob = new Blob([compressedBytes], {type:"application/pdf"});
    const url = URL.createObjectURL(blob);

    setTimeout(() => {
        loadingBox.style.display = "none";
        downloadBtn.href = url;
        downloadBtn.download = "compressed.pdf";
        downloadBtn.innerHTML = "Download Compressed PDF";
        downloadBtn.style.display = "block";

        completeMessage.innerHTML = "✔ Compression Complete!";
    }, 2000);
}
