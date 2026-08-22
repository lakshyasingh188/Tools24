let cropper = null;
let filters = { brightness: 100, contrast: 100, saturation: 100 };

export function initEditor(handlers) {
    // Initialization if needed
}

export function loadEditorImage(dataUrl) {
    const img = document.getElementById('editorImage');
    img.src = dataUrl;
    img.onload = () => {
        if (cropper) cropper.destroy();
        cropper = new Cropper(img, {
            aspectRatio: getAspectRatio(),
            viewMode: 1,
            autoCropArea: 0.8,
            movable: true,
            zoomable: true,
            rotatable: true,
            responsive: true,
            ready: () => applyFilters()
        });
    };
}

export function applyFilters() {
    if (!cropper) return;
    const b = document.getElementById('brightness').value;
    const c = document.getElementById('contrast').value;
    const s = document.getElementById('saturation').value;
    const filterStr = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    cropper.canvas.setAttribute('style', `filter: ${filterStr}`); // Apply visual filter to cropper
    filters = { brightness: b, contrast: c, saturation: s };
}

export function getCroppedCanvas() {
    if (!cropper) return null;
    
    // Create a temporary canvas to apply filters to the cropped image
    const cropCanvas = cropper.getCroppedCanvas({ imageSmoothingQuality: 'high' });
    if (!cropCanvas) return null;
    
    const outCanvas = document.createElement('canvas');
    outCanvas.width = cropCanvas.width;
    outCanvas.height = cropCanvas.height;
    const ctx = outCanvas.getContext('2d');
    
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
    ctx.drawImage(cropCanvas, 0, 0);
    
    return outCanvas;
}

export function resetCropper(val, type) {
    if (!cropper) return;
    if (type === 'rotate') cropper.rotate(val);
    else if (type === 'zoom') cropper.zoom(val);
    else if (type === 'reset') {
        cropper.reset();
        cropper.setAspectRatio(getAspectRatio());
    }
}

export function destroyCropper() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

function getAspectRatio() {
    // Accessing state through the DOM elements to keep modules decoupled
    const preset = document.getElementById('sizePreset').value;
    if (preset === 'custom') {
        const w = parseInt(document.getElementById('customW').value) || 35;
        const h = parseInt(document.getElementById('customH').value) || 45;
        return w / h; // Cropper expects width/height
    } else {
        const [w, h] = preset.split('|');
        return parseInt(w) / parseInt(h);
    }
}

// Import showToast if needed inside
import { showToast } from './utils.js';