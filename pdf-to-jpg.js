const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

document.getElementById("convertBtn")
  .addEventListener("click", convertMultiple);

async function convertMultiple(){
  const files = document.getElementById("pdfFile").files;
  const status = document.getElementById("status");

  if(!files.length){
    alert("Please choose PDF files");
    return;
  }

  if(files.length > 10){
    alert("Maximum 10 files allowed");
    return;
  }

  status.innerText = "Converting files...";

  for(let i=0;i<files.length;i++){
    const file = files[i];
    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2.2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({canvasContext:ctx,viewport}).promise;

    const jpg = canvas.toDataURL("image/jpeg",0.95);

    const link = document.createElement("a");
    link.href = jpg;
    link.download = file.name.replace(".pdf","") + ".jpg";
    link.click();
  }

  status.innerText = "✅ All JPG files downloaded";
}
