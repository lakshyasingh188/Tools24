document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('biodata-form');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');

    const personalOut = document.getElementById('personal-details-output');
    const familyOut = document.getElementById('family-details-output');
    const contactOut = document.getElementById('contact-details-output');
    const biodataPhoto = document.getElementById('biodata-photo');
    const templateCards = document.querySelectorAll('.template-card');
    const accentColorSelect = document.getElementById('accent-color-select');
    const backgroundColorSelect = document.getElementById('background-color-select');
    const biodataMantra = document.getElementById('biodata-mantra');

    let currentTemplate = 'hindu-beige';

    // Safe placeholder SVG
    const rawSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='220'><rect width='180' height='220' fill='%23e0e0e0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23666666'>Profile Photo</text></svg>";
    biodataPhoto.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(rawSvg);

    // Apply a template (sets colors, mantra text and hindu-specific field visibility)
    function applyTemplate(template) {
        currentTemplate = template;
        templateCards.forEach(card => card.classList.remove('selected'));
        const selectedCard = document.querySelector(`.template-card[data-template="${template}"]`);
        if (selectedCard) selectedCard.classList.add('selected');

        // set accent & bg
        const accent = selectedCard ? selectedCard.dataset.accent : getComputedStyle(document.documentElement).getPropertyValue('--template-accent');
        const bg = selectedCard ? selectedCard.dataset.bg : getComputedStyle(document.documentElement).getPropertyValue('--template-bg');

        document.documentElement.style.setProperty('--template-accent', accent);
        document.documentElement.style.setProperty('--template-bg', bg);

        // Mantra & hindu fields visibility
        const hinduFields = document.querySelectorAll('.hindu-specific');
        if (template && template.startsWith('hindu')) {
            biodataMantra.textContent = '॥ श्री गणेशाय नमः ॥';
            hinduFields.forEach(f => f.style.display = 'grid');
            const rel = document.getElementById('religious');
            if (rel) rel.value = 'Hindu';
        } else if (template && template.startsWith('muslim')) {
            // Muslim selected -> show Islamic phrase instead of Shri Ganesh
            biodataMantra.textContent = 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
            hinduFields.forEach(f => f.style.display = 'none');
            const rel = document.getElementById('religious');
            if (rel) rel.value = 'Muslim';
        } else {
            biodataMantra.textContent = '॥ BIODATA ॥';
            hinduFields.forEach(f => f.style.display = 'grid');
            const rel = document.getElementById('religious');
            if (rel) rel.value = '';
        }

        // update outputs (so color/mantra reflect immediately)
        updateBiodata();
    }

    // Template card clicks
    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            applyTemplate(card.dataset.template);
        });
    });

    // Accent/background selects
    accentColorSelect.addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--template-accent', e.target.value);
        updateBiodata();
    });
    backgroundColorSelect.addEventListener('change', (e) => {
        document.documentElement.style.setProperty('--template-bg', e.target.value);
        updateBiodata();
    });

    // Image upload
    document.getElementById('biodata-image').addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => biodataPhoto.src = e.target.result;
        reader.readAsDataURL(file);
    });

    // Helper to create row only if value exists
    function createRow(label, value) {
        const v = (value || '').toString().trim();
        if (!v || v === 'Select') return '';
        return `<div class="detail-row"><span>${label}</span><span>: ${v.replace(/\n/g,'<br>')}</span></div>`;
    }

    // Update biodata preview
    function updateBiodata() {
        const data = {
            fullName: document.getElementById('full-name').value,
            dob: document.getElementById('dob').value,
            height: document.getElementById('height').value,
            placeOfBirth: document.getElementById('place-of-birth').value,
            religious: document.getElementById('religious').value,
            caste: document.getElementById('caste').value,
            rashi: document.getElementById('rashi').value,
            nakshatra: document.getElementById('nakshatra').value,
            manglik: document.getElementById('manglik').value,
            gotra: document.getElementById('gotra').value,
            complexion: document.getElementById('complexion').value,
            bloodGroup: document.getElementById('blood-group').value,
            education: document.getElementById('education').value,
            job: document.getElementById('job').value,
            fatherName: document.getElementById('father-name').value,
            motherName: document.getElementById('mother-name').value,
            siblings: document.getElementById('siblings').value,
            address: document.getElementById('address').value,
            contactNo: document.getElementById('contact-no').value,
        };

        // Format DOB if present
        let dobRow = '';
        if (data.dob) {
            try {
                const dt = new Date(data.dob);
                if (!isNaN(dt.getTime())) {
                    const datePart = dt.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });
                    const timePart = dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
                    dobRow = `<div class="detail-row"><span>Date of Birth & Time</span><span>: ${datePart}${timePart ? ', ' + timePart : ''}</span></div>`;
                }
            } catch (e) { /* ignore */ }
        }

        // Personal details
        let personalHTML = `
            ${createRow('Full Name', data.fullName)}
            ${dobRow}
            ${createRow('Height', data.height)}
            ${createRow('Place of Birth', data.placeOfBirth)}
            ${createRow('Religious', data.religious)}
            ${createRow('Caste/Community', data.caste)}
        `;

        if (currentTemplate && currentTemplate.startsWith('hindu')) {
            personalHTML += `
                ${createRow('Rashi', data.rashi)}
                ${createRow('Nakshatra', data.nakshatra)}
                ${createRow('Manglik', data.manglik)}
                ${createRow('Gotra', data.gotra)}
            `;
        }

        personalHTML += `
            ${createRow('Complexion', data.complexion)}
            ${createRow('Blood Group', data.bloodGroup)}
            ${createRow('Higher Education', data.education)}
            ${createRow('Job/Occupation', data.job)}
        `;

        personalOut.innerHTML = personalHTML;

        // Family details
        familyOut.innerHTML = `
            ${createRow("Father's Name", data.fatherName)}
            ${createRow("Mother's Name", data.motherName)}
            ${createRow('Siblings', data.siblings)}
        `;

        // Contact details
        contactOut.innerHTML = `
            ${createRow('Current Address', data.address)}
            ${createRow('Contact No.', data.contactNo)}
        `;
    }

    // Wire up inputs to update
    form.querySelectorAll('input, textarea, select').forEach(i => {
        i.addEventListener('input', updateBiodata);
        i.addEventListener('change', updateBiodata);
    });

    // Initial render
    applyTemplate(currentTemplate);
    updateBiodata();

    // Generate button - hide inputs and show download
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        updateBiodata();

        const inputArea = document.querySelector('.input-area');
        const watermarkGap = document.querySelector('.watermark-gap');
        if (inputArea) inputArea.style.display = 'none';
        if (watermarkGap) watermarkGap.style.display = 'none';

        generateBtn.style.display = 'none';
        if (downloadBtn) downloadBtn.style.display = 'inline-block';

        document.querySelector('.container').classList.add('biodata-finalized');
    });

    // Download PDF using html2pdf
    downloadBtn.addEventListener('click', () => {
        if (!downloadBtn) return;
        downloadBtn.style.display = 'none';

        const element = document.getElementById('biodata-output');
        const opt = {
            margin: 10,
            filename: 'Marriage_Biodata.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // small delay to ensure rendering/styling are applied
        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                if (downloadBtn) downloadBtn.style.display = 'inline-block';
            }).catch(err => {
                console.error('PDF generation error:', err);
                if (downloadBtn) downloadBtn.style.display = 'inline-block';
                alert('PDF जनरेट करने में समस्या आई। (Console में देखें)।');
            });
        }, 250);
    });

});
