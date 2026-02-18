const fileInput = document.getElementById('fileInput');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

let currentFile = null;
let originalWidth = 0;
let originalHeight = 0;
let resizedBlob = null; // This will store the actual resized file

// --- Navigation & Tabs ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.remove('hidden');
    };
});

// --- File Selection ---
document.getElementById('dropZone').onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    currentFile = e.target.files[0];
    if (currentFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalWidth = img.width;
                originalHeight = img.height;
                
                // Set default values in inputs
                document.getElementById('widthPx').value = img.width;
                document.getElementById('heightPx').value = img.height;
                updateResText(img.width, img.height);
                
                document.getElementById('filePreview').style.backgroundImage = `url(${event.target.result})`;
                document.getElementById('fileNameDisplay').innerText = currentFile.name;
                
                step1.classList.add('hidden');
                step2.classList.remove('hidden');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(currentFile);
    }
};

// --- Update UI Text ---
function updateResText(w, h) {
    document.getElementById('origRes').innerText = `${originalWidth}x${originalHeight}`;
    document.getElementById('newRes').innerText = `${w}x${h}`;
}

// --- Input Logic ---
document.getElementById('sizeSlider').oninput = function() {
    document.getElementById('percentLabel').innerText = this.value + "%";
    const nw = Math.round(originalWidth * (this.value / 100));
    const nh = Math.round(originalHeight * (this.value / 100));
    document.getElementById('widthPx').value = nw;
    document.getElementById('heightPx').value = nh;
    updateResText(nw, nh);
};

document.getElementById('platformSelect').onchange = function() {
    const [w, h] = this.value.split('x');
    document.getElementById('widthPx').value = w;
    document.getElementById('heightPx').value = h;
    updateResText(w, h);
};

// --- The Actual Resizing Engine ---
async function processImage() {
    return new Promise((resolve) => {
        const targetWidth = parseInt(document.getElementById('widthPx').value);
        const targetHeight = parseInt(document.getElementById('heightPx').value);
        const quality = 0.9; // High quality

        const img = new Image();
        img.src = document.getElementById('filePreview').style.backgroundImage.slice(5, -2);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            
            // Draw image to canvas with new sizes
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
            // Convert canvas back to a file (Blob)
            canvas.toBlob((blob) => {
                resizedBlob = blob;
                resolve();
            }, currentFile.type, quality);
        };
    });
}

// --- Process & Loading Logic ---
document.getElementById('resizeBtn').onclick = async () => {
    step2.classList.add('hidden');
    step3.classList.remove('hidden');

    // Run the actual resizing math in the background
    await processImage();

    let progress = 0;
    const interval = setInterval(() => {
        progress++;
        document.getElementById('progressBar').style.width = progress + "%";
        document.getElementById('progressText').innerText = progress + "%";

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                step3.classList.add('hidden');
                step4.classList.remove('hidden');
                document.getElementById('finalFileName').innerText = "resized_" + currentFile.name;
            }, 500);
        }
    }, 200); // 20 Seconds simulation
};

// --- Download Logic ---
document.getElementById('downloadBtn').onclick = function() {
    if (!resizedBlob) return;

    const url = URL.createObjectURL(resizedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "resized_" + currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.innerText = "Downloaded! ↓";
    this.style.background = "#34c759";
};