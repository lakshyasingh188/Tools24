let selectedImages = [];

const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const fileSelected = document.getElementById("fileSelected");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadStatus = document.getElementById("downloadStatus");

const fullLoader = document.getElementById("fullLoader");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");

previewContainer.style.display = "none";
convertBtn.style.display = "none";

imageInput.addEventListener("change", function(e){

    selectedImages = Array.from(e.target.files);
    if(selectedImages.length === 0) return;

    fileSelected.style.display = "block";
    previewContainer.style.display = "flex";
    convertBtn.style.display = "block";

    previewContainer.innerHTML = "";

    selectedImages.forEach(file=>{
        const pageDiv = document.createElement("div");
        pageDiv.className = "preview-page";

        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);

        pageDiv.appendChild(img);
        previewContainer.appendChild(pageDiv);
    });
});

convertBtn.addEventListener("click", function(){

    fullLoader.style.display = "flex";

    let duration = 20000;
    let intervalTime = 100;
    let steps = duration / intervalTime;
    let count = 0;

    const interval = setInterval(()=>{

        count++;
        let percent = Math.round((count / steps) * 100);

        progress.style.width = percent + "%";
        progressText.innerText = percent + "%";

        if(percent >= 100){
            clearInterval(interval);
            convertToPNG();
        }

    }, intervalTime);
});

function convertToPNG(){

    const zip = new JSZip();

    selectedImages.forEach((file, index)=>{

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = function(){

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const pngData = canvas.toDataURL("image/png").split(',')[1];

            zip.file("image-" + (index+1) + ".png", pngData, {base64:true});

            if(index === selectedImages.length - 1){

                zip.generateAsync({type:"blob"}).then(function(content){

                    fullLoader.style.display = "none";

                    downloadBtn.href = URL.createObjectURL(content);
                    downloadBtn.download = "converted-images.zip";
                    downloadBtn.style.display = "block";
                });
            }
        };
    });
}

downloadBtn.addEventListener("click", function(){
    downloadStatus.style.display = "block";
});
