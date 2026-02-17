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

/* FIRST PAGE CLEAN */
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

    const img = document.createElement("img");
    img.src = URL.createObjectURL(selectedImages[0]);
    previewContainer.appendChild(img);

    updatePreviewLayout();
});

/* ORIENTATION CHANGE */

document.querySelectorAll(".option").forEach(option=>{
    option.addEventListener("click", function(){

        document.querySelectorAll(".option").forEach(o=>o.classList.remove("active"));
        this.classList.add("active");

        selectedOrientation = this.dataset.type;
        updatePreviewLayout();
    });
});

/* UPDATE PREVIEW RATIO */

function updatePreviewLayout(){

    if(selectedOrientation === "portrait"){
        previewContainer.style.aspectRatio = "1 / 1.414";
    } else {
        previewContainer.style.aspectRatio = "1.414 / 1";
    }
}

/* CONVERT */

convertBtn.addEventListener("click", function(){

    fullLoader.style.display = "flex";

    let count = 0;

    const interval = setInterval(()=>{
        count++;
        progress.style.width = count + "%";
        progressText.innerText = count + "%";

        if(count >= 100){
            clearInterval(interval);
            createPDF();
        }
    },200);
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

            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;

            let imgWidth, imgHeight;

            if(imgRatio > pageRatio){
                imgWidth = pageWidth;
                imgHeight = pageWidth / imgRatio;
            } else {
                imgHeight = pageHeight;
                imgWidth = pageHeight * imgRatio;
            }

            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);

            if(index === selectedImages.length - 1){

                fullLoader.style.display = "none";

                const pdfBlob = pdf.output("blob");
                downloadBtn.href = URL.createObjectURL(pdfBlob);
                downloadBtn.download = "converted.pdf";
                downloadBtn.style.display = "block";
            }
        };
    });
}

downloadBtn.addEventListener("click", function(){
    downloadStatus.style.display = "block";
});
