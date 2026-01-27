const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");

const imgInput = document.getElementById("imgFile");
const wmText = document.getElementById("wmText");
const sizeInput = document.getElementById("size");
const opacityInput = document.getElementById("opacity");
const posInput = document.getElementById("pos");
const downloadBtn = document.getElementById("downloadBtn");

let img = new Image();

/* Load image */
imgInput.onchange = e => {
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      cv.width = img.width;
      cv.height = img.height;
      draw();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
};

/* Redraw on change */
[wmText, sizeInput, opacityInput, posInput].forEach(el=>{
  el.oninput = draw;
});

function draw(){
  if(!img.src) return;

  ctx.clearRect(0,0,cv.width,cv.height);
  ctx.drawImage(img,0,0);

  const text = wmText.value;
  if(!text) return;

  const size = +sizeInput.value;
  const opacity = +opacityInput.value;
  const pos = posInput.value;

  ctx.globalAlpha = opacity;
  ctx.fillStyle = "white";
  ctx.font = size + "px Arial";

  const w = ctx.measureText(text).width;
  const pad = 20;
  let x=0,y=0;

  if(pos==="br"){x=cv.width-w-pad; y=cv.height-pad;}
  if(pos==="bl"){x=pad; y=cv.height-pad;}
  if(pos==="tr"){x=cv.width-w-pad; y=size+pad;}
  if(pos==="tl"){x=pad; y=size+pad;}
  if(pos==="c"){x=(cv.width-w)/2; y=cv.height/2;}

  ctx.fillText(text,x,y);
  ctx.globalAlpha = 1;
}

/* Download */
downloadBtn.onclick = ()=>{
  const a=document.createElement("a");
  a.href=cv.toDataURL("image/png");
  a.download="watermark.png";
  a.click();
};
