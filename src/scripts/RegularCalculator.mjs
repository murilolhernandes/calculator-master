export default class RegularCalculator {
  constructor(displayElement) {
    this.displayElement = displayElement;
    this.clear();
    this.setupEventListerners();
  }

  setupEventListerners() {
    // Clear button (AC)
    const clearButton = document.querySelector(".clear");
    if (clearButton) {
      clearButton.addEventListener("click", () => this.clear());
    }

    // Toggle sign (±)
    const plusMinusButton = document.querySelector(".positive-negative");
    if (plusMinusButton) plusMinusButton.addEventListener("click", () => this.toggleSign());

    // Percentage (%)
    const percentageButton = document.querySelector(".percentage");
    if (percentageButton) percentageButton.addEventListener("click", () => this.percent());

    // Number buttons (0-9, decimanl)
    const digitButttons = document.querySelectorAll(".digits");
    if (digitButttons) {
      digitButttons.forEach(button => {
        button.addEventListener("click", () => {
          this.appendNumber(button.textContent);
        });
      });
    }

    // Operators (+, -, *, /)
    const operationButtons = document.querySelectorAll(".divide, .times, .minus, .plus");
    if (operationButtons) {
      operationButtons.forEach(button => {
        button.addEventListener("click", () => {
          this.chooseOperation(button.textContent);
        });
      });
    }

    // Equals button (=)
    const equalsButton = document.querySelector(".equals");
    if (equalsButton) equalsButton.addEventListener("click", () => this.compute());
  }

  clear() {
    this.currentNumber = "0";
    this.previousNumber = "";
    this.operation = null;
    this.updateDisplay();
  }

  updateDisplay() {
    this.displayElement.value = this.currentNumber;
  }

  appendNumber(number) {
    if (number === "." && this.currentNumber.includes(".")) return;
    if (this.currentNumber === "0") {
      this.currentNumber = number === "." ? "0." : number;
    } else {
      this.currentNumber += number;
    }
    this.updateDisplay();
  }

  chooseOperation(operation) {
    if (this.currentNumber === "") return;
    if (this.previousNumber !== "") {
      this.compute();
    }
    this.operation = operation;
    this.previousNumber = this.currentNumber;
    this.currentNumber = "";
    this.updateDisplay();
  }

  compute() {
    let result;
    const prev = parseFloat(this.previousNumber);
    const current = parseFloat(this.currentNumber);
    if (isNaN(prev) || isNaN(current)) return;

    switch (this.operation) {
      case "+":
        result = prev + current;
        break;
      case "-":
        result = prev - current;
        break;
      case "*":
        result = prev * current;
        break;
      case "/":
        result = prev / current;
        break;
      default:
        return;
    }

    this.currentNumber = result.toString();
    this.operation = null;
    this.previousNumber = "";
    this.updateDisplay();
  }

  toggleSign() {
    this.currentNumber = (parseFloat(this.currentNumber) * -1).toString();
    this.updateDisplay();
  }

  percent() {
    this.currentNumber = (parseFloat(this.currentNumber) / 100).toString();
    this.updateDisplay();
  }
}