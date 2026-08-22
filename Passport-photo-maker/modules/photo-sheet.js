import { unitToMm } from './utils.js';

export function initSheetMaker(handlers, state) {
    // Listeners handled in passport-photo.js
}

export function generateSheet(handlers, state) {
    if (!state.finalCanvas) {
        handlers.showToast('Generate your passport photo first.', 'error');
        return;
    }

    handlers.showLoader('Creating photo sheet...');
    
    setTimeout(() => {
        const sheetSize = document.getElementById('sheetSize').value;
        const copies = parseInt(document.getElementById('sheetCopies').value);
        const spacing = parseFloat(document.getElementById('sheetSpacing').value) || 0;
        const margin = parseFloat(document.getElementById('sheetMargin').value) || 0;
        const border = document.getElementById('sheetBorder').value;

        const dims = getSheetDimensions(sheetSize);
        const dpi = 96; // Use 96dpi for screen preview canvas
        const sheetW = mmToPx(dims.w, dpi);
        const sheetH = mmToPx(dims.h, dpi);

        const canvas = document.getElementById('sheetCanvas');
        canvas.width = sheetW;
        canvas.height = sheetH;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sheetW, sheetH);

        // Photo size in px
        const photoWmm = unitToMm(state.size.w, state.size.unit);
        const photoHmm = unitToMm(state.size.h, state.size.unit);
        const photoWpx = mmToPx(photoWmm, dpi);
        const photoHpx = mmToPx(photoHmm, dpi);
        const spacingPx = mmToPx(spacing, dpi);
        const marginPx = mmToPx(margin, dpi);

        const usableW = sheetW - marginPx * 2;
        const cols = Math.max(1, Math.floor((usableW + spacingPx) / (photoWpx + spacingPx)));
        const rows = Math.ceil(copies / cols);

        let drawn = 0;
        for (let r = 0; r < rows && drawn < copies; r++) {
            for (let c = 0; c < cols && drawn < copies; c++) {
                const x = marginPx + c * (photoWpx + spacingPx);
                const y = marginPx + r * (photoHpx + spacingPx);
                
                ctx.drawImage(state.finalCanvas, x, y, photoWpx, photoHpx);
                
                if (border === 'solid') {
                    ctx.strokeStyle = '#888';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, photoWpx, photoHpx);
                } else if (border === 'cutmarks') {
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    const cm = 5;
                    ctx.beginPath();
                    // Top-left
                    ctx.moveTo(x - cm, y); ctx.lineTo(x + cm, y);
                    ctx.moveTo(x, y - cm); ctx.lineTo(x, y + cm);
                    // Top-right
                    ctx.moveTo(x + photoWpx - cm, y); ctx.lineTo(x + photoWpx + cm, y);
                    ctx.moveTo(x + photoWpx, y - cm); ctx.lineTo(x + photoWpx, y + cm);
                    // Bottom-left
                    ctx.moveTo(x - cm, y + photoHpx); ctx.lineTo(x + cm, y + photoHpx);
                    ctx.moveTo(x, y + photoHpx - cm); ctx.lineTo(x, y + photoHpx + cm);
                    // Bottom-right
                    ctx.moveTo(x + photoWpx - cm, y + photoHpx); ctx.lineTo(x + photoWpx + cm, y + photoHpx);
                    ctx.moveTo(x + photoWpx, y + photoHpx - cm); ctx.lineTo(x + photoWpx, y + photoHpx + cm);
                    ctx.stroke();
                }
                drawn++;
            }
        }

        handlers.onSheetGenerated(canvas);
        handlers.hideLoader();
        handlers.showToast(`Sheet generated with ${drawn} photos.`, 'success');
    }, 100);
}

function getSheetDimensions(size) {
    switch(size) {
        case 'a4': return { w: 210, h: 297 };
        case 'a5': return { w: 148, h: 210 };
        case 'letter': return { w: 215.9, h: 279.4 };
        default: return { w: 210, h: 297 };
    }
}

function mmToPx(mm, dpi) {
    return Math.round((mm / 25.4) * dpi);
}