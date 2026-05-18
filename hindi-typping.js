// Sample texts for different languages
const sampleTexts = {
    hindi: "यह एक सरल हिंदी टाइपिंग टेस्ट उपकरण है। आपको स्क्रीन पर दिख रहे शब्दों को सही-सही और तेजी से टाइप करना होगा। अभ्यास से ही आपकी गति और सटीकता में सुधार होगा। अपना सर्वश्रेष्ठ प्रयास करें।",
    english: "The quick brown fox jumps over the lazy dog. Continuous practice is the key to mastering speed and accuracy in touch typing. Keep your eyes on the screen and let your fingers find the keys.",
    spanish: "Este es un examen de mecanografía simple. Debe escribir las palabras que ve en la pantalla de forma rápida y precisa. La práctica constante es la clave para mejorar su velocidad."
};

const languageSelect = document.getElementById('language-select');
const textBox = document.getElementById('text-to-type');
const typingInput = document.getElementById('typing-input');
const startBtn = document.getElementById('start-btn');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');

let timeLeft = 60;
let timer = null;
let isPlaying = false;

// Handle language change
languageSelect.addEventListener('change', (e) => {
    const selectedLang = e.target.value;
    textBox.innerText = sampleTexts[selectedLang];

    // Change placeholders & button texts based on language choice
    if (selectedLang === 'hindi') {
        typingInput.placeholder = "यहाँ टाइप करना शुरू करें...";
        startBtn.innerText = "शुरू करें";
    } else if (selectedLang === 'spanish') {
        typingInput.placeholder = "Comienza a escribir aquí...";
        startBtn.innerText = "Comenzar";
    } else {
        typingInput.placeholder = "Start typing here...";
        startBtn.innerText = "Start Test";
    }
    resetTest();
});

// Initialize Test
startBtn.addEventListener('click', () => {
    if (!isPlaying) {
        startTest();
    } else {
        resetTest();
    }
});

function startTest() {
    isPlaying = true;
    typingInput.disabled = false;
    languageSelect.disabled = true; // Lock language picker during test
    typingInput.value = "";
    typingInput.focus();

    const currentLang = languageSelect.value;
    startBtn.innerText = currentLang === 'hindi' ? "रिसेट करें" : currentLang === 'spanish' ? "Reiniciar" : "Reset";

    timeLeft = 60;
    timerEl.innerText = timeLeft;
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        timerEl.innerText = timeLeft;
        calculateStats();
    } else {
        endTest();
    }
}

typingInput.addEventListener('input', () => {
    calculateStats();
});

function calculateStats() {
    const currentText = textBox.innerText.trim();
    const inputVal = typingInput.value;

    // Calculate Accuracy
    let correctChars = 0;
    for (let i = 0; i < inputVal.length; i++) {
        if (inputVal[i] === currentText[i]) {
            correctChars++;
        }
    }

    const accuracy = inputVal.length > 0 ? Math.round((correctChars / inputVal.length) * 100) : 100;
    accuracyEl.innerText = accuracy;

    // Calculate WPM
    const timeElapsed = (60 - timeLeft) / 60;
    if (timeElapsed > 0) {
        const wpm = Math.round((inputVal.length / 5) / timeElapsed);
        wpmEl.innerText = wpm;
    }
}

function endTest() {
    clearInterval(timer);
    typingInput.disabled = true;
    isPlaying = false;

    const currentLang = languageSelect.value;
    startBtn.innerText = currentLang === 'hindi' ? "फिर से प्रयास करें" : currentLang === 'spanish' ? "Reintentar" : "Retry";

    alert(`Test Finished! WPM: ${wpmEl.innerText} | Accuracy: ${accuracyEl.innerText}%`);
}

function resetTest() {
    clearInterval(timer);
    isPlaying = false;
    typingInput.disabled = true;
    languageSelect.disabled = false; // Unlock language selection
    typingInput.value = "";

    const currentLang = languageSelect.value;
    startBtn.innerText = currentLang === 'hindi' ? "शुरू करें" : currentLang === 'spanish' ? "Comenzar" : "Start Test";

    timerEl.innerText = "60";
    wpmEl.innerText = "0";
    accuracyEl.innerText = "100";
}