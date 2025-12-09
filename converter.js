// converter.js – Universal File Converter logic
// Supports:
//  - Image (JPG/PNG)  -> PDF / JPG / PNG
//  - Text  (TXT)      -> PDF / TXT

// ✅ Button se yahi function call hoga
function handleConvertClick() {
    var fileInput    = document.getElementById("fileInput");
    var formatSelect = document.getElementById("formatSelect");

    var file = fileInput.files[0];
    var targetFormat = formatSelect.value;

    if (!file) {
        alert("कृपया पहले कोई फ़ाइल चुनें।");
        return;
    }

    var mime = file.type;      // e.g. "image/jpeg", "text/plain"
    var isImage = mime.indexOf("image/") === 0;
    var isText  = mime === "text/plain";

    // ---- PDF target ----
    if (targetFormat === "PDF") {
        if (isImage) {
            imageToPDF(file);
        } else if (isText) {
            textToPDF(file);
        } else {
            alert("सिर्फ JPG, PNG या TXT फ़ाइलों को PDF में बदला जा सकता है।");
        }
        return;
    }

    // ---- TXT target ----
    if (targetFormat === "TXT") {
        if (isText) {
            // Same file dubara download (basically copy)
            downloadBlob(file, changeExtension(file.name, "txt"));
        } else {
            alert("TXT में केवल टेक्स्ट (TXT) फ़ाइलें convert की जा सकती हैं।");
        }
        return;
    }

    // ---- JPG / PNG target (image only) ----
    if (targetFormat === "JPG" || targetFormat === "PNG") {
        if (!isImage) {
            alert("JPG/PNG में केवल Image (JPG/PNG) फ़ाइलें convert की जा सकती हैं।");
            return;
        }
        var targetMime = (targetFormat === "JPG") ? "image/jpeg" : "image/png";
        imageToImage(file, targetMime, targetFormat.toLowerCase());
        return;
    }

    alert("Unknown format selected.");
}

// ---------- Helpers ----------

// Change file extension while keeping base name
function changeExtension(filename, newExt) {
    var dotIndex = filename.lastIndexOf(".");
    var base = (dotIndex !== -1) ? filename.substring(0, dotIndex) : filename;
    return base + "." + newExt;
}

// Generic blob downloader
function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a   = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ---------- Converters ----------

// 1) IMAGE -> PDF
function imageToPDF(file) {
    var jsPDFLib = window.jspdf;
    if (!jsPDFLib) {
        alert("PDF लाइब्रेरी लोड नहीं हुई (jsPDF)।");
        return;
    }

    var jsPDF = jsPDFLib.jsPDF;
    var reader = new FileReader();

    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var pdf = new jsPDF("p", "pt", "a4");
            var pageWidth  = pdf.internal.pageSize.getWidth();
            var pageHeight = pdf.internal.pageSize.getHeight();

            var imgWidth = img.width;
            var imgHeight = img.height;

            var ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            imgWidth  = imgWidth * ratio;
            imgHeight = imgHeight * ratio;

            var x = (pageWidth - imgWidth) / 2;
            var y = (pageHeight - imgHeight) / 2;

            pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
            var pdfBlob = pdf.output("blob");
            downloadBlob(pdfBlob, changeExtension(file.name, "pdf"));
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// 2) TEXT -> PDF
function textToPDF(file) {
    var jsPDFLib = window.jspdf;
    if (!jsPDFLib) {
        alert("PDF लाइब्रेरी लोड नहीं हुई (jsPDF)।");
        return;
    }

    var jsPDF = jsPDFLib.jsPDF;
    var reader = new FileReader();

    reader.onload = function(e) {
        var text = e.target.result;

        var pdf = new jsPDF("p", "pt", "a4");
        var margin = 40;
        var maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;

        var lines = pdf.splitTextToSize(text, maxWidth);
        var y = margin;
        var lineHeight = 14;

        for (var i = 0; i < lines.length; i++) {
            if (y > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(lines[i], margin, y);
            y += lineHeight;
        }

        var pdfBlob = pdf.output("blob");
        downloadBlob(pdfBlob, changeExtension(file.name, "pdf"));
    };

    reader.readAsText(file, "utf-8");
}

// 3) IMAGE -> IMAGE (JPG/PNG)
function imageToImage(file, targetMime, ext) {
    var reader = new FileReader();

    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");

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
