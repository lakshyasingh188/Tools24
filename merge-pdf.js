const pdfInput1 = document.getElementById("pdfFile1");
const pdfInput2 = document.getElementById("pdfFile2");
const mergeBtn = document.getElementById("mergeBtn");

mergeBtn.addEventListener("click", async () => {
    const file1 = pdfInput1.files[0];
    const file2 = pdfInput2.files[0];

    if (!file1 || !file2) {
        alert("Please select both First PDF and Second PDF.");
        return;
    }

    try {
        const mergedPdf = await PDFLib.PDFDocument.create();

        // Helper: add pages from a file
        const addPdfToMerged = async (file) => {
            const pdfBytes = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        };

        // Order: First then Second
        await addPdfToMerged(file1);
        await addPdfToMerged(file2);

        const finalPdfBytes = await mergedPdf.save();
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "merged.pdf";
        link.click();
    } catch (err) {
        console.error(err);
        alert("Something went wrong while merging the PDFs.");
    }
});

