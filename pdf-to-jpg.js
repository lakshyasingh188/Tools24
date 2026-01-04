const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const fileName = document.getElementById("fileName");

let selectedFile = null;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files[0];
  if (selectedFile) {
    fileName.textContent = selectedFile.name;
    convertBtn.classList.add("active");
    convertBtn.disabled = false;
  }
});

convertBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  convertBtn.textContent = "Converting...";

  const reader = new FileReader();
  reader.readAsArrayBuffer(selectedFile);

  reader.onload = async () => {
    const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const imgData = canvas.toDataURL("image/jpeg", 1);

    const link = document.createElement("a");
    link.href = imgData;
    link.download = "tools24-pdf-to-jpg.jpg";
    link.click();

    convertBtn.textContent = "Convert to JPG";
  };
});
