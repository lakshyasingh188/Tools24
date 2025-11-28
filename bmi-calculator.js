function calculateBMI() {
    // 1. इनपुट वैल्यू प्राप्त करें
    const heightCm = document.getElementById('height').value;
    const weightKg = document.getElementById('weight').value;
    const resultDiv = document.getElementById('result');

    // 2. इनपुट सत्यापन (Validation)
    if (heightCm <= 0 || weightKg <= 0 || isNaN(heightCm) || isNaN(weightKg)) {
        resultDiv.innerHTML = '⚠️ Please enter valid, positive numbers for height and weight.';
        return;
    }

    // 3. BMI गणना के लिए तैयारी
    // ऊंचाई को सेंटीमीटर (cm) से मीटर (m) में बदलें 
    const heightM = heightCm / 100; 

    // 4. BMI गणना 
    // toFixed(1) का उपयोग परिणाम को एक दशमलव स्थान तक सीमित रखने के लिए किया जाता है
    const bmi = (weightKg / (heightM * heightM)).toFixed(1); 

    // 5. BMI श्रेणी निर्धारित करें
    let category = '';
    let emoji = '';

    if (bmi < 18.5) {
        category = 'Underweight';
        emoji = '😟';
    } else if (bmi >= 18.5 && bmi <= 24.9) {
        category = 'Normal Weight';
        emoji = '😊';
    } else if (bmi >= 25 && bmi <= 29.9) {
        category = 'Overweight';
        emoji = '😬';
    } else {
        category = 'Obesity';
        emoji = '😥';
    }

    // 6. परिणाम प्रदर्शित करें
    resultDiv.innerHTML = `
        <h2>${emoji} Your BMI is: ${bmi}</h2>
        <p>Category: <strong>${category}</strong></p>
    `;
}
