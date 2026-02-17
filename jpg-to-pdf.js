let selectedImages = [];
let selectedOrientation = "portrait";

const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const fileSelected = document.getElementById("fileSelected");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadStatus = document.getElementById("downloadStatus");
const orientationBox = document.getElementById("orientationBox");

const fullLoader = document.getElementById("fullLoader");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");

previewContainer.style.display = "none";
orientationBox.style.display = "none";
convertBtn.style.display = "none";

imageInput.addEventListener("change", function(e){

    selectedImages = Array.from(e.target.files);
    if(selectedImages.length === 0) return;

    fileSelected.style.display = "block";
    previewContainer.style.display = "flex";
    orientationBox.style.display = "flex";
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

    updatePreviewLayout();
});

document.querySelectorAll(".option").forEach(option=>{
    option.addEventListener("click", function(){

        document.querySelectorAll(".option").forEach(o=>o.classList.remove("active"));
        this.classList.add("active");

        selectedOrientation = this.dataset.type;
        updatePreviewLayout();
    });
});

function updatePreviewLayout(){

    const pages = document.querySelectorAll(".preview-page");

    pages.forEach(page => {
        if(selectedOrientation === "portrait"){
            page.style.aspectRatio = "1 / 1.414";
        } else {
            page.style.aspectRatio = "1.414 / 1";
        }
    });
}

convertBtn.addEventListener("click", function(){

    fullLoader.style.display = "flex";

    let duration = 20000; // 20 seconds
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
            createPDF();
        }

    }, intervalTime);
});

function createPDF(){

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: selectedOrientation,
        unit: "mm",
        format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    selectedImages.forEach((file, index)=>{

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = function(){

            if(index > 0){
                pdf.addPage();
            }

            pdf.addImage(img, "JPEG", 10, 10, pageWidth-20, pageHeight-20);

            if(index === selectedImages.length - 1){

                setTimeout(()=>{
                    fullLoader.style.display = "none";

                    const pdfBlob = pdf.output("blob");
                    downloadBtn.href = URL.createObjectURL(pdfBlob);
                    downloadBtn.download = "converted.pdf";
                    downloadBtn.style.display = "block";
                },500);
            }
        };
    });
}

downloadBtn.addEventListener("click", function(){
    downloadStatus.style.display = "block";
});
