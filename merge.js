const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("selectedFiles");
const loading = document.getElementById("loading");
const progress = document.getElementById("progress");
const percent = document.getElementById("percent");
const loadingText = document.getElementById("loadingText");

let files = [];

fileInput.onchange = () => {
  files = [...fileInput.files];
  fileList.innerHTML = "";
  files.forEach(f=>{
    const div = document.createElement("div");
    div.className = "file-item";
    div.innerText = f.name;
    fileList.appendChild(div);
  });
};

async function mergeFiles(){
  if(files.length === 0){
    alert("Please select files first");
    return;
  }

  loading.style.display = "flex";
  progress.style.width = "0%";
  percent.innerText = "0%";

  const pdfDoc = await PDFLib.PDFDocument.create();
  let done = 0;

  for(const file of files){
    const bytes = await file.arrayBuffer();

    if(file.type === "application/pdf"){
      const src = await PDFLib.PDFDocument.load(bytes);
      const pages = await pdfDoc.copyPages(src, src.getPageIndices());
      pages.forEach(p=>pdfDoc.addPage(p));
    }else{
      const img = file.type === "image/png"
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);

      const page = pdfDoc.addPage([img.width,img.height]);
      page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
    }

    done++;
    let p = Math.floor((done / files.length) * 100);
    progress.style.width = p + "%";
    percent.innerText = p + "%";
    loadingText.innerText = "Merging files...";
  }

  const pdfBytes = await pdfDoc.save();
  download(pdfBytes,"TOOLS24_Merged.pdf");
  loading.style.display = "none";
}

function download(data,name){
  const blob = new Blob([data],{type:"application/pdf"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}
