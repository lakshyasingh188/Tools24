export function downloadImage(canvas, format) {
    if (!canvas) return showToast('Generate photo first.', 'error');
    
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    
    canvas.toBlob((blob) => {
        if (!blob) return showToast('Download failed.', 'error');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tools24-passport-photo.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast(`Downloaded ${ext.toUpperCase()}`, 'success');
    }, mime, 0.95);
}

export function downloadPDF(canvas, size) {
    if (!canvas) return showToast('Generate sheet first.', 'error');
    if (!window.jspdf) return showToast('PDF library not loaded.', 'error');

    const { jsPDF } = window.jspdf;
    const dims = getSheetDims(document.getElementById('sheetSize').value);
    const orientation = dims.w > dims.h ? 'l' : 'p';
    
    const pdf = new jsPDF({ orientation, unit: 'mm', format: [dims.w, dims.h] });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    pdf.addImage(imgData, 'JPEG', 0, 0, dims.w, dims.h);
    pdf.save('tools24-passport-photo-sheet.pdf');
    showToast('PDF downloaded', 'success');
}

export function printSheet() {
    window.print();
}

function getSheetDims(size) {
    switch(size) {
        case 'a4': return { w: 210, h: 297 };
        case 'a5': return { w: 148, h: 210 };
        case 'letter': return { w: 215.9, h: 279.4 };
        default: return { w: 210, h: 297 };
    }
}

import { showToast } from './utils.js';