document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('biodata-form');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const outputDiv = document.getElementById('biodata-output');
    const biodataPhoto = document.getElementById('biodata-photo');
    const templateCards = document.querySelectorAll('.template-card'); 
    const accentColorSelect = document.getElementById('accent-color-select');
    const backgroundColorSelect = document.getElementById('background-color-select');
    const biodataMantra = document.getElementById('biodata-mantra');
    const rootStyles = document.documentElement.style;
    const hinduSpecificFields = document.querySelectorAll('.hindu-specific');
    
    const inputAreaDiv = document.querySelector('.input-area'); 
    const containerDiv = document.querySelector('.container');

    let currentTemplate = 'hindu-beige';

    // --- 0. INITIAL SETUP & TEMPLATE LOGIC ---

    const defaultPlaceholderSVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220" viewBox="0 0 180 220"><rect width="180" height="220" fill="#e0e0e0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Profile Photo</text></svg>';
    biodataPhoto.src = defaultPlaceholderSVG;
    outputDiv.style.display = 'block';

    function applyTemplate(template) {
        currentTemplate = template;
        templateCards.forEach(card => card.classList.remove('selected'));
        let selectedCard = document.querySelector(`.template-card[data-template="${template}"]`);
        
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const accent = selectedCard.dataset.accent;
            const bg = selectedCard.dataset.bg;
            rootStyles.setProperty('--template-bg', bg);
            rootStyles.setProperty('--template-accent', accent);
            accentColorSelect.value = accent;
            backgroundColorSelect.value = bg;
        }

        if (template.startsWith('hindu')) { // Updated to check for 'hindu'
            biodataMantra.textContent = '॥ श्री गणेशाय नमः ॥';
            // Show Hindu fields
            hinduSpecificFields.forEach(field => field.style.display = 'grid'); 
            document.getElementById('religious').value = 'Hindu';
        } else if (template.startsWith('muslim')) {
            biodataMantra.textContent = 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
            // Hide Hindu fields
            hinduSpecificFields.forEach(field => field.style.display = 'none'); 
            document.getElementById('religious').value = 'Muslim';
        } else {
            biodataMantra.textContent = '॥ BIODATA ॥';
            hinduSpecificFields.forEach(field => field.style.display = 'grid');
            document.getElementById('religious').value = '';
        }
        updateBiodata();
    }

    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            applyTemplate(card.dataset.template);
        });
    });

    accentColorSelect.addEventListener('change', (e) => {
        rootStyles.setProperty('--template-accent', e.target.value);
        updateBiodata(); 
    });

    backgroundColorSelect.addEventListener('change', (e) => {
        rootStyles.setProperty('--template-bg', e.target.value);
        updateBiodata(); 
    });

    applyTemplate(currentTemplate); // Initial template application

    // --- 1. HANDLE IMAGE UPLOAD ---
    document.getElementById('biodata-image').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                biodataPhoto.src = e.target.result; 
            };
            reader.readAsDataURL(file); 
        } else {
            biodataPhoto.src = defaultPlaceholderSVG;
        }
    });

    // --- 2. REAL-TIME BIODATA GENERATOR FUNCTION (Core logic) ---
    const updateBiodata = () => {
        // Collect data from form
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

        // Helper function to create a detail row ONLY if the value is not empty
        const createDetailRow = (label, value) => {
            const trimmedValue = (value || '').trim();
            if (trimmedValue && trimmedValue !== 'Select') { 
                if (label === 'Contact No.') {
                    // Added target="_blank" to ensure the link works
                    return `<div class="detail-row"><span>${label}</span><span>: <a href="tel:${trimmedValue}" target="_blank" style="text-decoration:none; color:inherit;">${trimmedValue}</a></span></div>`;
                }
                return `<div class="detail-row"><span>${label}</span><span>: ${trimmedValue.replace(/\n/g, '<br>')}</span></div>`;
            }
            return '';
        };

        // Format Date and Time
        let dobRow = '';
        const dobValue = data.dob.trim();
        if (dobValue) {
            let formattedDOB = dobValue;
            let formattedTime = "";
            try {
                const dt = new Date(dobValue);
                if (!isNaN(dt.getTime())) { 
                    formattedDOB = dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    // Extract only time if datetime-local format includes it
                    const timePart = dobValue.split('T')[1];
                    if (timePart) {
                        formattedTime = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    } else {
                        formattedTime = ""; // If only date is provided
                    }
                }
            } catch (e) { /* silent fail */ }
            dobRow = `<div class="detail-row"><span>Date of Birth & Time</span><span>: ${formattedDOB}${formattedTime ? `, ${formattedTime}` : ''}</span></div>`;
        }

        // --- Personal Details Output ---
        let personalDetailsHTML = `
            ${createDetailRow('Full Name', data.fullName)}
            ${dobRow}
            ${createDetailRow('Height', data.height)}
            ${createDetailRow('Place of Birth', data.placeOfBirth)}
            ${createDetailRow('Religious', data.religious)}
            ${createDetailRow('Caste/Community', data.caste)}
        `;

        if (document.querySelector('.hindu-specific').style.display !== 'none') {
             personalDetailsHTML += `
                ${createDetailRow('Rashi', data.rashi)}
                ${createDetailRow('Nakshatra', data.nakshatra)}
                ${createDetailRow('Manglik', data.manglik)}
                ${createDetailRow('Gotra', data.gotra)}
            `;
        }

        personalDetailsHTML += `
            ${createDetailRow('Complexion', data.complexion)}
            ${createDetailRow('Blood Group', data.bloodGroup)}
            ${createDetailRow('Higher Education', data.education)}
            ${createDetailRow('Job/Occupation', data.job)}
        `;

        document.getElementById('personal-details-output').innerHTML = personalDetailsHTML;

        // --- Family Details Output ---
        const familyDetailsHTML = `
            ${createDetailRow("Father's Name", data.fatherName)}
            ${createDetailRow("Mother's Name", data.motherName)}
            ${createDetailRow('Siblings (Brother/Sister)', data.siblings)}
        `;
        document.getElementById('family-details-output').innerHTML = familyDetailsHTML;

        // --- Contact Details Output ---
        const contactDetailsHTML = `
            ${createDetailRow('Current Address', data.address)}
            ${createDetailRow('Contact No.', data.contactNo)}
        `;
        document.getElementById('contact-details-output').innerHTML = contactDetailsHTML;
    };

    // <=========================================================================>
    // Event listeners for real-time update
    // <=========================================================================>
    const formInputs = form.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        // Ensures update happens as soon as a key is pressed (input event)
        input.addEventListener('input', updateBiodata);
        // Ensures update happens for select/file/date changes (change event)
        input.addEventListener('change', updateBiodata); 
    });
    // <=========================================================================>
    
    updateBiodata(); // Initial call

    // --- 3. GENERATE BIODATA BUTTON LOGIC (Finalize View) ---
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        // **CRITICAL FIX:** Ensure the final data is rendered before view change
        updateBiodata(); 
        
        // Hide the input area and show the download option
        inputAreaDiv.style.display = 'none'; 
        generateBtn.style.display = 'none';
        downloadBtn.style.display = 'inline-block';
        
        // Center the A4 output
        containerDiv.style.justifyContent = 'center';
        containerDiv.style.maxWidth = '900px'; 
    });

    // --- 4. DOWNLOAD FUNCTIONALITY with html2pdf.js (Working) ---
    downloadBtn.addEventListener('click', () => {
        downloadBtn.style.display = 'none'; // Temporarily hide button
        
        const element = document.getElementById('biodata-output');
        const opt = {
            margin: 10, 
            filename: 'Marriage_Biodata.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 3, 
                useCORS: true, 
                allowTaint: false, 
                logging: true 
            }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
        };

        html2pdf().set(opt).from(element).save().then(() => {
            downloadBtn.style.display = 'inline-block'; // Re-show button
        }).catch(error => {
            downloadBtn.style.display = 'inline-block';
            console.error("PDF generation failed:", error);
            alert("PDF जनरेट करने में कोई समस्या आई है।");
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('biodata-form');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const outputDiv = document.getElementById('biodata-output');
    const biodataPhoto = document.getElementById('biodata-photo');
    const templateCards = document.querySelectorAll('.template-card'); 
    const accentColorSelect = document.getElementById('accent-color-select');
    const backgroundColorSelect = document.getElementById('background-color-select');
    const biodataMantra = document.getElementById('biodata-mantra');
    const rootStyles = document.documentElement.style;
    const hinduSpecificFields = document.querySelectorAll('.hindu-specific');
    
    const inputAreaDiv = document.querySelector('.input-area'); 
    const containerDiv = document.querySelector('.container');

    let currentTemplate = 'hindu-beige';

    // --- 0. INITIAL SETUP & TEMPLATE LOGIC ---

    const defaultPlaceholderSVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220" viewBox="0 0 180 220"><rect width="180" height="220" fill="#e0e0e0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="#666666">Profile Photo</text></svg>';
    biodataPhoto.src = defaultPlaceholderSVG;
    outputDiv.style.display = 'block';

    function applyTemplate(template) {
        currentTemplate = template;
        templateCards.forEach(card => card.classList.remove('selected'));
        let selectedCard = document.querySelector(`.template-card[data-template="${template}"]`);
        
        if (selectedCard) {
            selectedCard.classList.add('selected');
            const accent = selectedCard.dataset.accent;
            const bg = selectedCard.dataset.bg;
            rootStyles.setProperty('--template-bg', bg);
            rootStyles.setProperty('--template-accent', accent);
            accentColorSelect.value = accent;
            backgroundColorSelect.value = bg;
        }

        if (template.startsWith('hindu')) { // Updated to check for 'hindu'
            biodataMantra.textContent = '॥ श्री गणेशाय नमः ॥';
            // Show Hindu fields
            hinduSpecificFields.forEach(field => field.style.display = 'grid'); 
            document.getElementById('religious').value = 'Hindu';
        } else if (template.startsWith('muslim')) {
            biodataMantra.textContent = 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
            // Hide Hindu fields
            hinduSpecificFields.forEach(field => field.style.display = 'none'); 
            document.getElementById('religious').value = 'Muslim';
        } else {
            biodataMantra.textContent = '॥ BIODATA ॥';
            hinduSpecificFields.forEach(field => field.style.display = 'grid');
            document.getElementById('religious').value = '';
        }
        updateBiodata();
    }

    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            applyTemplate(card.dataset.template);
        });
    });

    accentColorSelect.addEventListener('change', (e) => {
        rootStyles.setProperty('--template-accent', e.target.value);
        updateBiodata(); 
    });

    backgroundColorSelect.addEventListener('change', (e) => {
        rootStyles.setProperty('--template-bg', e.target.value);
        updateBiodata(); 
    });

    applyTemplate(currentTemplate); // Initial template application

    // --- 1. HANDLE IMAGE UPLOAD ---
    document.getElementById('biodata-image').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                biodataPhoto.src = e.target.result; 
            };
            reader.readAsDataURL(file); 
        } else {
            biodataPhoto.src = defaultPlaceholderSVG;
        }
    });

    // --- 2. REAL-TIME BIODATA GENERATOR FUNCTION (Core logic) ---
    const updateBiodata = () => {
        // Collect data from form
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

        // Helper function to create a detail row ONLY if the value is not empty
        const createDetailRow = (label, value) => {
            const trimmedValue = (value || '').trim();
            if (trimmedValue && trimmedValue !== 'Select') { 
                if (label === 'Contact No.') {
                    // Added target="_blank" to ensure the link works
                    return `<div class="detail-row"><span>${label}</span><span>: <a href="tel:${trimmedValue}" target="_blank" style="text-decoration:none; color:inherit;">${trimmedValue}</a></span></div>`;
                }
                return `<div class="detail-row"><span>${label}</span><span>: ${trimmedValue.replace(/\n/g, '<br>')}</span></div>`;
            }
            return '';
        };

        // Format Date and Time
        let dobRow = '';
        const dobValue = data.dob.trim();
        if (dobValue) {
            let formattedDOB = dobValue;
            let formattedTime = "";
            try {
                const dt = new Date(dobValue);
                if (!isNaN(dt.getTime())) { 
                    formattedDOB = dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    // Extract only time if datetime-local format includes it
                    const timePart = dobValue.split('T')[1];
                    if (timePart) {
                        formattedTime = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    } else {
                        formattedTime = ""; // If only date is provided
                    }
                }
            } catch (e) { /* silent fail */ }
            dobRow = `<div class="detail-row"><span>Date of Birth & Time</span><span>: ${formattedDOB}${formattedTime ? `, ${formattedTime}` : ''}</span></div>`;
        }

        // --- Personal Details Output ---
        let personalDetailsHTML = `
            ${createDetailRow('Full Name', data.fullName)}
            ${dobRow}
            ${createDetailRow('Height', data.height)}
            ${createDetailRow('Place of Birth', data.placeOfBirth)}
            ${createDetailRow('Religious', data.religious)}
            ${createDetailRow('Caste/Community', data.caste)}
        `;

        if (document.querySelector('.hindu-specific').style.display !== 'none') {
             personalDetailsHTML += `
                ${createDetailRow('Rashi', data.rashi)}
                ${createDetailRow('Nakshatra', data.nakshatra)}
                ${createDetailRow('Manglik', data.manglik)}
                ${createDetailRow('Gotra', data.gotra)}
            `;
        }

        personalDetailsHTML += `
            ${createDetailRow('Complexion', data.complexion)}
            ${createDetailRow('Blood Group', data.bloodGroup)}
            ${createDetailRow('Higher Education', data.education)}
            ${createDetailRow('Job/Occupation', data.job)}
        `;

        document.getElementById('personal-details-output').innerHTML = personalDetailsHTML;

        // --- Family Details Output ---
        const familyDetailsHTML = `
            ${createDetailRow("Father's Name", data.fatherName)}
            ${createDetailRow("Mother's Name", data.motherName)}
            ${createDetailRow('Siblings (Brother/Sister)', data.siblings)}
        `;
        document.getElementById('family-details-output').innerHTML = familyDetailsHTML;

        // --- Contact Details Output ---
        const contactDetailsHTML = `
            ${createDetailRow('Current Address', data.address)}
            ${createDetailRow('Contact No.', data.contactNo)}
        `;
        document.getElementById('contact-details-output').innerHTML = contactDetailsHTML;
    };

    // <=========================================================================>
    // Event listeners for real-time update
    // <=========================================================================>
    const formInputs = form.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        // Ensures update happens as soon as a key is pressed (input event)
        input.addEventListener('input', updateBiodata);
        // Ensures update happens for select/file/date changes (change event)
        input.addEventListener('change', updateBiodata); 
    });
    // <=========================================================================>
    
    updateBiodata(); // Initial call

    // --- 3. GENERATE BIODATA BUTTON LOGIC (Finalize View) ---
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        // **CRITICAL FIX:** Ensure the final data is rendered before view change
        updateBiodata(); 
        
        // Hide the input area and show the download option
        inputAreaDiv.style.display = 'none'; 
        generateBtn.style.display = 'none';
        downloadBtn.style.display = 'inline-block';
        
        // Center the A4 output
        containerDiv.style.justifyContent = 'center';
        containerDiv.style.maxWidth = '900px'; 

        // Add class to hide watermark when biodata is finalized
        containerDiv.classList.add('biodata-finalized');
    });

    // --- 4. DOWNLOAD FUNCTIONALITY with html2pdf.js (Working) ---
    downloadBtn.addEventListener('click', () => {
        downloadBtn.style.display = 'none'; // Temporarily hide button
        
        const element = document.getElementById('biodata-output');
        const opt = {
            margin: 10, 
            filename: 'Marriage_Biodata.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 3, 
                useCORS: true, 
                allowTaint: false, 
                logging: true 
            }, 
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
        };

        html2pdf().set(opt).from(element).save().then(() => {
            downloadBtn.style.display = 'inline-block'; // Re-show button
        }).catch(error => {
            downloadBtn.style.display = 'inline-block';
            console.error("PDF generation failed:", error);
            alert("PDF जनरेट करने में कोई समस्या आई है।");
        });
    });
});
