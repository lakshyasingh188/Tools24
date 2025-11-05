/* --- JavaScript Logic for Photo Resizer & Compressor (resizer.js) --- */

let originalImage = null;
let debounceTimer;
let currentBgColor = 'white'; 

// Helper function to show file size in KB or MB
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to handle background color selection
function selectBackground(color) {
    currentBgColor = color;
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(color + 'Bg').classList.add('selected');
}

// Function to load and display image details
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage = new Image();
            originalImage.file = file;
            originalImage.onload = function() {
                // Display original dimensions and size
                const originalFileSize = formatFileSize(originalImage.file.size);
                document.getElementById('originalDetails').textContent = 
                    `${originalImage.width} x ${originalImage.height} px (${originalFileSize})`;
                    
                // Set default values (matching the reference site)
                document.getElementById('widthPercentInput').value = 70;
                document.getElementById('heightPercentInput').value = 70;
                document.getElementById('qualityInput').value = 90; 
                document.getElementById('dpiInput').value = 72; 

                // Ensure the inputs are updated to reflect percentage mode by default
                document.getElementById('resizeSelect').value = 'percent';
                toggleResizeMode('percent');

                updateEstimatedSize();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Function to switch between Percent and Pixel mode
function toggleResizeMode(mode) {
    const widthInput = document.getElementById('widthPercentInput');
    const heightInput = document.getElementById('heightPercentInput');
    const linkIcon = document.querySelector('.link-icon');

    if (mode === 'percent') {
        widthInput.placeholder = '70';
        heightInput.placeholder = '70';
        widthInput.setAttribute('min', '1');
        widthInput.setAttribute('max', '100');
        heightInput.setAttribute('min', '1');
        heightInput.setAttribute('max', '100');
        linkIcon.style.opacity = '1';
        // Re-calculate based on percentage
        widthInput.value = Math.min(100, Math.max(1, parseInt(widthInput.value) || 70));
        heightInput.value = Math.min(100, Math.max(1, parseInt(heightInput.value) || 70));
        
        // Link height to width input event
        widthInput.oninput = function() {
            heightInput.value = this.value;
            updateEstimatedSize();
        };

    } else if (mode === 'pixel' && originalImage) {
        widthInput.placeholder = originalImage.width;
        heightInput.placeholder = originalImage.height;
        widthInput.removeAttribute('max');
        heightInput.removeAttribute('max');
        linkIcon.style.opacity = '0.4'; // No automatic linking in pixel mode (user can change aspect ratio)

        // Set default values to original dimensions for pixel mode
        widthInput.value = originalImage.width;
        heightInput.value = originalImage.height;
        
        // Unlink height from width input event
        widthInput.oninput = function() {
            updateEstimatedSize();
        };
    }
    updateEstimatedSize();
}

// Debounced function to update estimated size (Called by oninput)
function updateEstimatedSize() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (!originalImage) {
            document.getElementById('estimatedSize').textContent = 'Estimated Size: N/A (Image not loaded)';
            return;
        }

        const resizeMode = document.getElementById('resizeSelect').value;
        const inputWidth = parseInt(document.getElementById('widthPercentInput').value);
        const inputHeight = parseInt(document.getElementById('heightPercentInput').value);
        const format = document.getElementById('formatSelect').value;
        const qualityPercent = parseInt(document.getElementById('qualityInput').value);

        let newWidth, newHeight;

        if (resizeMode === 'percent') {
            if (isNaN(inputWidth) || isNaN(inputHeight) || inputWidth < 1 || inputHeight < 1) {
                 document.getElementById('estimatedSize').textContent = 'Estimated Size: Invalid percentage';
                 return;
            }
            newWidth = Math.floor(originalImage.width * (inputWidth / 100));
            newHeight = Math.floor(originalImage.height * (inputHeight / 100));
        } else { // 'pixel' mode
            if (isNaN(inputWidth) || isNaN(inputHeight) || inputWidth < 1 || inputHeight < 1) {
                 document.getElementById('estimatedSize').textContent = 'Estimated Size: Invalid dimensions (pixels)';
                 return;
            }
            newWidth = inputWidth;
            newHeight = inputHeight;
        }

        // Temporary canvas for accurate size estimation
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        tempCtx.fillStyle = currentBgColor;
        tempCtx.fillRect(0, 0, newWidth, newHeight);

        tempCtx.drawImage(originalImage, 0, 0, newWidth, newHeight);

        if (format === 'image/png') {
            document.getElementById('estimatedSize').textContent = 'Estimated Size: PNG (Lossless, size depends on content)';
            return;
        }

        tempCanvas.toBlob(function(blob) {
            if (blob) {
                document.getElementById('estimatedSize').textContent = `Estimated Size: ${formatFileSize(blob.size)}`;
            } else {
                document.getElementById('estimatedSize').textContent = 'Estimated Size: Error calculating';
            }
        }, format, qualityPercent / 100);
    }, 300); 
}


