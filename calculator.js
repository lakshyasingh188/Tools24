let display = document.getElementById("display");

function appendValue(val) {
    if (display.value === "0") display.value = "";
    if (val === "π") val = Math.PI;
    display.value += val;
}

function addFunction(func) {
    if (func === "^2") {
        display.value += "**2";
    } else {
        display.value += func;
    }
}

function allClear() {
    display.value = "0";
}

function clearLast() {
    display.value = display.value.slice(0, -1);
    if (display.value === "") display.value = "0";
}

function calculate() {
    try {
        let expression = display.value
            .replace(/sin/g, "Math.sin")
            .replace(/cos/g, "Math.cos")
            .replace(/tan/g, "Math.tan")
            .replace(/log/g, "Math.log10")
            .replace(/sqrt/g, "Math.sqrt")
            .replace(/π/g, Math.PI)
            .replace(/e/g, Math.E);

        display.value = eval(expression);
    } catch (error) {
        display.value = "Error";
    }
}
