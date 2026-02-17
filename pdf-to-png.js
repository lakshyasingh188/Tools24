let selectedFile = null;
let pdfDoc = null;

const pdfInput = document.getElementById("pdfInput");
const previewContainer = document.getElementById("previewContainer");
const fileSelected = document.getElementById("fileSelected");
const convertBtn = document.getElementById("convertBtn");
const downloadAll = document.getElementById("downloadAll");
const downloadStatus = document.getElementById("downloadStatus");

const fullLoader = document.getElementById("fullLoader");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");

pdfInput.addEventListener("change", function(e){

    selectedFile = e.target.files[0];
    fileSelected.style.display = "block";

    const reader = new FileReader();

    reader.onload = function(){
        const typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedarray).promise.then(function(pdf){
            pdfDoc = pdf;
            showPreview();
        });
    };

    reader.readAsArrayBuffer(selectedFile);
});

function showPreview(){

    previewContainer.innerHTML = "";
    previewContainer.style.display = "block";
    convertBtn.style.display = "block";

    for(let i=1; i<=pdfDoc.numPages; i++){

        pdfDoc.getPage(i).then(function(page){

            const viewport = page.getViewport({scale:1});
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            page.render({
                canvasContext: context,
                viewport: viewport
            });

            previewContainer.appendChild(canvas);
        });
    }
}

convertBtn.addEventListener("click", function(){

    fullLoader.style.display = "flex";

    let count = 0;

    const interval = setInterval(()=>{
        count++;
        progress.style.width = count + "%";
        progressText.innerText = count + "%";

        if(count >= 100){
            clearInterval(interval);
            convertAllPages();
        }
    },200);
});

function convertAllPages(){

    const zip = new JSZip();
    let completed = 0;

    for(let i=1; i<=pdfDoc.numPages; i++){

        pdfDoc.getPage(i).then(function(page){

            const viewport = page.getViewport({scale:2});
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            page.render({
                canvasContext: context,
                viewport: viewport
            }).promise.then(function(){

                const imgData = canvas.toDataURL("image/png").split(',')[1];
                zip.file("page-" + i + ".png", imgData, {base64:true});

                completed++;

                if(completed === pdfDoc.numPages){

                    zip.generateAsync({type:"blob"}).then(function(content){

                        fullLoader.style.display = "none";

                        downloadAll.href = URL.createObjectURL(content);
                        downloadAll.download = "converted-pages.zip";
                        downloadAll.style.display = "block";
                    });
                }
            });
        });
    }
}

downloadAll.addEventListener("click", function(){
    downloadStatus.style.display = "block";
});
