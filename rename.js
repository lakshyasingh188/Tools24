const fileInput = document.getElementById("fileInput");
const firstScreen = document.getElementById("firstScreen");
const workArea = document.getElementById("workArea");
const fileName = document.getElementById("fileName");
const renameBtn = document.getElementById("renameBtn");
const loader = document.getElementById("loader");
const progress = document.getElementById("progress");
const fill = document.getElementById("fill");
const downloadArea = document.getElementById("downloadArea");
const downloadBtn = document.getElementById("downloadBtn");
const tick = document.getElementById("tick");

let selectedFile;
let renamedBlob;

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files[0];
  if (!selectedFile) return;

  firstScreen.classList.add("hidden");
  workArea.classList.remove("hidden");

  fileName.textContent = "File: " + selectedFile.name;
});

renameBtn.addEventListener("click", () => {
  const newName = document.getElementById("newName").value.trim();
  if (!newName) {
    alert("New name enter karo");
    return;
  }

  loader.classList.remove("hidden");
  let count = 0;

  const interval = setInterval(() => {
    count++;
    progress.textContent = count;
    fill.style.width = count + "%";

    if (count >= 100) {
      clearInterval(interval);

      setTimeout(() => {
        const ext = selectedFile.name.split(".").pop();
        renamedBlob = new Blob([selectedFile], { type: selectedFile.type });

        const url = URL.createObjectURL(renamedBlob);
        downloadBtn.href = url;
        downloadBtn.download = `${newName}.${ext}`;

        loader.classList.add("hidden");
        downloadArea.classList.remove("hidden");
      }, 20000 / 100);
    }
  }, 200);
});

downloadBtn.addEventListener("click", () => {
  setTimeout(() => {
    tick.classList.remove("hidden");
  }, 500);
});
