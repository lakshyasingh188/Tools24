document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("biodata-form");
    const generateBtn = document.getElementById("generate-btn");
    const downloadBtn = document.getElementById("download-btn");

    const personalOut = document.getElementById("personal-details-output");
    const familyOut = document.getElementById("family-details-output");
    const contactOut = document.getElementById("contact-details-output");

    const biodataPhoto = document.getElementById("biodata-photo");

    const templateCards = document.querySelectorAll(".template-card");

    let currentTemplate = "hindu-beige";

    /* ---------------------------
       Placeholder Photo
    ---------------------------- */
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='220'>
        <rect width='180' height='220' fill='#e0e0e0'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
              font-size='14' fill='#555'>Profile Photo</text>
    </svg>`;

    biodataPhoto.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);


    /* -------------------------------------------
       TEMPLATE APPLY
    ------------------------------------------- */
    function applyTemplate(template) {
        currentTemplate = template;

        templateCards.forEach(card => card.classList.remove("selected"));
        document.querySelector(`[data-template="${template}"]`).classList.add("selected");

        let accent = document.querySelector(`[data-template="${template}"]`).dataset.accent;
        let bg = document.querySelector(`[data-template="${template}"]`).dataset.bg;

        document.documentElement.style.setProperty("--template-accent", accent);
        document.documentElement.style.setProperty("--template-bg", bg);

        updateOutput();
    }


    /* -------------------------------------------
       IMAGE UPLOAD
    ------------------------------------------- */
    document.getElementById("biodata-image").addEventListener("change", e => {
        const file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = a => biodataPhoto.src = a.target.result;
            reader.readAsDataURL(file);
        }
    });


    /* -------------------------------------------
       UPDATE OUTPUT
    ------------------------------------------- */
    function row(label, value) {
        if (!value || value.trim() === "" || value === "Select") return "";
        return `<div class="detail-row">
                    <span>${label}</span>
                    <span>: ${value.replace(/\n/g, "<br>")}</span>
                </div>`;
    }

    function updateOutput() {

        let name = document.getElementById("full-name").value;
        let dob = document.getElementById("dob").value;
        let height = document.getElementById("height").value;
        let pob = document.getElementById("place-of-birth").value;
        let religious = document.getElementById("religious").value;
        let caste = document.getElementById("caste").value;
        let rashi = document.getElementById("rashi").value;
        let nakshatra = document.getElementById("nakshatra").value;
        let manglik = document.getElementById("manglik").value;
        let gotra = document.getElementById("gotra").value;
        let complexion = document.getElementById("complexion").value;
        let blood = document.getElementById("blood-group").value;
        let edu = document.getElementById("education").value;
        let job = document.getElementById("job").value;

        let father = document.getElementById("father-name").value;
        let mother = document.getElementById("mother-name").value;
        let siblings = document.getElementById("siblings").value;

        let address = document.getElementById("address").value;
        let contact = document.getElementById("contact-no").value;

        /* Format DOB */
        let dobText = "";
        if (dob) {
            let d = new Date(dob);
            dobText =
                d.toLocaleDateString("en-GB") +
                " " +
                d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        }

        /* Personal */
        let personalHTML = `
            ${row("Full Name", name)}
            ${row("Date of Birth & Time", dobText)}
            ${row("Height", height)}
            ${row("Place of Birth", pob)}
            ${row("Religious", religious)}
            ${row("Caste/Community", caste)}
        `;

        if (currentTemplate.startsWith("hindu")) {
            personalHTML += `
                ${row("Rashi", rashi)}
                ${row("Nakshatra", nakshatra)}
                ${row("Manglik", manglik)}
                ${row("Gotra", gotra)}
            `;
        }

        personalHTML += `
            ${row("Complexion", complexion)}
            ${row("Blood Group", blood)}
            ${row("Higher Education", edu)}
            ${row("Job/Occupation", job)}
        `;

        personalOut.innerHTML = personalHTML;

        /* Family */
        familyOut.innerHTML = `
            ${row("Father's Name", father)}
            ${row("Mother's Name", mother)}
            ${row("Siblings", siblings)}
        `;

        /* Contact */
        contactOut.innerHTML = `
            ${row("Address", address)}
            ${row("Contact No.", contact)}
        `;
    }


    /* -------------------------------------------
       INPUT LIVE UPDATE
    ------------------------------------------- */
    form.querySelectorAll("input, textarea, select").forEach(input => {
        input.addEventListener("input", updateOutput);
        input.addEventListener("change", updateOutput);
    });

    updateOutput();


    /* -------------------------------------------
       TEMPLATE SELECTION CLICK
    ------------------------------------------- */
    templateCards.forEach(card => {
        card.addEventListener("click", () => {
            applyTemplate(card.dataset.template);
        });
    });


    /* -------------------------------------------
       FINAL VIEW (Generate)
    ------------------------------------------- */
    generateBtn.addEventListener("click", () => {
        updateOutput();

        document.querySelector(".input-area").style.display = "none";
        document.querySelector(".watermark-gap").style.display = "none";

        generateBtn.style.display = "none";
        downloadBtn.style.display = "inline-block";

        document.querySelector(".container").classList.add("biodata-finalized");
    });


    /* -------------------------------------------
       DOWNLOAD PDF
    ------------------------------------------- */
    downloadBtn.addEventListener("click", () => {

        downloadBtn.style.display = "none";

        let element = document.getElementById("biodata-output");

        let opt = {
            margin: 10,
            filename: "Marriage_Biodata.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 3 },
            jsPDF: { unit: "mm", format: "a4" }
        };

        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                downloadBtn.style.display = "inline-block";
            });
        }, 300);
    });

});
