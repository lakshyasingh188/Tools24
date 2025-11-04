/**
 * Debounce function: Ensures function isn't called too frequently.
 * @param {function} func - The function to debounce.
 * @param {number} delay - The delay time (in ms).
 */
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

/**
 * Changes the theme color of the CV.
 * @param {string} colorCode - The new color code (e.g., '#004D40').
 */
function changeThemeColor(colorCode) {
    document.documentElement.style.setProperty('--primary-color', colorCode);
    // Also update the button's background color
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.style.backgroundColor = colorCode;
    }
}

/**
 * Dynamically adjusts the height of the CV page based on content to minimize gaps.
 */
function adjustCVHeight() {
    const cvOutput = document.getElementById('cv-output-area');
    
    // Check if the current template is a two-column layout (Template 1, 4, 6, 8, 9)
    // Template 2 is now treated as single-column for height adjustment purposes as per its visual style.
    // NOTE: Template 4 is now logically reversed, but still two-column.
    const isTwoColumn = ['template-style-1', 'template-style-4', 'template-style-6', 'template-style-8', 'template-style-9'].some(cls => cvOutput.classList.contains(cls));

    if (isTwoColumn) {
        const leftCol = cvOutput.querySelector('.left-column');
        const rightCol = cvOutput.querySelector('.right-column');
        
        // Ensure elements exist
        if (!leftCol || !rightCol) return; 

        // Measures the height of both columns
        const leftHeight = leftCol.scrollHeight;
        const rightHeight = rightCol.scrollHeight;
        
        // Sets the height of the CV output as the maximum height
        const newHeight = Math.max(leftHeight, rightHeight);
        
        // Set CV container height (50px buffer for padding)
        cvOutput.style.height = `${newHeight + 50}px`; 
        
        // Set Left column's min-height to equal the Right column's height 
        // This makes the shorter column stretch its background color
        // For T4, this ensures the main content area matches the sidebar height
        // For T1, T6, T8, T9, the left (colored) column needs to stretch.
        
        // Template 4 Specific Logic (Sidebar is Right, Content is Left)
        if (cvOutput.classList.contains('template-style-4')) {
            leftCol.style.minHeight = `${rightHeight}px`; // Main content min-height = Sidebar height
        } else {
            // Default 2-column logic (Sidebar is Left)
            leftCol.style.minHeight = `${rightHeight}px`; // Sidebar min-height = Main content height
        }
        
    } else {
        // For single column templates (Template 2, 3, 5, 7, 10), reset styles for normal flow
        cvOutput.style.height = 'auto';
        const leftCol = cvOutput.querySelector('.left-column');
        if (leftCol) leftCol.style.minHeight = 'auto';
    }
}


/**
 * Fetches data from the form and updates the CV live.
 */
