/**
 * =================================================================
 * script.js - Updated JavaScript for CV Maker (Fixes: PDF Page Break, Objective Placeholder, Single Column Download, Default Objective)
 * =================================================================
 */

// 🟢 FIX: Define the Default Career Objective Content 🟢
const defaultCareerObjective = "A highly motivated and enthusiastic individual, eager to learn and grow in the field of web development and technology. I aim to work in a dynamic organization where I can apply my technical knowledge, enhance my skills through continuous learning, and contribute effectively towards achieving the company’s goals. My objective is to build a successful career through dedication, creativity, and consistent performance.";

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
        // Use the CSS variable for consistency if possible, fallback to direct style
        downloadBtn.style.backgroundColor = colorCode; 
    }
}

/**
 * Dynamically adjusts the height of the CV page based on content to minimize gaps.
 */
function adjustCVHeight() {
    const cvOutput = document.getElementById('cv-output-area');
    
    // Check if the current template is a two-column layout (Template 1, 4, 6, 8, 9)
    const isTwoColumn = ['template-style-1', 'template-style-4', 'template-style-6', 'template-style-8', 'template-style-9'].some(cls => cvOutput.classList.contains(cls));

    if (isTwoColumn) {
        const leftCol = cvOutput.querySelector('.left-column');
        const rightCol = cvOutput.querySelector('.right-column');
        
        // Ensure elements exist
        if (!leftCol || !rightCol) return; 

        // Measures the height of both columns (including their padding/borders)
        const leftHeight = leftCol.scrollHeight;
        const rightHeight = rightCol.scrollHeight;
        
        // Sets the height of the CV output as the maximum height
        const newHeight = Math.max(leftHeight, rightHeight);
        
        // Set CV container height (50px buffer for padding)
        cvOutput.style.height = `${newHeight + 50}px`; 
        
        // Template 4 Specific Logic (Sidebar is Right/RightCol, Content is Left/LeftCol)
        if (cvOutput.classList.contains('template-style-4')) {
             // Colored column (Right) should stretch to match Main Content (Left)
             rightCol.style.minHeight = `${leftHeight}px`; 
             leftCol.style.minHeight = `${rightHeight}px`; // Ensure the main content uses full height if sidebar is tall
        } else {
             // Default 2-column logic (Sidebar is Left/LeftCol)
             // Colored column (Left) should stretch to match Main Content (Right)
             leftCol.style.minHeight = `${rightHeight}px`; 
             rightCol.style.minHeight = `${leftHeight}px`;
        }
        
    } else {
        // For single column templates, reset styles for normal flow
        cvOutput.style.height = 'auto';
        const leftCol = cvOutput.querySelector('.left-column');
        const rightCol = cvOutput.querySelector('.right-column');
        if (leftCol) leftCol.style.minHeight = 'auto';
        if (rightCol) rightCol.style.minHeight = 'auto';
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
    
    document.getElementById('cv-name').innerText = name || 'Your Full Name'; // Set default if empty
    
    // --- 2. Profile Photo and Contact Details ---
    const photoDisplay = document.getElementById('photo-display');
    const initialsDisplay = document.getElementById('initials-display');
    const photoInput = document.getElementById('photoInput');

    let initials = '';
    if (name) {
        const parts = name.split(/\s+/).filter(p => p.length > 0); 
        
        if (parts.length >= 2) {
            initials = parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
        } else if (parts.length === 1) {
            initials = parts[0].substring(0, 2).toUpperCase();
        }
    }
    initialsDisplay.innerText = initials;

    const hasPhoto = photoInput.files && photoInput.files[0];

    if (hasPhoto) {
        const reader = new FileReader();
        reader.onload = function(e) {
            photoDisplay.src = e.target.result;
            photoDisplay.style.display = 'block';
            initialsDisplay.style.display = 'none';
        }
        reader.readAsDataURL(photoInput.files[0]);
    } else if (name && initials) {
        photoDisplay.style.display = 'none';
        photoDisplay.src = ''; 
        initialsDisplay.style.display = 'flex'; 
    } else {
        photoDisplay.style.display = 'none';
        initialsDisplay.style.display = 'none';
        photoDisplay.src = '';
    }
    
    // Update and show/hide contact lines
    const updateContactLine = (input, displayId, lineId) => {
        const value = input.trim();
        const lineElement = document.getElementById(lineId);
        
        if (lineElement) {
             if (value) {
                 document.getElementById(displayId).innerText = value;
                 lineElement.style.display = 'flex';
             } else {
                 lineElement.style.display = 'none';
             }
        }
    };
    updateContactLine(address, 'cv-address', 'cv-address-line');
    updateContactLine(phone, 'cv-phone', 'cv-phone-line');
    updateContactLine(email, 'cv-email', 'cv-email-line');

    
    // 3. 🟢 FIX: Career Objective (Default Text Logic) 🟢
    const objectiveInput = document.getElementById('objectiveInput').value.trim();
    const objectiveParagraph = document.getElementById('cv-objective-output'); 
    
    const finalObjective = objectiveInput || defaultCareerObjective;

    if (objectiveParagraph) {
        objectiveParagraph.innerText = finalObjective;
        objectiveParagraph.style.display = 'block'; 
        
        // REMOVE CSS PLACEHOLDER CLASS if it was used before, 
        // since we are now inserting actual text content for the default
        const summarySection = document.getElementById('summary-main-container'); 
        if (summarySection) {
            summarySection.classList.remove('placeholder-active');
        }
    }

    
    // 4. Professional Summary (STATIC CONTENT) - The original logic is now effectively overwritten 
    // by the Objective FIX above, as the Objective section is the main dynamic summary.
    // Keeping this block to ensure no other static element breaks, but its content will likely
    // be rendered *after* the Objective, which now handles both user input and default content.
    const professionalSummaryOutput = document.getElementById('cv-professional-summary-output');
    if (professionalSummaryOutput) {
        // The summary below is a duplicate of the declaration or an old static text.
        // I'm keeping the original text here for safety, but typically a CV has only one Objective/Summary.
        professionalSummaryOutput.innerText = "A dedicated and detail-oriented individual with strong technical and analytical skills. Passionate about learning emerging technologies and applying innovative solutions to real-world challenges. Able to work both independently and collaboratively within a team to achieve organizational goals.";
    }

    
    // 5. Skills list
    const skillsInput = document.getElementById('skillsInput').value.trim();
    const skillsOutput = document.getElementById('cv-skills-output');
    skillsOutput.innerHTML = '';
    
    if (skillsInput) {
        const skillList = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        skillList.forEach(skill => {
            // 💡 FIX: Added class 'list-item-pdf-break' for better multi-page splitting
            skillsOutput.innerHTML += `<li class="list-item-pdf-break">${skill}</li>`; 
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
            // 💡 FIX: Added class 'list-item-pdf-break' for better multi-page splitting
            languagesOutput.innerHTML += `<li class="list-item-pdf-break">${lang}</li>`;
        });
    } else {
        languagesOutput.innerHTML = '<li style="font-size:0.9em; font-style: italic;">No languages added.</li>';
    }


    // 7. Work History - Hide when empty
    const workHistoryInput = document.getElementById('workHistoryInput').value.trim();
    const workHistoryContainer = document.getElementById('work-history-main-container');
    const workHistoryOutput = document.getElementById('cv-work-history-output');

    if (workHistoryInput && workHistoryContainer) {
        workHistoryContainer.style.display = 'block';
        
        // Split input by double new line to create separate job entries
        const jobEntries = workHistoryInput.split(/\n{2,}/)
            .map(e => e.trim())
            .filter(e => e.length > 0);
            
        let jobHTML = '';
        
        jobEntries.forEach(entry => {
            const jobLines = entry.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
                
            if (jobLines.length > 0) {
                // 💡 FIX: Added class 'job-item' to prevent page breaking inside an entry
                jobHTML += `<div class="job-item pdf-break-before"><p><strong>${jobLines[0]}</strong></p><ul class="job-tasks">`;
                for (let i = 1; i < jobLines.length; i++) {
                    jobHTML += `<li class="list-item-pdf-break">${jobLines[i]}</li>`;
                }
                jobHTML += '</ul></div>';
            }
        });
        
        workHistoryOutput.innerHTML = jobHTML;
        
    } else if (workHistoryContainer) {
        workHistoryContainer.style.display = 'none';
    }


    // 8. Education Details
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
        // 💡 FIX: Added class 'pdf-break-before' to prevent page breaking inside an entry
        item.classList.add('edu-item', 'pdf-break-before'); 
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
        declarationOutput.innerHTML = `<p id="cv-summary-para2" class="pdf-break-before">I hereby declare that all the information mentioned above is true and correct to the best of my knowledge and belief. I take full responsibility for the accuracy of the details provided. I assure you that I will carry out my duties with full sincerity, honesty, and commitment if given an opportunity to be a part of your esteemed organization. I am confident that my abilities and enthusiasm will be valuable in contributing to the company’s growth and success.</p>`;
    }

    // =========================================================================
    // 10. TEMPLATE SPECIFIC CONTENT REORDERING (FOR LIVE VIEW)
    // This section is kept as it was in your previous code to ensure live preview works correctly.
    // =========================================================================
    const cvOutput = document.getElementById('cv-output-area');
    const isTemplate4 = cvOutput.classList.contains('template-style-4');
    
    const leftColumn = cvOutput.querySelector('.left-column');
    const rightColumn = cvOutput.querySelector('.right-column');

    if (leftColumn && rightColumn) {
        // Define the content sections
        const profileSection = cvOutput.querySelector('.profile-section');
        const contactSection = cvOutput.querySelector('.contact-section');
        const skillsSection = cvOutput.querySelector('.skills-section-container');
        const languagesSection = cvOutput.querySelector('.extra-section-container');
        
        const summarySection = cvOutput.querySelector('.summary-section');
        const workHistorySection = cvOutput.querySelector('.work-history-section-container');
        const educationSection = cvOutput.querySelector('.education-section-container');
        const declarationSection = cvOutput.querySelector('.declaration-section');
        
        // 1. Clear both columns (keep only the name display if it exists)
        const nameDisplay = cvOutput.querySelector('.name-display');
        const titleDisplay = cvOutput.querySelector('#cv-title-display');
        
        // We need to re-fetch the *live* elements from the DOM after they've been moved around by previous updateCV calls
        const sectionsToMove = [
            profileSection, contactSection, skillsSection, languagesSection,
            summarySection, workHistorySection, educationSection, declarationSection
        ].filter(el => el);

        // Clear and re-append
        leftColumn.innerHTML = '';
        rightColumn.innerHTML = '';
        
        // Re-append sections based on template type
        if (!isTemplate4) { // Default (T1, T6, T8, T9) placement: Sidebar Left, Main Right
            if (nameDisplay) leftColumn.appendChild(nameDisplay);
            if (titleDisplay) leftColumn.appendChild(titleDisplay);

            // Append LEFT content to LEFT Column
            [profileSection, contactSection, skillsSection, languagesSection].forEach(el => el && leftColumn.appendChild(el));
            // Append RIGHT content to RIGHT Column
            [summarySection, workHistorySection, educationSection, declarationSection].forEach(el => el && rightColumn.appendChild(el));

        } else { // T4 placement: Main Left, Sidebar Right
            // Append RIGHT content to LEFT (Main) Column
            if (nameDisplay) leftColumn.appendChild(nameDisplay);
            if (titleDisplay && nameDisplay) nameDisplay.after(titleDisplay);
            
            // Append main content in order
            [summarySection, workHistorySection, educationSection, declarationSection].forEach(el => el && leftColumn.appendChild(el));
            
            // Append LEFT content to RIGHT (Sidebar) Column
            [profileSection, contactSection, skillsSection, languagesSection].forEach(el => el && rightColumn.appendChild(el));
            
            // T4 often starts with Summary right after the name (re-check order)
            if (summarySection && titleDisplay) titleDisplay.after(summarySection);
            else if (summarySection && nameDisplay) nameDisplay.after(summarySection);
        }
    }


    // Dynamic Height Adjustment
    setTimeout(adjustCVHeight, 100); 
}

