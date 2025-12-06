// pdf.js worker setting
pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const fileInput     = document.getElementById("pdfFile");
const compressBtn   = document.getElementById("compressBtn");
const statusText    = document.getElementById("statusText");
const dpiSelect     = document.getElementById("dpiSelect");
const qualitySelect = document.getElementById("qualitySelect");
const colorSelect   = document.getElementById("colorSelect");

// helper: dataURL -> Uint8Array
function dataURLToUint8Array(dataURL) {
    const base64 = dataURL.split(",")[1];
    const raw = atob(base64);
    const uint8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        uint8Array[i] = raw.charCodeAt(i);
    }
    return uint8Array;
}

// 1 hi canvas reuse – speed + kam memory
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

compressBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a PDF file");
        return;
    }

    // options
    let dpi = parseInt(dpiSelect.value, 10);      // 150 / 200 / 300
    const colorMode = colorSelect.value;          // color / grayscale

    let jpegQuality = 0.85;
    if (qualitySelect.value === "medium") jpegQuality = 0.65;
    if (qualitySelect.value === "low")    jpegQuality = 0.45;

    // 72 default PDF DPI, scale control; limit to bachao lag se
    let scale = dpi / 72;
    if (scale > 2) scale = 2;
    if (scale < 1) scale = 1;

    compressBtn.disabled = true;
    statusText.textContent = "Loading PDF...";

    let loadingTask = null;

    try {
        const arrayBuffer = await file.arrayBuffer();

        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const outPdfDoc = await PDFLib.PDFDocument.create();

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            statusText.textContent = `Processing page ${pageNum} of ${pdf.numPages}...`;

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            canvas.width = viewport.width | 0;
            canvas.height = viewport.height | 0;

            // UI ko freeze hone se bachane ke liye
            await new Promise(requestAnimationFrame);

            await page.render({ canvasContext: ctx, viewport }).promise;

            // grayscale mode – sirf jab selected ho
            if (colorMode === "grayscale") {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const v = 0.299 * r + 0.587 * g + 0.114 * b;
                    data[i] = data[i + 1] = data[i + 2] = v;
                }
                ctx.putImageData(imgData, 0, 0);
            }

            const dataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
            const jpgBytes = dataURLToUint8Array(dataUrl);
            const jpgImage = await outPdfDoc.embedJpg(jpgBytes);

            const pageWidth = canvas.width;
            const pageHeight = canvas.height;

            const newPage = outPdfDoc.addPage([pageWidth, pageHeight]);
            newPage.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight
            });
        }

        statusText.textContent = "Creating compressed PDF...";

        const compressedBytes = await outPdfDoc.save();
        const blob = new Blob([compressedBytes], { type: "application/pdf" });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = "compressed.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();

        // memory free
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        statusText.textContent = "Done! Compressed PDF downloaded.";
    } catch (err) {
        console.error(err);
        alert("Something went wrong while compressing the PDF.");
        statusText.textContent = "Error while compressing.";
    } finally {
        if (loadingTask && loadingTask.destroy) {
            loadingTask.destroy();   // worker clean
        }
        compressBtn.disabled = false;
    }
});