function updateCV() {
    // 0. Update theme color
    const colorPicker = document.getElementById('colorPicker');
    const selectedColor = colorPicker ? colorPicker.value : '#A52A2A'; 
    changeThemeColor(selectedColor);
    
    // 1. Personal Details
    const name = document.getElementById('nameInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const address = document.getElementById('addressInput').value.trim();
    
    document.getElementById('cv-name').innerText = name;
    
    // --- 2. Profile Photo and Contact Details (UPDATED LOGIC) ---
    const photoDisplay = document.getElementById('photo-display');
    const initialsDisplay = document.getElementById('initials-display');
    const photoInput = document.getElementById('photoInput');

    let initials = '';
    if (name) {
        const parts = name.split(/\s+/).filter(p => p.length > 0); // Split by space and filter empty parts
        
        if (parts.length >= 2) {
            // Get the first letter of the first word and the first letter of the second word
            initials = parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
        } else if (parts.length === 1) {
            // If only one word, take the first two characters
            initials = parts[0].substring(0, 2).toUpperCase();
        }
    }
    initialsDisplay.innerText = initials;

    const hasPhoto = photoInput.files && photoInput.files[0];

    if (hasPhoto) {
        // Photo uploaded: Show image, hide initials.
        const reader = new FileReader();
        reader.onload = function(e) {
            photoDisplay.src = e.target.result;
            photoDisplay.style.display = 'block';
            initialsDisplay.style.display = 'none';
        }
        reader.readAsDataURL(photoInput.files[0]);
    } else if (name && initials) {
        // No photo, but name present: Show initials.
        photoDisplay.style.display = 'none';
        photoDisplay.src = ''; // Clear source to ensure no broken icon
        initialsDisplay.style.display = 'flex'; 
    } else {
        // No photo and no name: Hide both.
        photoDisplay.style.display = 'none';
        initialsDisplay.style.display = 'none';
        photoDisplay.src = '';
    }
    // --- END UPDATED LOGIC ---

    
    // Update and show/hide contact lines
    const updateContactLine = (input, displayId, lineId) => {
        const value = input.trim();
        const lineElement = document.getElementById(lineId);
        
        if (value) {
            document.getElementById(displayId).innerText = value;
            lineElement.style.display = 'flex';
        } else {
            lineElement.style.display = 'none';
        }
    };
    updateContactLine(address, 'cv-address', 'cv-address-line');
    updateContactLine(phone, 'cv-phone', 'cv-phone-line');
    updateContactLine(email, 'cv-email', 'cv-email-line');

    
    // 3. Career Objective (Updated Default Text)
    const objectiveInput = document.getElementById('objectiveInput').value.trim();
    const objectiveOutput = document.getElementById('cv-objective-output');
    
    // NEW DEFAULT CAREER OBJECTIVE TEXT
    const defaultObjective = "A highly motivated and enthusiastic individual, eager to learn and grow in the field of web development and technology. I aim to work in a dynamic organization where I can apply my technical knowledge, enhance my skills through continuous learning, and contribute effectively towards achieving the company’s goals. My objective is to build a successful career through dedication, creativity, and consistent performance.";

    objectiveOutput.innerText = objectiveInput || defaultObjective;
    
    // 4. Professional Summary (STATIC CONTENT - as requested)
    const professionalSummaryOutput = document.getElementById('cv-professional-summary-output');
    if (professionalSummaryOutput) {
        // PROFESSIONAL SUMMARY TEXT
        professionalSummaryOutput.innerText = "A dedicated and detail-oriented individual with strong technical and analytical skills. Passionate about learning emerging technologies and applying innovative solutions to real-world challenges. Able to work both independently and collaboratively within a team to achieve organizational goals.";
    }

    
    // 5. Skills list
    const skillsInput = document.getElementById('skillsInput').value.trim();
    const skillsOutput = document.getElementById('cv-skills-output');
    skillsOutput.innerHTML = '';
    
    if (skillsInput) {
        const skillList = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        skillList.forEach(skill => {
            skillsOutput.innerHTML += `<li>${skill}</li>`; 
        });
    } else {
        skillsOutput.innerHTML = '<li style="font-size:0.9em; font-style: italic;">No skills added.</li>';
    }

    // 6. Languages list
    const languagesInput = document.getElementById('languagesInput').value.trim();
    const languagesOutput = document.getElementById('cv-languages-output');
    languagesOutput.innerHTML = '';
    
    if (languagesInput) {
        const langList = languagesInput
            .split(/,|\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0);
            
        langList.forEach(lang => {
            languagesOutput.innerHTML += `<li>${lang}</li>`;
        });
    } else {
        languagesOutput.innerHTML = '<li style="font-size:0.9em; font-style: italic;">No languages added.</li>';
    }


    // 7. Work History - Hide when empty
    const workHistoryInput = document.getElementById('workHistoryInput').value.trim();
    const workHistoryContainer = document.getElementById('work-history-main-container');
    const workHistoryOutput = document.getElementById('cv-work-history-output');

    if (workHistoryInput) {
        workHistoryContainer.style.display = 'block';
        
        // Split input by new line to create list items
        const jobLines = workHistoryInput.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
        let jobHTML = '<div class="job-item"><ul class="job-tasks">';
        
        // Simple heuristic: Treat the first non-empty line as the main job title/summary
        // All subsequent lines are bullet points
        jobLines.forEach((line, index) => {
            if (index === 0) {
                 jobHTML = `<div class="job-item"><p><strong>${line}</strong></p><ul class="job-tasks">`;
            } else {
                jobHTML += `<li>${line}</li>`;
            }
        });

        jobHTML += '</ul></div>';
        workHistoryOutput.innerHTML = jobHTML;
        
    } else {
        workHistoryContainer.style.display = 'none';
    }


    // 8. Education Details - with Passed/Appearing logic
    const bachelorDegree = document.getElementById('bachelorDegree').value.trim();
    const bachelorCollege = document.getElementById('bachelorCollege').value.trim();
    const bachelorPercentage = document.getElementById('bachelorPercentage').value.trim();
    const bachelorDuration = document.getElementById('bachelorDuration').value.trim();
    const bachelorStatus = document.getElementById('bachelorStatus').value; 

    const interSubjects = document.getElementById('interSubjects').value.trim();
    const interBoard = document.getElementById('interBoard').value.trim();
    const interPercentage = document.getElementById('interPercentage').value.trim();
    const interStatus = document.getElementById('interStatus').value; 

    const hscBoard = document.getElementById('hscBoard').value.trim();
    const hscPercentage = document.getElementById('hscPercentage').value.trim();
    const hscStatus = document.getElementById('hscStatus').value; 

    const eduOutput = document.getElementById('cv-education-output');
    eduOutput.innerHTML = ''; 
    let hasEducation = false;

    // Function to create detailed education item
    const createDetailedEduItem = (title, status, lines) => {
        const item = document.createElement('div');
        item.classList.add('edu-item');
        item.innerHTML += `<h4 class="edu-title">${title} <span class="edu-status">(${status})</span></h4>`;
        
        lines.forEach(line => {
            if (line.value) {
                item.innerHTML += `<p class="edu-line"><strong>${line.label}:</strong> ${line.value}</p>`;
            }
        });
        eduOutput.appendChild(item);
    };

    // 1. Bachelor's Degree
    if (bachelorDegree || bachelorCollege || bachelorPercentage) {
        const title = bachelorDegree || "Bachelor's Degree";
        createDetailedEduItem(title, bachelorStatus, [
            { label: "University/College", value: bachelorCollege },
            { label: "Percentage/CGPA", value: bachelorPercentage },
            { label: "Duration", value: bachelorDuration }
        ]);
        hasEducation = true;
    }
    
    // 2. 12th / Intermediate
    if (interBoard || interPercentage || interSubjects) {
        const title = "12th / Intermediate";
        createDetailedEduItem(title, interStatus, [
            { label: "Subjects", value: interSubjects },
            { label: "Board/School", value: interBoard },
            { label: "Percentage/CGPA", value: interPercentage }
        ]);
        hasEducation = true;
    }

    // 3. 10th / Matriculation
    if (hscBoard || hscPercentage) {
        const title = "10th / Matriculation";
        createDetailedEduItem(title, hscStatus, [
            { label: "Board/School", value: hscBoard },
            { label: "Percentage/CGPA", value: hscPercentage }
        ]);
        hasEducation = true;
    }

    if (!hasEducation) {
        eduOutput.innerHTML = '<p style="font-style: italic; color: #888; font-size:0.9em;">No education details added yet. Please fill the form.</p>';
    }
    
    // 9. Declaration (Updated Static Content)
    const declarationOutput = document.getElementById('cv-declaration-output');
    if (declarationOutput) {
             // NEW DECLARATION TEXT
        declarationOutput.innerHTML = `<p id="cv-summary-para2">I hereby declare that all the information mentioned above is true and correct to the best of my knowledge and belief. I take full responsibility for the accuracy of the details provided. I assure you that I will carry out my duties with full sincerity, honesty, and commitment if given an opportunity to be a part of your esteemed organization. I am confident that my abilities and enthusiasm will be valuable in contributing to the company’s growth and success.</p>`;
    }

    // =========================================================================
    // 10. 🎯 TEMPLATE SPECIFIC CONTENT REORDERING (FOR LIVE VIEW) 🎯
    // =========================================================================
    const cvOutput = document.getElementById('cv-output-area');
    const isTemplate4 = cvOutput.classList.contains('template-style-4');
    
    const leftColumn = cvOutput.querySelector('.left-column');
    const rightColumn = cvOutput.querySelector('.right-column');

    // Define the content sections
    const leftContent = [
        cvOutput.querySelector('.profile-section'),
        cvOutput.querySelector('.contact-section'),
        cvOutput.querySelector('.skills-section-container'), // Note: this must wrap skills/languages in HTML
        cvOutput.querySelector('.extra-section-container') // Note: this must wrap languages in HTML
    ];

    const rightContent = [
        cvOutput.querySelector('.summary-section'),
        cvOutput.querySelector('.work-history-section-container'), // Note: this must wrap work history in HTML
        cvOutput.querySelector('.education-section-container'), // Note: this must wrap education in HTML
        cvOutput.querySelector('.declaration-section')
    ];
    
    // --- Revert to default structure first (Template 1, 6, 8, 9) ---
    // Move "Right" content to the Right column, and "Left" content to the Left column
    rightContent.forEach(el => el && rightColumn.appendChild(el));
    leftContent.forEach(el => el && leftColumn.appendChild(el));
    
    // --- TEMPLATE 4 SWAP LOGIC ---
    // If Template 4 is active, swap the children
    if (isTemplate4) {
        // T4 CSS: Left Col = 65% (Main), Right Col = 35% (Sidebar)
        
        // 1. Move Default RIGHT (Main) content to the LEFT (Main) Column
        rightContent.forEach(el => el && leftColumn.appendChild(el));
        
        // 2. Move Default LEFT (Sidebar) content to the RIGHT (Sidebar) Column
        leftContent.forEach(el => el && rightColumn.appendChild(el));
        
        // Special Case: Move Name/Title to Main Content (Left Column) for T4
        const nameDisplay = cvOutput.querySelector('.name-display');
        const titleDisplay = cvOutput.querySelector('#cv-title-display'); // Assuming you have a title/job role element
        
        if (nameDisplay) leftColumn.prepend(nameDisplay);
        if (titleDisplay) leftColumn.querySelector('.name-display').after(titleDisplay);

        // Note: The objective/summary is often placed near the name in the main column in this style.
        // We ensure the summary is the first section after the name/title in the left column.
        const summarySection = cvOutput.querySelector('.summary-section');
        if (summarySection && nameDisplay) {
            nameDisplay.after(summarySection);
        }
    }


    // Dynamic Height Adjustment (Logic to remove white space)
    setTimeout(adjustCVHeight, 100); 
}

// Debounced version of updateCV (300ms delay to prevent jumping while typing/selecting)
const debouncedUpdateCV = debounce(updateCV, 300);

/**
 * PDF Generation Function.
 * FIX: Adds logic to handle single-column templates by moving left-column content to right-column temporarily.
 */
function prepareAndDownloadPDF() {
    updateCV(); 

    const element = document.getElementById('cv-output-area');
    const name = document.getElementById('nameInput').value.trim() || 'My_Resume';
    const downloadBtn = document.getElementById('downloadBtn');
    
    downloadBtn.innerText = "Generating PDF...";
    downloadBtn.disabled = true;

    // --- CRITICAL FIX FOR SINGLE COLUMN TEMPLATES (2, 3, 5, 7, 10) ---
    let tempContainer = null;
    // Template 2 is now considered single-column for PDF generation
    const isSingleColumn = ['template-style-2', 'template-style-3', 'template-style-5', 'template-style-7', 'template-style-10'].some(cls => element.classList.contains(cls));
    
    if (isSingleColumn) {
        const leftColumn = element.querySelector('.left-column');
        const rightColumn = element.querySelector('.right-column');
        
        // 1. Create a temporary container for the left column content
        tempContainer = document.createElement('div');
        tempContainer.id = 'temp-left-content';
        
        // Clone the content we need to move (Skills and Languages are always moved)
        const skillsClone = leftColumn.querySelector('.skills-section-container').cloneNode(true); // FIX: Use container class
        const languagesClone = leftColumn.querySelector('.extra-section-container').cloneNode(true); // FIX: Use container class

        // For T3 (Executive Strip) and T10 (Orange Highlight), Contact/Profile is usually a header or hidden.
        if (element.classList.contains('template-style-3') || element.classList.contains('template-style-10')) {
             // Move only Skills and Languages
             tempContainer.appendChild(skillsClone);
             tempContainer.appendChild(languagesClone);
        } 
        // For T2, T5, T7, move Contact, Skills, and Languages.
        else {
            const contactClone = leftColumn.querySelector('.contact-section').cloneNode(true);
            const profileClone = leftColumn.querySelector('.profile-section').cloneNode(true);
            
            // Add Profile (for T2, T5, T7) and Contact (for all)
            tempContainer.appendChild(profileClone);
            tempContainer.appendChild(contactClone);
            tempContainer.appendChild(skillsClone);
            tempContainer.appendChild(languagesClone);
        }

        // 2. Prepend the temporary content to the right column
        rightColumn.prepend(tempContainer);
        
        // 3. Add separator line after the temporary section
        tempContainer.style.marginBottom = '20px';
        tempContainer.style.borderBottom = '1px solid #ddd';
        tempContainer.style.paddingBottom = '15px';
        
        // 4. Ensure headers are visible/correctly styled for the PDF (especially for T2)
        if (element.classList.contains('template-style-2') || element.classList.contains('template-style-5') || element.classList.contains('template-style-7')) {
             tempContainer.querySelectorAll('h3').forEach(h3 => {
                 h3.style.color = '#000';
                 h3.style.borderBottom = '2px solid var(--primary-color)';
                 h3.style.marginTop = '15px';
             });
             // For Template 2 only: Fix contact item display
             tempContainer.querySelectorAll('.contact-section p').forEach(p => {
                 p.style.color = '#333';
             });
        }
    }
    // --- END OF CRITICAL FIX ---


    // PDF Settings (FIXED to ensure full A4 and no cutting)
    const opt = {
        margin: [10, 10, 10, 10], 
        filename: `${name.replace(/\s/g, '_')}_CV.pdf`, 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,    
            useCORS: true, 
            scrollY: 0,
            allowTaint: true,
            width: 794,      
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, 
        pagebreak: { mode: 'avoid-all' }
    };

    // Add CSS class before download (style.css mein defined hai: .pdf-downloading)
    element.classList.add('pdf-downloading');

    // Generate and Download
    html2pdf().from(element).set(opt).save().finally(function() {
        // --- CLEANUP AFTER PDF GENERATION ---
        
        // 1. Remove CSS class after download
        element.classList.remove('pdf-downloading');
        
        // 2. Remove the temporary content if it was added
        if (tempContainer) {
            tempContainer.remove();
        }
        
        // 3. Restore button state
        downloadBtn.innerText = "📥 Download PDF";
        downloadBtn.disabled = false;
        alert('Your CV has been downloaded!');
        
        // 4. Re-run updateCV to ensure screen view is correct after cleanup
        // This is important because cleanup might affect scroll/height AND REORDERING
        updateCV(); 
    });
}


/*
====================================
 4. TEMPLATE SELECTION LOGIC (Working Fine)
====================================
*/

/**
 * Shows the Template Selection Screen and hides the Builder.
 */
function showTemplateSelector() {
    document.getElementById('template-selector-screen').style.display = 'flex';
    document.getElementById('main-builder-area').style.display = 'none';
    
    if (document.getElementById('cv-output-area').className.includes('template-style-')) {
        document.getElementById('back-to-builder-btn').style.display = 'block';
    }
}

/**
 * Shows the Builder Area (Input Form and CV Preview) and hides the Template Selector.
 */
function showBuilder() {
    document.getElementById('template-selector-screen').style.display = 'none';
    document.getElementById('main-builder-area').style.display = 'flex';
    document.getElementById('back-to-builder-btn').style.display = 'none';
    
    // 🎯 FIX: Remove immediate updateCV call here, it is called after selectTemplate.
    // If we come from 'back-to-builder-btn', updateCV will run inside that handler or by user input.
    // updateCV(); 
}


/**
 * Selects a template, updates the CV, and switches to the builder view.
 * @param {string} templateClass - The new class name for the CV (e.g., 'template-style-2').
 * @param {string} themeColor - The primary color for this template.
 */
function selectTemplate(templateClass, themeColor) {
    const cvOutput = document.getElementById('cv-output-area');
    const colorPicker = document.getElementById('colorPicker');
    
    // 1. Remove all existing template classes
    const currentClasses = Array.from(cvOutput.classList);
    currentClasses.forEach(className => {
        if (className.startsWith('template-style-')) {
            cvOutput.classList.remove(className);
        }
    });

    // 2. Add the new template class
    cvOutput.classList.add(templateClass);
    
    // 3. Update the Theme Color picker and apply the new color
    colorPicker.value = themeColor;
    changeThemeColor(themeColor);
    
    // 4. Switch to the Builder View
    showBuilder(); 
    
    // 5. Update CV with the new style and color (This will now run the reordering logic inside updateCV)
    updateCV();
}


// FIX: Initial DOMContentLoaded logic to ensure the Template Selector screen is shown first.
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with default template (T1) and its color
    // This ensures that the CV area has a default style applied immediately.
    selectTemplate('template-style-1', '#A52A2A');
    
    // FORCEFULLY SHOW THE TEMPLATE SELECTOR SCREEN ON PAGE LOAD
    // NOTE: selectTemplate calls showBuilder(), so we call showTemplateSelector() last to override.
    showTemplateSelector(); 
    
    // No need to call updateCV again, as it's called inside selectTemplate
});
