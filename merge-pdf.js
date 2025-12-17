document.addEventListener("DOMContentLoaded", () => {

    // STATUS INDICATOR
    for (let i = 1; i <= 10; i++) {
        const input = document.getElementById(`pdf${i}`);
        const status = document.getElementById(`status-pdf${i}`);
        const label = document.querySelector(`label[for="pdf${i}"]`);

        input.addEventListener("change", () => {
            if (input.files.length > 0) {
                status.textContent = "✓ Selected";
                status.classList.add("selected");
                label.classList.add("selected");
            } else {
                status.textContent = "Not Selected";
                status.classList.remove("selected");
                label.classList.remove("selected");
            }
        });
    }

    // MERGE LOGIC
    document.getElementById("mergeBtn").addEventListener("click", async () => {
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            let count = 0;

            for (let i = 1; i <= 10; i++) {
                const input = document.getElementById(`pdf${i}`);
                if (input.files.length > 0) {
                    count++;
                    const bytes = await input.files[0].arrayBuffer();
                    const pdf = await PDFLib.PDFDocument.load(bytes);
                    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    pages.forEach(p => mergedPdf.addPage(p));
                }
            }

            if (count === 0) {
                alert("Please select at least one PDF");
                return;
            }

            const finalBytes = await mergedPdf.save();
            const blob = new Blob([finalBytes], { type: "application/pdf" });

            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "Tools24_Merged.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (err) {
            alert("Merge failed");
            console.error(err);
        }
    });
});