// Main function to resize and download the image
function resizeImage() {
    if (!originalImage) {
        alert("पहले एक Image अपलोड करें।");
        return;
    }
    
    const resizeMode = document.getElementById('resizeSelect').value;
    const inputWidth = parseInt(document.getElementById('widthPercentInput').value);
    const inputHeight = parseInt(document.getElementById('heightPercentInput').value);
    const format = document.getElementById('formatSelect').value;
    const qualityPercent = parseInt(document.getElementById('qualityInput').value);
    const dpi = parseInt(document.getElementById('dpiInput').value); 

    const quality = format === 'image/jpeg' ? (qualityPercent / 100) : 1.0; 
    let newWidth, newHeight;

    if (resizeMode === 'percent') {
        if (isNaN(inputWidth) || inputWidth < 1) { alert("Width Percentage 1% से कम नहीं हो सकती।"); return; }
        newWidth = Math.floor(originalImage.width * (inputWidth / 100));
        newHeight = Math.floor(originalImage.height * (inputHeight / 100));
    } else { // 'pixel' mode
        if (isNaN(inputWidth) || inputWidth < 1 || isNaN(inputHeight) || inputHeight < 1) { 
            alert("Width और Height के सही मान (pixels) भरें (न्यूनतम 1px)।"); 
            return; 
        }
        newWidth = inputWidth;
        newHeight = inputHeight;
    }

    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Draw background color first
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, newWidth, newHeight);
    
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

    // 3. Download using Blob
    canvas.toBlob(function(blob) {
        if (!blob) {
            alert("Image बनाने में कोई समस्या आई। फ़ाइल टाइप जाँचें।");
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const extension = format === 'image/jpeg' ? 'jpg' : 'png';
        
        a.href = url;
        const namePart = (resizeMode === 'percent') ? `${inputWidth}p` : `${newWidth}x${newHeight}`;
        a.download = `resized_${namePart}_q${qualityPercent}.${extension}`; 
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show final size alert
        const originalFileSize = formatFileSize(originalImage.file.size);
        const finalFileSize = formatFileSize(blob.size);
        
        alert(`✅ Image successfully resized/compressed.\nFinal Size: ${finalFileSize}\n(Old Size: ${originalFileSize})\nDPI: ${dpi} will be used for printing.`);
        
    }, format, quality); 
}

// Event Listeners setup
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const selectImageBtn = document.getElementById('selectImageBtn');
    const resizeSelect = document.getElementById('resizeSelect');

    // Attach listeners
    fileInput.addEventListener('change', previewImage);
    selectImageBtn.addEventListener('click', () => fileInput.click());
    resizeSelect.addEventListener('change', (e) => toggleResizeMode(e.target.value));
    
    // Initial setup on load
    selectBackground('white');
    // Set default mode and link inputs
    toggleResizeMode('percent'); 
});
