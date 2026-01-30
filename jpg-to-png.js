const imageInput = document.getElementById("imageInput");
const statusText = document.getElementById("statusText");
const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");
const previewList = document.getElementById("previewList");
const downloadAllBtn = document.getElementById("downloadAllBtn");

let pngFiles = [];

/* FILE SELECT */
imageInput.addEventListener("change", () => {
  const files = [...imageInput.files];
  if (!files.length) return;

  statusText.textContent = `${files.length} image select ho gayi`;

  setTimeout(() => {
    page1.classList.remove("active");
    page2.classList.add("active");
    convertImages(files);
  }, 500);
});

/* CONVERT JPG → PNG */
function convertImages(files) {
  previewList.innerHTML = "";
  pngFiles = [];

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          pngFiles.push({ url, name: file.name.replace(/\.(jpg|jpeg)$/i,".png") });

          const div = document.createElement("div");
          div.className = "preview-item";
          div.innerHTML = `<img src="${url}">`;
          previewList.appendChild(div);
        }, "image/png");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* DOWNLOAD ALL */
downloadAllBtn.addEventListener("click", () => {
  pngFiles.forEach((file, i) => {
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});
