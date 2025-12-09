// converter.js – Universal File Converter logic
// Supports:
//  - Image (JPG/PNG)  -> PDF / JPG / PNG
//  - Text  (TXT)      -> PDF / TXT

document.addEventListener("DOMContentLoaded", () => {
    const fileInput     = document.getElementById("fileInput");
    const formatSelect  = document.getElementById("formatSelect");
    const convertBtn    = document.getElementById("convertBtn");

    convertBtn.addEventListener("click", async () => {
        const file = fileInput.files[0];
        const targetFormat = formatSelect.value;

        if (!file) {
            alert("कृपया पहले कोई फ़ाइल चुनें।");
            return;
        }

        const mime = file.type; // e.g. "image/jpeg", "text/plain"
        const isImage = mime.startsWith("image/");
        const isText  = mime === "text/plain";

        // PDF target
        if (targetFormat === "PDF") {
            if (isImage) {
                await imageToPDF(file);
            } else if (isText) {
                await textToPDF(file);
            } else {
                alert("सिर्फ JPG, PNG या TXT फ़ाइलों को PDF में बदला जा सकता है।");
            }
            return;
        }

        // TXT target
        if (targetFormat === "TXT") {
            if (isText) {
                // Text as-is download again (basically copy)
                downloadBlob(file, changeExtension(file.name, "txt"));
            } else {
                alert("TXT में केवल टेक्स्ट (TXT) फ़ाइलें convert की जा सकती हैं।");
            }
            return;
        }

        // JPG / PNG target (image only)
        if (targetFormat === "JPG" || targetFormat === "PNG") {
            if (!isImage) {
                alert("JPG/PNG में केवल Image (JPG/PNG) फ़ाइलें convert की जा सकती हैं।");
                return;
            }
            const targetMime = targetFormat === "JPG" ? "image/jpeg" : "image/png";
            await imageToImage(file, targetMime, targetFormat.toLowerCase());
            return;
        }

        alert("Unknown format selected.");
    });
});

// ---------- Helpers ----------

// Change file extension while keeping base name
function changeExtension(filename, newExt) {
    const dotIndex = filename.lastIndexOf(".");
    const base = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
    return `${base}.${newExt}`;
}

// Generic blob downloader
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ---------- Converters ----------

// 1) IMAGE -> PDF
async function imageToPDF(file) {
    const { jsPDF } = window.jspdf;
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // A4 size (pt) – portrait
            const pdf = new jsPDF("p", "pt", "a4");
            const pageWidth  = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Fit image proportionally inside page
            let imgWidth = img.width;
            let imgHeight = img.height;

            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            imgWidth  *= ratio;
            imgHeight *= ratio;

            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
            const pdfBlob = pdf.output("blob");
            downloadBlob(pdfBlob, changeExtension(file.name, "pdf"));
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// 2) TEXT -> PDF
async function textToPDF(file) {
    const { jsPDF } = window.jspdf;
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;

        const pdf = new jsPDF("p", "pt", "a4");
        const margin = 40;
        const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;

        const lines = pdf.splitTextToSize(text, maxWidth);
        let y = margin;

        const lineHeight = 14;
        lines.forEach((line, index) => {
            if (y > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, margin, y);
            y += lineHeight;
        });

        const pdfBlob = pdf.output("blob");
        downloadBlob(pdfBlob, changeExtension(file.name, "pdf"));
    };

    reader.readAsText(file, "utf-8");
}

// 3) IMAGE -> IMAGE (JPG/PNG)
async function imageToImage(file, targetMime, ext) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(function(blob) {
                if (!blob) {
                    alert("Image convert करने में कोई दिक्कत आ गई।");
                    return;
                }
                downloadBlob(blob, changeExtension(file.name, ext));
            }, targetMime, 0.9); // quality 0.9 for JPEG
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}