// Debounced version of updateCV (300ms delay to prevent jumping while typing/selecting)
const debouncedUpdateCV = debounce(updateCV, 300);

/**
 * PDF Generation Function. (CRITICAL FIXES APPLIED)
 *
 * @returns {void}
 */
function prepareAndDownloadPDF() {
    // 1. Ensure live view is up to date
    updateCV(); 

    const element = document.getElementById('cv-output-area');
    const name = document.getElementById('nameInput').value.trim() || 'My_Resume';
    const downloadBtn = document.getElementById('downloadBtn');
    
    downloadBtn.innerText = "Generating PDF...";
    downloadBtn.disabled = true;

    // --- 🟢 CRITICAL FIX FOR SINGLE COLUMN TEMPLATES (2, 3, 5, 7, 10) CONTENT MOVEMENT 🟢 ---
    let tempContainer = null;
    const isSingleColumn = ['template-style-2', 'template-style-3', 'template-style-5', 'template-style-7', 'template-style-10'].some(cls => element.classList.contains(cls));
    
    if (isSingleColumn) {
        const leftColumn = element.querySelector('.left-column');
        const rightColumn = element.querySelector('.right-column');
        
        if (leftColumn && rightColumn) {
            // 1. Create a temporary container for the left column content
            tempContainer = document.createElement('div');
            tempContainer.id = 'temp-left-content';
            tempContainer.className = 'pdf-moved-content'; 

            // Define the sections to be moved from the left column
            const sectionsToMove = [
                leftColumn.querySelector('.profile-section'),
                leftColumn.querySelector('.contact-section'),
                leftColumn.querySelector('.skills-section-container'),
                leftColumn.querySelector('.extra-section-container')
            ].filter(el => el);

            // 2. Move *live* content (not clones) to tempContainer, and then re-append to rightColumn
            sectionsToMove.forEach(section => {
                 // Check if the section is currently a child of the leftColumn before moving
                 if (section && section.parentNode === leftColumn) {
                    // For T2 and T10, profile/contact is usually integrated into the header bar. 
                    // We only move Skills/Languages to prevent duplication in the final PDF flow.
                    if (element.classList.contains('template-style-2') || element.classList.contains('template-style-10')) {
                        if (section.classList.contains('profile-section') || section.classList.contains('contact-section')) {
                            // These sections are already styled/integrated at the top, so we skip moving them.
                            return; 
                        }
                    }
                    tempContainer.appendChild(section); // Move the actual element
                 }
            });

            // 3. Prepend the temporary content to the right column (which becomes the main column)
            if (tempContainer.children.length > 0) {
                 rightColumn.prepend(tempContainer);
                 
                 // Apply temporary styles for PDF separation
                 tempContainer.style.marginBottom = '20px';
                 tempContainer.style.borderBottom = '1px solid #ddd';
                 tempContainer.style.paddingBottom = '15px';
            }
        }
    }
    // --- END OF CRITICAL FIX (Content Movement) ---


    // 2. PDF Settings (UPDATED for better multi-page splitting and reduced margins)
    const opt = {
        // Margin: [top, left, bottom, right] in mm. 5mm margin on all sides.
        margin: [5, 5, 5, 5], 
        filename: `${name.replace(/\s/g, '_')}_CV.pdf`, 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,   
            useCORS: true, 
            scrollY: 0,
            allowTaint: true,
            // Width setting to slightly less than A4 width with 5mm margin
            width: 784,     
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }, 
        // 🟢 FIX: Page Break Logic 🟢
        pagebreak: { 
             mode: 'css', // Use CSS page-break properties (like page-break-inside: avoid)
             // These elements should not be split across two pages
             avoid: ['.job-item', '.edu-item', '.summary-section', '.contact-section', '.edu-item h4', '.pdf-break-before'] 
        }
    };

    // Add CSS class before download (if defined in style.css for specific PDF adjustments)
    element.classList.add('pdf-downloading');

    // 3. Generate and Download
    html2pdf().from(element).set(opt).save().finally(function() {
        // --- CLEANUP AFTER PDF GENERATION ---
        
        // 1. Remove CSS class after download
        element.classList.remove('pdf-downloading');
        
        // 2. 🟢 FIX: Revert the temporary content movement 🟢
        if (tempContainer) {
            // Find the original column the content belonged to (usually leftColumn for two-column, but rightColumn for single-column after logic)
            const leftColumn = element.querySelector('.left-column');
            
            // Move sections back to the left column from the temp container
            // NOTE: We rely on updateCV() at the end to correctly re-order for the template view.
            Array.from(tempContainer.children).forEach(section => {
                 leftColumn.appendChild(section); // Move back to the left column
            });
            
            tempContainer.remove(); // Remove the now-empty temporary container
        }
        
        // 3. Restore button state
        downloadBtn.innerText = "📥 Download PDF";
        downloadBtn.disabled = false;
        alert('Your CV has been downloaded!');
        
        // 4. Re-run updateCV to ensure screen view is correct after cleanup
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
    
    // Set up event listeners for all form changes to trigger debounced update
    const formInputs = document.querySelectorAll('.input-form input, .input-form textarea, .input-form select');
    formInputs.forEach(input => {
        input.addEventListener('input', debouncedUpdateCV);
        input.addEventListener('change', debouncedUpdateCV); // For file and select inputs
    });
    
    document.getElementById('downloadBtn').addEventListener('click', prepareAndDownloadPDF);
});
