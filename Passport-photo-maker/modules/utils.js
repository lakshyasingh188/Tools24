export function showLoader(text = 'Processing...') {
    document.getElementById('loaderText').textContent = text;
    document.getElementById('loaderOverlay').classList.remove('hidden');
}

export function hideLoader() {
    document.getElementById('loaderOverlay').classList.add('hidden');
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

export function mmToPx(mm, dpi = 300) {
    return Math.round((mm / 25.4) * dpi);
}

export function unitToMm(val, unit) {
    switch(unit) {
        case 'mm': return val;
        case 'cm': return val * 10;
        case 'inch': return val * 25.4;
        case 'px': return val * (25.4 / 300); // assume 300dpi base for px input
        default: return val;
    }
}