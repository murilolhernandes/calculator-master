export default class RegularCalculator {
  constructor(displayElement) {
    this.displayElement = displayElement;
    this.clear();
    this.setupEventListeners();
  }

  setupEventListeners() {
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

    // Number buttons (0-9, decimal)
    const digitButtons = document.querySelectorAll(".digits");
    if (digitButtons) {
      digitButtons.forEach(button => {
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
          this.chooseOperation(this.mapOperator(button.textContent));
        });
      });
    }

    // Equals button (=)
    const equalsButton = document.querySelector(".equals");
    if (equalsButton) equalsButton.addEventListener("click", () => this.compute());

    // Input event
    if (this.displayElement) {
      this.displayElement.addEventListener("input", (e) => {
        const value = e.target.value.trim();
        // Check for percent symbol
        if (value.endsWith("%")) {
          const num = value.slice(0, -1);
          if (/^-?\d*\.?\d*$/.test(num)) {
            this.currentNumber = num === "" ? "0" : num;
            this.percent();
            this.updateDisplay();
            return;
          }
        }

        // Check if the input contains an operator (e.g., "5`+`3")
        const operatorMatch = value.match(/([-+*x/÷])/); // Match +, −, * or x, / or ÷
        if (operatorMatch) {
          const [prevNum, operator, currNum] = value.split(/([-+*x/÷])/).map(str => str.trim()).filter(Boolean);
          if (prevNum && (currNum === undefined || currNum === "")) {
            // Partial expression ("5+"), wait for next number
            this.previousNumber = prevNum;
            this.operation = operator;
            this.currentNumber = "";
            this.updateDisplay(`${prevNum}${operator}`);
          } else if (prevNum && currNum) {
            // } else if (prevNum && currNum && /^-?\d*\.?\d*$/.test(prevNum) && /^-?\d*\.?\d*$/.test(currNum)) {
            // Complete expression ("5+3")
            this.previousNumber = prevNum;
            this.operation = operator;
            this.currentNumber = currNum;
            this.updateDisplay(`${prevNum}${operator}${currNum}`);
          } else {
            // Invalid format, revert to last valid state
            this.displayElement.value = this.currentNumber;
          }
        } else {
          if (/^-?\d*\.?\d*$/.test(value)) {
            this.currentNumber = value === "" ? "0" : value;
            this.previousNumber = "";
            this.operation = null;
          } else {
            this.displayElement.value = this.currentNumber;
          }
        }
      });

      // Handle Enter key to compute result
      this.displayElement.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.compute();
        }
      });

      // Handle Delete key to clear (AC)
      this.displayElement.addEventListener("keydown", (e) => {
        if (e.key === "Delete") {
          e.preventDefault();
          this.clear();
        }
      });

      // Handle Backspace key to delete last input
      this.displayElement.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          const currentDisplay = this.displayElement.value;
          if (currentDisplay && currentDisplay.length > 0) {
            if (this.currentNumber && this.currentNumber.length > 0) {
              this.currentNumber = this.currentNumber.slice(0, -1) || "";
            } else if (this.operation) {
              // If no current number, remove the operator and revert to previous number
              this.currentNumber = this.previousNumber;
              this.previousNumber = "";
              this.operation = null;
            }
            this.updateDisplay(this.previousNumber || this.currentNumber || "");
          }
        }
      });
    }
  }

  clear() {
    this.currentNumber = "";
    this.previousNumber = "";
    this.operation = null;
    this.updateDisplay();
  }

  updateDisplay(value = this.currentNumber) {
    if (this.displayElement) {
      this.displayElement.value = value;
    }
  }

  appendNumber(number) {
    if (number === "." && this.currentNumber.includes(".")) return;
    if (this.currentNumber === "" && number !== ".") {
      this.currentNumber = number;
    } else {
      this.currentNumber += number;
    }
    if (this.previousNumber && this.operation) {
      this.updateDisplay(`${this.previousNumber}${this.operation}${this.currentNumber}`);
    } else {
      this.updateDisplay();
    }
  }

  chooseOperation(operation) {
    if (this.currentNumber === "") return;
    if (this.previousNumber !== "") {
      this.compute();
    }
    this.operation = this.mapOperator(operation);
    this.previousNumber = this.currentNumber;
    this.currentNumber = "";
    this.updateDisplay(`${this.previousNumber}${operation}`);
  }

  compute() {
    let result;
    const prev = parseFloat(this.previousNumber) || 0;
    const current = parseFloat(this.currentNumber || "0");
    if (isNaN(prev) || isNaN(current)) {
      this.currentNumber = "Error";
      this.updateDisplay();
      return;
    };

    switch (this.operation) {
      case "+":
        result = prev + current;
        break;
      case "-":
        result = prev - current;
        break;
      case "*": case "x":
        result = prev * current;
        break;
      case "/": case "÷":
        if (current === 0) {
          result = "Error: Division by zero";
          break;
        }
        result = prev / current;
        break;
      default:
        console.log(`Unkown operation: ${this.operation}`);
        return;
    }

    this.currentNumber = result.toString();
    this.operation = null;
    this.previousNumber = "";
    this.updateDisplay();
    console.log(result);
  }

  toggleSign() {
    this.currentNumber = (parseFloat(this.currentNumber || "0") * -1).toString();
    this.updateDisplay();
  }

  percent() {
    this.currentNumber = (parseFloat(this.currentNumber || "0") / 100).toString();
    this.updateDisplay();
  }

  mapOperator(operator) {
    const operatorMap = {
      "+": "+",
      "−": "-", // Map Unicode minus to standard minus
      "×": "*", // Map Unicode multiplication to standard multiplication
      "÷": "/", // Map Unicode division to standard division
      "*": "*",
      "x": "x"
    };
    return operatorMap[operator] || operator;
  }
}