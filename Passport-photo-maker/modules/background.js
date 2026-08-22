export async function applyBackground(handlers) {
    const bgColor = handlers.getState('bgColor');
    if (!bgColor || bgColor === 'original') {
        showToast('Select a background color first.', 'info');
        return;
    }

    handlers.showLoader('Removing background...');
    
    try {
        // We need the current cropped image to apply background, 
        // because applying it to the whole source image is inefficient.
        // However, for a true background removal, we should process the original uploaded image
        // and then let the user crop. Let's process the workingDataUrl.
        
        const img = new Image();
        img.src = handlers.getState('workingDataUrl');
        await new Promise(res => img.onload = res);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const threshold = handlers.getState('bgThreshold') || 35;
        const newDataUrl = removeBackground(canvas, ctx, bgColor, threshold);
        
        handlers.onBackgroundApplied(newDataUrl);
        handlers.hideLoader();
        showToast('Background changed!', 'success');
    } catch (err) {
        console.error(err);
        handlers.hideLoader();
        showToast('Background processing failed.', 'error');
    }
}

export function restoreOriginal(handlers) {
    handlers.onBackgroundApplied(handlers.getState('originalDataUrl'));
    showToast('Original restored.', 'info');
}

function removeBackground(canvas, ctx, newColor, threshold) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    // Sample corner colors
    const corners = [
        [0, 0], [canvas.width-1, 0], [0, canvas.height-1], [canvas.width-1, canvas.height-1]
    ];
    let r=0, g=0, b=0, cnt=0;
    corners.forEach(([x, y]) => {
        const i = (y * canvas.width + x) * 4;
        r += data[i]; g += data[i+1]; b += data[i+2]; cnt++;
    });
    r /= cnt; g /= cnt; b /= cnt;
    
    const thr = threshold * threshold * 3;
    const newRgb = hexToRgb(newColor);
    
    for (let i = 0; i < data.length; i += 4) {
        const dr = data[i] - r;
        const dg = data[i+1] - g;
        const db = data[i+2] - b;
        const dist = dr*dr + dg*dg + db*db;
        
        if (dist < thr) {
            data[i] = newRgb.r;
            data[i+1] = newRgb.g;
            data[i+2] = newRgb.b;
            data[i+3] = 255;
        } else if (dist < thr * 2.5) {
            // Edge feathering
            const t = (dist - thr) / (thr * 1.5);
            const k = Math.min(1, Math.max(0, t));
            data[i] = data[i] * k + newRgb.r * (1 - k);
            data[i+1] = data[i+1] * k + newRgb.g * (1 - k);
            data[i+2] = data[i+2] * k + newRgb.b * (1 - k);
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substr(0,2),16),
        g: parseInt(hex.substr(2,2),16),
        b: parseInt(hex.substr(4,2),16)
    };
}

import { showToast } from './utils.js';
