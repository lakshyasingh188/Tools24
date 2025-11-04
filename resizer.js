let originalImage = null;
let debounceTimer;

// Helper function to show file size in KB or MB
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    imageInput.addEventListener('change', previewImage);
    // Initialize quality group display based on default selection (JPG)
    const formatSelect = document.getElementById('formatSelect');
    if (formatSelect) {
        formatSelect.dispatchEvent(new Event('change'));
    }
});

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage = new Image();
            originalImage.file = file; // Store file object for size calculation
            originalImage.onload = function() {
                // Display original dimensions and size (KB/MB)
                const originalFileSize = formatFileSize(originalImage.file.size);
                document.getElementById('originalDetails').textContent = 
                    Original Size: ${originalImage.width} x ${originalImage.height} px (${originalFileSize});
                    
                // Set default resize values 
                document.getElementById('widthInput').value = originalImage.width;
                document.getElementById('heightInput').value = originalImage.height;
                document.getElementById('qualityInput').value = 90; 
                document.getElementById('qualityValue').innerText = '90%';
                
                // Update estimated size after image loads
                updateEstimatedSize();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Debounced function to update estimated size
function updateEstimatedSize() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (!originalImage) {
            document.getElementById('estimatedSize').textContent = 'Estimated Size: N/A (Image not loaded)';
            return;
        }

        const newWidth = parseInt(document.getElementById('widthInput').value);
        const newHeight = parseInt(document.getElementById('heightInput').value);
        const format = document.getElementById('formatSelect').value;
        const qualityPercent = parseInt(document.getElementById('qualityInput').value);
        
        document.getElementById('qualityValue').innerText = ${qualityPercent}%;

        if (format === 'image/png') {
            document.getElementById('estimatedSize').textContent = 'Estimated Size: PNG (Lossless, size depends on content)';
            return;
        }

        if (isNaN(newWidth) || isNaN(newHeight) || newWidth < 10 || newHeight < 10 || isNaN(qualityPercent) || qualityPercent < 10 || qualityPercent > 100) {
            document.getElementById('estimatedSize').textContent = 'Estimated Size: Invalid inputs';
            return;
        }

        // Create a temporary canvas for estimation
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        tempCtx.drawImage(originalImage, 0, 0, newWidth, newHeight);

        // Get blob with current settings
        tempCanvas.toBlob(function(blob) {
            if (blob) {
                document.getElementById('estimatedSize').textContent = Estimated Size: ${formatFileSize(blob.size)};
            } else {
                document.getElementById('estimatedSize').textContent = 'Estimated Size: Error calculating';
            }
        }, format, qualityPercent / 100);
    }, 300); // Debounce for 300ms
}


function resizeImage() {
    if (!originalImage) {
        alert("पहले एक Image अपलोड करें।");
        return;
    }
    
    // 1. Get user inputs
    const newWidth = parseInt(document.getElementById('widthInput').value);
    const newHeight = parseInt(document.getElementById('heightInput').value);
    const format = document.getElementById('formatSelect').value;
    const qualityPercent = parseInt(document.getElementById('qualityInput').value);
    
    // Calculate quality as a decimal (0.10 to 1.00) for toBlob()
    const quality = format === 'image/jpeg' ? (qualityPercent / 100) : 1.0; 

    if (isNaN(newWidth) || isNaN(newHeight) || newWidth < 10 || newHeight < 10) {
        alert("Width और Height के सही मान (value) भरें (न्यूनतम 10px)।");
        return;
    }
    
    if (format === 'image/jpeg' && (isNaN(qualityPercent) || qualityPercent < 10 || qualityPercent > 100)) {
        alert("JPG Quality 10% से 100% के बीच होनी चाहिए।");
        return;
    }

    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    
    // 2. Resize Canvas
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

    // 3. Download using Blob (where the compression happens)
    canvas.toBlob(function(blob) {
        if (!blob) {
            alert("Image बनाने में कोई समस्या आई। फ़ाइल टाइप जाँचें।");
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const extension = format === 'image/jpeg' ? 'jpg' : 'png';
        
        a.href = url;
        // Use quality in file name only for JPG
        const namePart = format === 'image/jpeg' ? q${qualityPercent} : 'lossless';
        a.download = resized_image_${newWidth}x${newHeight}_${namePart}.${extension}; 
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const originalFileSize = formatFileSize(originalImage.file.size);
        const finalFileSize = formatFileSize(blob.size);
        
        alert(Image सफलतापूर्वक Resize/Compress हो गया है।\nफाइनल साइज़: ${finalFileSize}\n(पुराना साइज़: ${originalFileSize}));
        
    }, format, quality); // Pass format and quality here to control KB/MB size
}
