document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('biodata-form');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');

    const personalOut = document.getElementById('personal-details-output');
    const familyOut = document.getElementById('family-details-output');
    const contactOut = document.getElementById('contact-details-output');

    const biodataPhoto = document.getElementById('biodata-photo');
    const templateCards = Array.from(document.querySelectorAll('.template-card'));
    const accentColorSelect = document.getElementById('accent-color-select');
    const backgroundColorSelect = document.getElementById('background-color-select');
    const biodataMantra = document.getElementById('biodata-mantra');

    // Default template name (matches data-template attribute in HTML)
    let currentTemplate = 'hindu-beige';

    // Safe placeholder SVG
    const rawSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='220'><rect width='180' height='220' fill='%23e0e0e0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23666666'>Profile Photo</text></svg>";
    biodataPhoto.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(rawSvg);

    // Utility: show/hide hindu-specific fields
    function setHinduFieldsVisible(visible) {
        const hinduFields = document.querySelectorAll('.hindu-specific');
        hinduFields.forEach(f => {
            f.style.display = visible ? 'grid' : 'none';
        });
    }

    // Apply the template: set selected UI, set colors, set mantra text and religious value
    function applyTemplate(templateName) {
        currentTemplate = templateName;

        // Deselect all cards, then select the chosen one (if exists)
        templateCards.forEach(card => card.classList.remove('selected'));
        const selectedCard = document.querySelector(`.template-card[data-template="${templateName}"]`);
        if (selectedCard) selectedCard.classList.add('selected');

        // If the card exists and has data attributes, use them; otherwise fallback to CSS vars
        const accent = selectedCard?.dataset?.accent || getComputedStyle(document.documentElement).getPropertyValue('--template-accent') || '#d8572a';
        const bg = selectedCard?.dataset?.bg || getComputedStyle(document.documentElement).getPropertyValue('--template-bg') || '#fff8e1';

        document.documentElement.style.setProperty('--template-accent', accent);
        document.documentElement.style.setProperty('--template-bg', bg);

        // Set selects to reflect chosen card colors (if selects exist)
        if (accentColorSelect) accentColorSelect.value = accent;
        if (backgroundColorSelect) backgroundColorSelect.value = bg;

        // Mantra text and hindu-specific field visibility + religious input
        const religiousInput = document.getElementById('religious');
        if (templateName && templateName.startsWith('hindu')) {
            biodataMantra.textContent = '॥ श्री गणेशाय नमः ॥';
            setHinduFieldsVisible(true);
            if (religiousInput) religiousInput.value = 'Hindu';
        } else if (templateName && templateName.startsWith('muslim')) {
            // When Muslim selected, show Islamic phrase instead of Shri Ganesh
            biodataMantra.textContent = 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
            setHinduFieldsVisible(false);
            if (religiousInput) religiousInput.value = 'Muslim';
        } else {
            biodataMantra.textContent = '॥ BIODATA ॥';
            setHinduFieldsVisible(true);
            if (religiousInput) religiousInput.value = '';
        }

        // Re-render preview so changes appear immediately
        updateBiodata();
    }

    // Attach click handlers to template cards (robust: data-template must exist)
    templateCards.forEach(card => {
        const t = card.dataset && card.dataset.template;
        if (!t) return;
        card.addEventListener('click', () => {
            applyTemplate(t);
        });
    });

    // If user manually changes color selects, update CSS variables and preview
    if (accentColorSelect) {
        accentColorSelect.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--template-accent', e.target.value);
            updateBiodata();
        });
    }
    if (backgroundColorSelect) {
        backgroundColorSelect.addEventListener('change', (e) => {
            document.documentElement.style.setProperty('--template-bg', e.target.value);
            updateBiodata();
        });
    }

    // Image upload handler
    const biodataImageInput = document.getElementById('biodata-image');
    if (biodataImageInput) {
        biodataImageInput.addEventListener('change', (ev) => {
            const file = ev.target.files && ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                biodataPhoto.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Helper: create detail row only when value present
    function createDetailRow(label, value) {
        const v = (value || '').toString().trim();
        if (!v || v === 'Select') return '';
        return `<div class="detail-row"><span>${label}</span><span>: ${v.replace(/\n/g, '<br>')}</span></div>`;
    }

    // Format DOB (if provided) nicely
    function formatDob(dobString) {
        if (!dobString) return '';
        try {
            const d = new Date(dobString);
            if (isNaN(d.getTime())) return '';
            const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timePart = dobString.includes('T') ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
            return `${datePart}${timePart ? ', ' + timePart : ''}`;
        } catch (err) {
            return '';
        }
    }

    // Core: update the preview content on right side
    function updateBiodata() {
        const data = {
            fullName: document.getElementById('full-name')?.value,
            dob: document.getElementById('dob')?.value,
            height: document.getElementById('height')?.value,
            placeOfBirth: document.getElementById('place-of-birth')?.value,
            religious: document.getElementById('religious')?.value,
            caste: document.getElementById('caste')?.value,
            rashi: document.getElementById('rashi')?.value,
            nakshatra: document.getElementById('nakshatra')?.value,
            manglik: document.getElementById('manglik')?.value,
            gotra: document.getElementById('gotra')?.value,
            complexion: document.getElementById('complexion')?.value,
            bloodGroup: document.getElementById('blood-group')?.value,
            education: document.getElementById('education')?.value,
            job: document.getElementById('job')?.value,
            fatherName: document.getElementById('father-name')?.value,
            motherName: document.getElementById('mother-name')?.value,
            siblings: document.getElementById('siblings')?.value,
            address: document.getElementById('address')?.value,
            contactNo: document.getElementById('contact-no')?.value
        };

        const dobFormatted = formatDob(data.dob);
        const dobRow = dobFormatted ? `<div class="detail-row"><span>Date of Birth & Time</span><span>: ${dobFormatted}</span></div>` : '';

        let personalHTML = `
            ${createDetailRow('Full Name', data.fullName)}
            ${dobRow}
            ${createDetailRow('Height', data.height)}
            ${createDetailRow('Place of Birth', data.placeOfBirth)}
            ${createDetailRow('Religious', data.religious)}
            ${createDetailRow('Caste/Community', data.caste)}
        `;

        // Only include Hindu-specific rows when current template is Hindu
        if (currentTemplate && currentTemplate.startsWith('hindu')) {
            personalHTML += `
                ${createDetailRow('Rashi', data.rashi)}
                ${createDetailRow('Nakshatra', data.nakshatra)}
                ${createDetailRow('Manglik', data.manglik)}
                ${createDetailRow('Gotra', data.gotra)}
            `;
        }

        personalHTML += `
            ${createDetailRow('Complexion', data.complexion)}
            ${createDetailRow('Blood Group', data.bloodGroup)}
            ${createDetailRow('Higher Education', data.education)}
            ${createDetailRow('Job/Occupation', data.job)}
        `;

        personalOut.innerHTML = personalHTML;

        familyOut.innerHTML = `
            ${createDetailRow("Father's Name", data.fatherName)}
            ${createDetailRow("Mother's Name", data.motherName)}
            ${createDetailRow('Siblings', data.siblings)}
        `;

        contactOut.innerHTML = `
            ${createDetailRow('Current Address', data.address)}
            ${createDetailRow('Contact No.', data.contactNo)}
        `;
    }

    // Wire up inputs to update preview immediately
    form.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', updateBiodata);
        el.addEventListener('change', updateBiodata);
    });

    // Initialize: apply default template and render
    applyTemplate(currentTemplate);
    updateBiodata();

    // Generate (finalize view) button: hide inputs and show download
    generateBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        updateBiodata();
        const inputArea = document.querySelector('.input-area');
        const watermarkGap = document.querySelector('.watermark-gap');
        if (inputArea) inputArea.style.display = 'none';
        if (watermarkGap) watermarkGap.style.display = 'none';
        generateBtn.style.display = 'none';
        if (downloadBtn) downloadBtn.style.display = 'inline-block';
        document.querySelector('.container')?.classList.add('biodata-finalized');
    });

    // Download PDF using html2pdf
    downloadBtn.addEventListener('click', () => {
        downloadBtn.style.display = 'none';
        const element = document.getElementById('biodata-output');
        const opt = {
            margin: 10,
            filename: 'Marriage_Biodata.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                if (downloadBtn) downloadBtn.style.display = 'inline-block';
            }).catch(err => {
                console.error('PDF generation error:', err);
                if (downloadBtn) downloadBtn.style.display = 'inline-block';
                alert('PDF जनरेट करने में समस्या आई। Console में देखें।');
            });
        }, 250);
    });

});
