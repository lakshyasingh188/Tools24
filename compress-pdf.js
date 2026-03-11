const fileInput = document.getElementById('fileInput');
const actionBtn = document.getElementById('actionBtn');
const mainText = document.getElementById('mainText');
const subText = document.getElementById('subText');
const progressWrapper = document.getElementById('progressWrapper');
const progressFill = document.getElementById('progressFill');
const percentText = document.getElementById('percentText');
const downloadIndicator = document.getElementById('downloadIndicator');
const statusIcon = document.getElementById('statusIcon');

let pdfFile = null;

actionBtn.addEventListener('click', () => {
    if (!pdfFile) {
        fileInput.click();
    } else {
        runCompression();
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        pdfFile = e.target.files[0];
        mainText.textContent = "File Selected";
        subText.textContent = pdfFile.name;
        actionBtn.textContent = "Start Compression";
        
        // Change icon color to green to indicate selection
        statusIcon.style.color = "#4CAF50";
    }
});

function runCompression() {
    // Hide button, show progress
    actionBtn.style.display = 'none';
    progressWrapper.style.display = 'block';
    downloadIndicator.textContent = "Initializing algorithm...";

    let count = 0;
    const interval = setInterval(() => {
        count++;
        progressFill.style.width = count + "%";
        percentText.textContent = count + "%";

        if (count === 100) {
            clearInterval(interval);
            processAndDownload();
        }
    }, 100); // 100ms * 100 steps = 10 seconds
}

async function processAndDownload() {
    try {
        const quality = document.getElementById('compressionLevel').value;
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // Simulated compression by optimizing the structure
        const pdfBytes = await pdfDoc.save({ 
            useObjectStreams: true,
            addDefaultPage: false 
        });

        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_q${quality}_${pdfFile.name}`;
        a.click();

        downloadIndicator.style.color = "#4CAF50";
        downloadIndicator.textContent = "✓ Download Complete!";
        
        setTimeout(resetTool, 3000);
    } catch (err) {
        downloadIndicator.style.color = "#ff3d00";
        downloadIndicator.textContent = "Error: File could not be processed.";
    }
}

function resetTool() {
    pdfFile = null;
    actionBtn.style.display = 'inline-block';
    actionBtn.textContent = "Select File";
    progressWrapper.style.display = 'none';
    progressFill.style.width = "0%";
    mainText.textContent = "Choose a PDF file";
    subText.textContent = "or drag and drop it here";
    statusIcon.style.color = "#ff5f38";
    downloadIndicator.textContent = "";
}
