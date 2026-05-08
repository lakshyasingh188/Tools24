const paragraphs = [
    "innovation distinguishes between a leader and a follower. stay hungry, stay foolish.",
    "the design is not just what it looks like and feels like. design is how it works.",
    "your time is limited, so do not waste it living someone else's life.",
    "sometimes when you innovate, you make mistakes. it is best to admit them quickly.",
    "the people who are crazy enough to think they can change the world are the ones who do."
];

let timer, timeLeft = 60, maxTime = 60, isStarted = false;
let charIndex = 0, mistakes = 0;

const textDisplay = document.getElementById('text-display');
const inputField = document.getElementById('hidden-input');
const caret = document.getElementById('caret');
const timerEl = document.getElementById('timer');

// 1. Initialize
function loadWords() {
    const text = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    textDisplay.innerHTML = "";
    text.split("").forEach(char => {
        const span = document.createElement('span');
        span.className = 'char';
        span.innerText = char;
        textDisplay.appendChild(span);
    });
    updateCaret();
}

// 2. Typing Engine
inputField.oninput = () => {
    const chars = textDisplay.querySelectorAll('.char');
    const typedChars = inputField.value.split("");

    if (!isStarted && inputField.value.length > 0) {
        isStarted = true;
        timer = setInterval(countDown, 1000);
    }

    chars.forEach((span, index) => {
        const typed = typedChars[index];
        if (typed == null) {
            span.classList.remove('correct', 'wrong');
        } else if (typed === span.innerText) {
            span.classList.add('correct');
            span.classList.remove('wrong');
        } else {
            span.classList.add('wrong');
            span.classList.remove('correct');
        }
    });

    charIndex = inputField.value.length;
    mistakes = textDisplay.querySelectorAll('.wrong').length;

    updateStats();
    updateCaret();

    if (charIndex >= chars.length) finish();
};

// 3. UI Helpers
function updateCaret() {
    const chars = textDisplay.querySelectorAll('.char');
    const target = chars[charIndex] || chars[chars.length - 1];
    const rect = target.getBoundingClientRect();
    const boxRect = document.getElementById('typing-area').getBoundingClientRect();

    const x = rect.left - boxRect.left;
    const y = rect.top - boxRect.top + 5;
    caret.style.transform = `translate(${x}px, ${y}px)`;
}

function updateStats() {
    const timeSpent = maxTime - timeLeft;
    const wpm = timeSpent > 0 ? Math.round(((charIndex - mistakes) / 5) / (timeSpent / 60)) : 0;
    const accuracy = charIndex > 0 ? Math.round(((charIndex - mistakes) / charIndex) * 100) : 100;

    document.getElementById('wpm').innerText = Math.max(0, wpm);
    document.getElementById('accuracy').innerText = accuracy + "%";
}

function countDown() {
    if (timeLeft > 0) {
        timeLeft--;
        timerEl.innerText = timeLeft + "s";
    } else {
        finish();
    }
}

function finish() {
    clearInterval(timer);
    document.getElementById('result-modal').style.display = 'flex';
    document.getElementById('final-wpm').innerText = document.getElementById('wpm').innerText;
    document.getElementById('final-accuracy').innerText = document.getElementById('accuracy').innerText;
}

// 4. Mode Selection Logic
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        maxTime = parseInt(btn.dataset.time);
        resetTest();
    };
});

function resetTest() {
    clearInterval(timer);
    isStarted = false;
    timeLeft = maxTime;
    charIndex = 0;
    mistakes = 0;
    inputField.value = "";
    timerEl.innerText = timeLeft + "s";
    document.getElementById('wpm').innerText = "0";
    document.getElementById('accuracy').innerText = "100%";
    document.getElementById('result-modal').style.display = 'none';
    loadWords();
}

document.getElementById('typing-area').onclick = () => inputField.focus();
document.getElementById('restart-btn').onclick = resetTest;

loadWords();