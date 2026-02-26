function startEditor(style) {
    document.getElementById('selection-page').style.display = 'none';
    document.getElementById('editor-page').style.display = 'block';
    document.getElementById('biodata-canvas').className = 'a4-container ' + style;
}

function updateReligion() {
    const rel = document.getElementById('religion').value;
    const icon = document.getElementById('rel-icon');
    const text = document.getElementById('rel-text');

    if (rel === 'muslim') {
        icon.src = "786.png"; // Yahan 786 ki image ka path dalein
        text.innerText = "|| 786 ||";
    } else {
        icon.src = "ganesh.png"; // Yahan ganesh ji ki image ka path dalein
        text.innerText = "|| SHREE GANESHAYA NAMAH ||";
    }
}

function sync() {
    const fields = ['name', 'dob', 'caste', 'mstatus', 'height', 'bgroup', 'lang', 'tob', 'pob', 'mangal', 'edu', 'occ', 'income', 'fname', 'mname', 'focc', 'contact', 'addr'];
    fields.forEach(id => {
        const val = document.getElementById(id).value;
        document.getElementById('v-' + id).innerText = val;
    });
}

function previewPhoto(event) {
    const reader = new FileReader();
    reader.onload = function() {
        const img = document.getElementById('u-photo');
        img.src = reader.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function downloadPDF() {
    const element = document.getElementById('biodata-canvas');
    // Scale ko 1 pe set karna zaroori hai download ke waqt
    element.style.transform = "scale(1)";
    
    const opt = {
        margin: 0,
        filename: 'Marriage_Biodata.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Download ke baad wapas zoom kam kar dein screen view ke liye
        element.style.transform = "scale(0.48)";
    });
}