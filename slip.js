document.addEventListener("DOMContentLoaded", function () {
    const earningsBody = document.getElementById("earningsBody");
    const deductionsBody = document.getElementById("deductionsBody");

    const grossEarningsEl = document.getElementById("grossEarnings");
    const totalDeductionsEl = document.getElementById("totalDeductions");
    const netPayableEl = document.getElementById("netPayable");
    const amountInWordsEl = document.getElementById("amountInWords");

    const generateBtn = document.getElementById("generateBtn");
    const payslipPreview = document.getElementById("payslipPreview");

    const printBtn = document.getElementById("printBtn");
    const closePreviewBtn = document.getElementById("closePreviewBtn");

    const addEarningBtn = document.getElementById("addEarningBtn");
    const addDeductionBtn = document.getElementById("addDeductionBtn");

    const logoInput = document.getElementById("companyLogo");
    const logoPreview = document.getElementById("logoPreview");
    let logoDataURL = "";

    // ------- logo upload + preview -------
    document.querySelector(".upload-box").addEventListener("click", () => {
        logoInput.click();
    });

    logoInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            logoDataURL = e.target.result;
            logoPreview.style.backgroundImage = `url(${logoDataURL})`;
        };
        reader.readAsDataURL(file);
    });

    // ------- add rows -------
    addEarningBtn.addEventListener("click", function () {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="text" class="input" placeholder="Description"></td>
            <td><input type="number" class="input earning-amount" value="0"></td>
        `;
        earningsBody.appendChild(tr);
        attachAmountListeners();
    });

    addDeductionBtn.addEventListener("click", function () {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="text" class="input" placeholder="Description"></td>
            <td><input type="number" class="input deduction-amount" value="0"></td>
        `;
        deductionsBody.appendChild(tr);
        attachAmountListeners();
    });

    // ------- calculation -------
    function parseAmount(value) {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    function calculateTotals() {
        let gross = 0;
        document.querySelectorAll(".earning-amount").forEach(input => {
            gross += parseAmount(input.value);
        });

        let deductions = 0;
        document.querySelectorAll(".deduction-amount").forEach(input => {
            deductions += parseAmount(input.value);
        });

        const net = gross - deductions;

        grossEarningsEl.textContent = gross.toFixed(2);
        totalDeductionsEl.textContent = deductions.toFixed(2);
        netPayableEl.textContent = net.toFixed(2);
        amountInWordsEl.textContent = numberToWordsIndian(Math.round(net)) + " Rupees Only";
    }

    function attachAmountListeners() {
        document.querySelectorAll(".earning-amount, .deduction-amount").forEach(input => {
            input.removeEventListener("input", calculateTotals);
            input.addEventListener("input", calculateTotals);
        });
    }

    attachAmountListeners();
    calculateTotals();

    // ------- generate payslip preview -------
    generateBtn.addEventListener("click", function () {
        calculateTotals(); // ensure updated

        // company
        document.getElementById("previewCompanyName").textContent =
            document.getElementById("companyName").value || "Company Name";
        document.getElementById("previewCompanyAddress").textContent =
            combineCompanyAddress();

        const payPeriodTop = document.getElementById("payPeriod").value ||
            formatMonthInput(document.getElementById("payMonth").value);
        document.getElementById("previewPayPeriodTop").textContent = payPeriodTop;

        // logo in preview
        const previewLogo = document.getElementById("previewLogo");
        if (logoDataURL) {
            previewLogo.style.backgroundImage = `url(${logoDataURL})`;
        }

        // employee summary
        document.getElementById("pEmpName").textContent = document.getElementById("empName").value;
        document.getElementById("pEmpId").textContent = document.getElementById("empId").value;
        document.getElementById("pPayPeriod").textContent = payPeriodTop;
        document.getElementById("pPaidDays").textContent = document.getElementById("paidDays").value;
        document.getElementById("pLopDays").textContent = document.getElementById("lopDays").value;
        document.getElementById("pPayDate").textContent = formatDate(document.getElementById("payDate").value);

        // earnings table
        const pEarningsBody = document.getElementById("pEarningsBody");
        pEarningsBody.innerHTML = "";
        earningsBody.querySelectorAll("tr").forEach(row => {
            const desc = row.querySelector("td:nth-child(1) input").value;
            const amt = parseAmount(row.querySelector("td:nth-child(2) input").value).toFixed(2);
            if (desc || amt !== "0.00") {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${desc}</td><td>${amt}</td>`;
                pEarningsBody.appendChild(tr);
            }
        });
        document.getElementById("pGrossEarnings").textContent = grossEarningsEl.textContent;

        // deductions table
        const pDeductionsBody = document.getElementById("pDeductionsBody");
        pDeductionsBody.innerHTML = "";
        deductionsBody.querySelectorAll("tr").forEach(row => {
            const desc = row.querySelector("td:nth-child(1) input").value;
            const amt = parseAmount(row.querySelector("td:nth-child(2) input").value).toFixed(2);
            if (desc || amt !== "0.00") {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${desc}</td><td>${amt}</td>`;
                pDeductionsBody.appendChild(tr);
            }
        });
        document.getElementById("pTotalDeductions").textContent = totalDeductionsEl.textContent;

        // net
        document.getElementById("pNetPayable").textContent = netPayableEl.textContent;
        document.getElementById("pAmountWords").textContent = amountInWordsEl.textContent;

        payslipPreview.classList.remove("hidden");
        payslipPreview.scrollIntoView({ behavior: "smooth" });
    });

    // ------- print & close -------
    printBtn.addEventListener("click", function () {
        window.print();
    });

    closePreviewBtn.addEventListener("click", function () {
        payslipPreview.classList.add("hidden");
    });

    // ------- helpers -------
    function combineCompanyAddress() {
        const addr = document.getElementById("companyAddress").value;
        const city = document.getElementById("companyCity").value;
        const country = document.getElementById("companyCountry").value;
        return [addr, city, country].filter(Boolean).join(", ");
    }

    function formatMonthInput(value) {
        if (!value) return "";
        const [y, m] = value.split("-");
        const date = new Date(parseInt(y), parseInt(m) - 1, 1);
        const monthName = date.toLocaleString("en-IN", { month: "long" });
        return `${monthName} ${y}`;
    }

    function formatDate(value) {
        if (!value) return "";
        const d = new Date(value);
        const day = d.getDate().toString().padStart(2, "0");
        const month = d.toLocaleString("en-IN", { month: "short" });
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    }

    // ---- number to words (Indian system) ----

    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six",
        "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
        "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    function numberToWordsUnder100(num) {
        if (num < 20) return ones[num];
        const t = Math.floor(num / 10);
        const o = num % 10;
        return tens[t] + (o ? " " + ones[o] : "");
    }

    function numberToWordsUnder1000(num) {
        let word = "";
        const h = Math.floor(num / 100);
        const rest = num % 100;
        if (h) {
            word += ones[h] + " Hundred";
            if (rest) word += " and ";
        }
        return word + numberToWordsUnder100(rest);
    }

    function numberToWordsIndian(num) {
        if (num === 0) return "Zero";
        if (num < 0) return "Minus " + numberToWordsIndian(-num);

        let word = "";

        const crore = Math.floor(num / 10000000);
        num %= 10000000;

        const lakh = Math.floor(num / 100000);
        num %= 100000;

        const thousand = Math.floor(num / 1000);
        num %= 1000;

        const hundred = num;

        if (crore) word += numberToWordsUnder100(crore) + " Crore ";
        if (lakh) word += numberToWordsUnder100(lakh) + " Lakh ";
        if (thousand) word += numberToWordsUnder100(thousand) + " Thousand ";
        if (hundred) word += numberToWordsUnder1000(hundred);

        return word.trim();
    }
});
