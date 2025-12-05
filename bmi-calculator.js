document.addEventListener('DOMContentLoaded', () => {
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultDiv = document.getElementById('result');
    const categoryDiv = document.getElementById('category');

    calculateBtn.addEventListener('click', calculateBMI);

    function calculateBMI() {
        categoryDiv.className = 'category-display'; // Reset class for clean display

        const heightCm = parseFloat(heightInput.value);
        const weightKg = parseFloat(weightInput.value);

        // Input Validation
        if (isNaN(heightCm) || heightCm <= 0 || isNaN(weightKg) || weightKg <= 0) {
            resultDiv.textContent = 'Please enter valid Height and Weight values.';
            categoryDiv.textContent = '';
            return;
        }

        // BMI Calculation: BMI = weight (kg) / [height (m)]²
        const heightMeters = heightCm / 100;
        const bmi = weightKg / (heightMeters * heightMeters);
        const roundedBMI = bmi.toFixed(2);

        // Display Result
        resultDiv.textContent = `Your BMI is: ${roundedBMI}`;

        // Determine and Display Category
        let category = '';
        let categoryClass = '';

        if (bmi < 18.5) {
            category = 'Underweight (कम वजन)';
            categoryClass = 'underweight';
        } else if (bmi >= 18.5 && bmi <= 24.9) {
            category = 'Normal Weight (सामान्य वजन)';
            categoryClass = 'normal';
        } else if (bmi >= 25.0 && bmi <= 29.9) {
            category = 'Overweight (अधिक वजन)';
            categoryClass = 'overweight';
        } else {
            category = 'Obesity (मोटापा)';
            categoryClass = 'obese';
        }

        categoryDiv.textContent = `Category: ${category}`;
        categoryDiv.classList.add(categoryClass);
    }
});
