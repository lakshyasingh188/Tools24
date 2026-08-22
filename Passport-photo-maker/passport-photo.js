import { initCamera, openCamera, closeCamera, capturePhoto, useCapturedPhoto, switchCamera } from './modules/camera.js';
import { initEditor, loadEditorImage, getCroppedCanvas, applyFilters, resetCropper, destroyCropper } from './modules/editor.js';
import { applyBackground, restoreOriginal } from './modules/background.js';
import { downloadImage, downloadPDF, printSheet } from './modules/export.js';
import { generateSheet, initSheetMaker } from './modules/photo-sheet.js';
import { runQualityCheck } from './modules/quality-check.js';
import { showLoader, hideLoader, showToast, toggleTheme } from './modules/utils.js';

const state = {
    originalDataUrl: null,
    workingDataUrl: null,
    size: { w: 35, h: 45, unit: 'mm', dpi: 300 },
    finalCanvas: null,
    sheetCanvas: null
};

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    initUI();
    initCamera(handlers);
    initEditor(handlers);
    initSheetMaker(handlers, state);
});

const handlers = {
    setState: (key, value) => state[key] = value,
    getState: (key) => state[key],
    showLoader,
    hideLoader,
    showToast,
    onPhotoLoaded: (dataUrl) => {
        state.originalDataUrl = dataUrl;
        state.workingDataUrl = dataUrl;
        loadEditorImage(dataUrl);
        document.getElementById('uploadSection').classList.add('hidden');
        document.getElementById('editorSection').classList.remove('hidden');
        document.getElementById('settingsSection').classList.remove('hidden');
        document.getElementById('sheetSection').classList.remove('hidden');
    },
    onBackgroundApplied: (newDataUrl) => {
        state.workingDataUrl = newDataUrl;
        loadEditorImage(newDataUrl);
    },
    onSheetGenerated: (canvas) => {
        state.sheetCanvas = canvas;
        document.getElementById('downloadPdfBtn').disabled = false;
        document.getElementById('printSheetBtn').disabled = false;
    }
};

