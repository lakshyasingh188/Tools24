let stream = null;
let facingMode = 'user';
let lastCaptureUrl = null;

export function initCamera(handlers) {
    // Listeners are bound in passport-photo.js, but if needed:
}

export async function openCamera() {
    document.getElementById('cameraModal').classList.remove('hidden');
    document.getElementById('useCaptureBtn').disabled = true;
    await startCamera();
}

export async function startCamera() {
    try {
        if (stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        document.getElementById('cameraVideo').srcObject = stream;
    } catch (err) {
        let msg = 'Could not access camera.';
        if (err.name === 'NotAllowedError') msg = 'Camera permission denied.';
        else if (err.name === 'NotFoundError') msg = 'No camera found.';
        showToast(msg, 'error');
        closeCamera();
    }
}

export function switchCamera() {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera();
}

export function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    lastCaptureUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    document.getElementById('useCaptureBtn').disabled = false;
    showToast('Photo captured!', 'success');
}

export function useCapturedPhoto(callback) {
    if (!lastCaptureUrl) return;
    callback(lastCaptureUrl);
    closeCamera();
}

export function closeCamera() {
    document.getElementById('cameraModal').classList.add('hidden');
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
}

// Importing showToast from utils to avoid circular dependencies if needed
import { showToast } from './utils.js';