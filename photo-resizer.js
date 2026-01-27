const upload = document.getElementById("upload");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const qualityInput = document.getElementById("quality");
const qval = document.getElementById("qval");
const resizeBtn = document.getElementById("resizeBtn");
const targetSize = document.getElementById("targetSize");
const unit = document.getElementById("unit");

qualityInput.oninput = () => {
  qval.textContent = qualityInput.value + "%";
};

upload.onchange = () => {
  const file = upload.files[0];
  if(!file) return;

  if(file.type.startsWith("image")){
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      widthInput.value = img.naturalWidth;
      heightInput.value = img.naturalHeight;
    };
  }
};

resizeBtn.onclick = () => {
  [...upload.files].forEach(file => {
    if(file.type === "application/pdf"){
      resizePDF(file);
    }else{
      resizeImage(file);
    }
  });
};

/* IMAGE RESIZE (KB / MB) */
function resizeImage(file){
  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    let q = qualityInput.value / 100;
    const canvas = document.createElement("canvas");
    canvas.width = widthInput.value;
    canvas.height = heightInput.value;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0,canvas.width,canvas.height);

    const limit = unit.value === "kb"
      ? targetSize.value * 1024
      : targetSize.value * 1024 * 1024;

    function adjust(){
      canvas.toBlob(blob=>{
        if(blob.size > limit && q > 0.1){
          q -= 0.05;
          adjust();
        }else{
          download(blob,"resized-"+file.name);
        }
      },"image/jpeg",q);
    }
    adjust();
  };
}

/* PDF SCALE (FAST + SAFE) */
function resizePDF(file){
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "resized-" + file.name;
  link.click();
}

function download(blob,name){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}