function initUI() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
        });
    });

    // Upload
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');

    document.getElementById('chooseFileBtn').addEventListener('click', () => fileInput.click());
    document.getElementById('openCameraBtn').addEventListener('click', () => openCamera());
    document.getElementById('closeCameraBtn').addEventListener('click', () => closeCamera());
    document.getElementById('captureBtn').addEventListener('click', () => capturePhoto());
    document.getElementById('useCaptureBtn').addEventListener('click', () => useCapturedPhoto(handlers.onPhotoLoaded));
    document.getElementById('switchCameraBtn').addEventListener('click', () => switchCamera());

    dropZone.addEventListener('click', (e) => { if(e.target.tagName !== 'BUTTON') fileInput.click(); });
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    ['dragover'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
    dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

    // Editor Controls
    document.querySelectorAll('[data-rotate]').forEach(b => b.addEventListener('click', () => resetCropper(parseInt(b.dataset.rotate), 'rotate')));
    document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => resetCropper(parseFloat(b.dataset.zoom), 'zoom')));
    document.querySelector('[data-action="reset-crop"]').addEventListener('click', () => resetCropper(0, 'reset'));

    // Adjustments
    ['brightness', 'contrast', 'saturation'].forEach(filter => {
        const el = document.getElementById(filter);
        el.addEventListener('input', (e) => {
            document.getElementById(`${filter === 'brightness' ? 'bright' : filter === 'contrast' ? 'contrast' : 'sat'}Val`).textContent = e.target.value + '%';
            applyFilters();
        });
    });
    document.querySelector('[data-action="reset-adjust"]').addEventListener('click', () => {
        document.getElementById('brightness').value = 100;
        document.getElementById('contrast').value = 100;
        document.getElementById('saturation').value = 100;
        applyFilters();
        showToast('Adjustments reset', 'info');
    });

    // Background
    document.querySelectorAll('.swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
            sw.classList.add('active');
            handlers.setState('bgColor', sw.dataset.bg || 'original');
        });
    });
    document.getElementById('customBgColor').addEventListener('input', (e) => {
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        e.target.classList.add('active');
        handlers.setState('bgColor', e.target.value);
    });
    document.getElementById('bgThreshold').addEventListener('input', (e) => {
        document.getElementById('threshVal').textContent = e.target.value;
        handlers.setState('bgThreshold', parseInt(e.target.value));
    });
    document.getElementById('applyBgBtn').addEventListener('click', () => applyBackground(handlers));
    document.getElementById('restoreBgBtn').addEventListener('click', () => restoreOriginal(handlers));

    // Sizes
    document.getElementById('sizePreset').addEventListener('change', (e) => {
        const panel = document.getElementById('customSizePanel');
        if (e.target.value === 'custom') {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
            const [w, h, unit] = e.target.value.split('|');
            state.size = { w: parseInt(w), h: parseInt(h), unit, dpi: parseInt(document.getElementById('dpiSel').value) || 300 };
            resetCropper(0, 'reset'); // Reset crop to new aspect ratio
        }
    });
    ['customW', 'customH', 'sizeUnit', 'dpiSel'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            if (document.getElementById('sizePreset').value === 'custom') {
                state.size = {
                    w: parseInt(document.getElementById('customW').value) || 35,
                    h: parseInt(document.getElementById('customH').value) || 45,
                    unit: document.getElementById('sizeUnit').value,
                    dpi: parseInt(document.getElementById('dpiSel').value) || 300
                };
                resetCropper(0, 'reset');
            }
        });
    });

    // Generate & Download
    document.getElementById('generateBtn').addEventListener('click', generatePhoto);
    document.getElementById('downloadJpgBtn').addEventListener('click', () => downloadImage(state.finalCanvas, 'jpg'));
    document.getElementById('downloadPngBtn').addEventListener('click', () => downloadImage(state.finalCanvas, 'png'));
    document.getElementById('resetAllBtn').addEventListener('click', resetAll);
    
    // Sheet
    document.getElementById('generateSheetBtn').addEventListener('click', () => generateSheet(handlers, state));
    document.getElementById('downloadPdfBtn').addEventListener('click', () => downloadPDF(state.sheetCanvas, state.size));
    document.getElementById('printSheetBtn').addEventListener('click', () => printSheet());
}

function handleFile(file) {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('Please select a valid JPG, PNG or WEBP image.', 'error');
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        showToast('File too large. Maximum 20MB.', 'error');
        return;
    }

    showLoader('Loading image...');
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            handlers.onPhotoLoaded(e.target.result);
            hideLoader();
            showToast('Photo loaded successfully!', 'success');
        };
        img.onerror = () => {
            hideLoader();
            showToast('Invalid or corrupted image file.', 'error');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function generatePhoto() {
    showLoader('Generating passport photo...');
    setTimeout(() => {
        const canvas = getCroppedCanvas();
        if (!canvas) {
            hideLoader();
            showToast('Could not generate photo. Please adjust crop.', 'error');
            return;
        }
        
        state.finalCanvas = canvas;
        const previewArea = document.getElementById('previewArea');
        previewArea.innerHTML = '';
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/jpeg', 0.9);
        previewArea.appendChild(img);
        
        runQualityCheck(canvas, state.size);
        
        document.getElementById('downloadJpgBtn').disabled = false;
        document.getElementById('downloadPngBtn').disabled = false;
        document.getElementById('generateSheetBtn').disabled = false; // Enable sheet generation
        
        hideLoader();
        showToast('Passport photo generated!', 'success');
    }, 100);
}

function resetAll() {
    if (!confirm('Reset all edits and start over?')) return;
    destroyCropper();
    state.originalDataUrl = null;
    state.workingDataUrl = null;
    state.finalCanvas = null;
    
    document.getElementById('uploadSection').classList.remove('hidden');
    document.getElementById('editorSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    document.getElementById('sheetSection').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    document.getElementById('previewArea').innerHTML = 'Generate to see preview';
    document.getElementById('downloadJpgBtn').disabled = true;
    document.getElementById('downloadPngBtn').disabled = true;
    showToast('Tool reset', 'info');
}