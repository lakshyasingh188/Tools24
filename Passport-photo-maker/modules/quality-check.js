export function runQualityCheck(canvas, size) {
    const list = document.getElementById('qcList');
    list.innerHTML = '';
    const checks = [];

    const wMm = size.w * (size.unit === 'mm' ? 1 : size.unit === 'cm' ? 10 : size.unit === 'inch' ? 25.4 : 0);
    const hMm = size.h * (size.unit === 'mm' ? 1 : size.unit === 'cm' ? 10 : size.unit === 'inch' ? 25.4 : 0);
    const needW = Math.round((wMm / 25.4) * size.dpi);
    const needH = Math.round((hMm / 25.4) * size.dpi);

    if (canvas.width >= needW * 0.9 && canvas.height >= needH * 0.9) {
        checks.push({ s: 'good', t: `Resolution OK (${canvas.width}×${canvas.height}px)` });
    } else {
        checks.push({ s: 'warn', t: `Low res for ${size.dpi} DPI (Need ~${needW}×${needH}px)` });
    }

    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0, pixels = d.length / 4;
    for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i+1] + d[i+2]) / 3;
    const avg = sum / pixels;

    if (avg < 60) checks.push({ s: 'bad', t: 'Image too dark' });
    else if (avg > 230) checks.push({ s: 'bad', t: 'Image too bright' });
    else checks.push({ s: 'good', t: 'Brightness is good' });

    let varSum = 0;
    for (let i = 0; i < d.length; i += 4) { const v = (d[i]+d[i+1]+d[i+2])/3 - avg; varSum += v*v; }
    if (varSum / pixels < 200) checks.push({ s: 'warn', t: 'Low contrast' });
    else checks.push({ s: 'good', t: 'Contrast is good' });

    checks.forEach(c => {
        const li = document.createElement('li');
        li.className = `qc-${c.s}`;
        li.textContent = c.t;
        list.appendChild(li);
    });
}