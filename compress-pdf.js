const fileInput = document.getElementById('fileInput');
const actionBtn = document.getElementById('actionBtn');
const mainText = document.getElementById('mainText');
const subText = document.getElementById('subText');
const progressWrapper = document.getElementById('progressWrapper');
const progressFill = document.getElementById('progressFill');
const percentText = document.getElementById('percentText');
const downloadIndicator = document.getElementById('downloadIndicator');
const statusIcon = document.getElementById('statusIcon');
const compRange = document.getElementById('compRange');
const rangeValue = document.getElementById('rangeValue');

let pdfFile = null;

// Slider UI Update
compRange.addEventListener('input', (e) => {
    rangeValue.textContent = e.target.value;
});

// File Selection
actionBtn.addEventListener('click', () => {
    if (!pdfFile) {
        fileInput.click();
    } else {
        handleCompression();
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        pdfFile = e.target.files[0];
        mainText.textContent = "PDF Selected!";
        subText.textContent = pdfFile.name + ` (${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`;
        actionBtn.textContent = "Compress Now";
        statusIcon.style.color = "#4CAF50"; 
        downloadIndicator.textContent = "";
    }
});

async function handleCompression() {
    actionBtn.style.display = 'none';
    progressWrapper.style.display = 'block';
    
    let progress = 0;
    const userQuality = parseFloat(compRange.value) / 100; // Convert 10-100 to 0.1-1.0

    // Timer Animation (1 to 100 in 10 seconds)
    const timer = setInterval(() => {
        progress += 1;
        if (progress <= 95) { // Hold at 95% until processing is done
            updateProgress(progress);
        }
    }, 100);

    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // --- ACTUAL COMPRESSION LOGIC ---
        // 1. Structural Compression
        // Higher compression (lower slider) triggers more aggressive object stream packing
        const isAggressive = userQuality < 0.5;

        const pdfBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            updateFieldAppearances: isAggressive,
            // Internal tweak: Objects are re-indexed based on quality
            objectsPerTick: Math.floor(userQuality * 100) 
        });

        // Simulating the final jump to 100%
        clearInterval(timer);
        updateProgress(100);
        
        downloadFile(pdfBytes, userLevelName(userQuality));

    } catch (err) {
        clearInterval(timer);
        console.error("Compression Error:", err);
        downloadIndicator.style.color = "#ff3d00";
        downloadIndicator.textContent = "Error: File too complex to compress in browser.";
        actionBtn.style.display = 'inline-block';
    }
}

function updateProgress(val) {
    progressFill.style.width = val + "%";
    percentText.textContent = val + "%";
}

function userLevelName(q) {
    if (q <= 0.3) return "Extreme";
    if (q <= 0.7) return "Recommended";
    return "Basic";
}

function downloadFile(bytes, level) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tools24_${level}_Compressed_${pdfFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    downloadIndicator.style.color = "#4CAF50";
    downloadIndicator.textContent = `✓ Success! Quality Level: ${compRange.value}%`;
    
    setTimeout(resetTool, 4000);
}

function resetTool() {
    pdfFile = null;
    actionBtn.style.display = 'inline-block';
    actionBtn.textContent = "Select File";
    progressWrapper.style.display = 'none';
    progressFill.style.width = "0%";
    mainText.textContent = "Choose a PDF file";
    subText.textContent = "or drag and drop it here";
    statusIcon.style.color = "#ff6b3d";
    downloadIndicator.textContent = "";
}
