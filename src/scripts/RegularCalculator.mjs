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
    if (percentageButton) percentageButton.addEventListener("click", () => {
      this.percent();
      this.displayElement.value = this._getDisplayString();
    });

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
          this.chooseOperation(button.textContent); // Pass the display symbol
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

        // Handle simple percent input "N%" (no operators involved)
        if (!value.match(/([-+*x/÷])/) && value.endsWith("%") && value.length > 1) {
          const numPart = value.slice(0, -1);
          if (this._isValidPartialNumeric(numPart)) {
            this.currentNumber = numPart === "" ? "0" : numPart;
            this.previousNumber = "";
            this.operation = null;
            this.percent(); // Applies to this.currentNumber
            this.displayElement.value = this._getDisplayString(); // Update display
            return;
          }
        }

        const parts = value.split(/([-+*x/÷\u2212])/).map(str => str.trim()).filter(Boolean);

        if (value === "" && parts.length === 0) {
          this.clear();
          return;
        }

        // Case: N1 op1 N2 op2 (e.g., "5*5+" or "5*5x")
        if (parts.length === 4) {
          const [pNum, op1, cNum, op2] = parts;
          if (this._isValidNumeric(pNum) && this._isValidOperatorSymbol(op1) &&
            this._isValidNumeric(cNum) && this._isValidOperatorSymbol(op2)) {
            this.previousNumber = pNum;
            this.operation = this.mapOperator(op1);
            this.currentNumber = cNum;
            this.compute(); // Result is in this.currentNumber

            this.previousNumber = this.currentNumber; // Result becomes new previous number
            this.operation = this.mapOperator(op2);    // Set new operation
            this.currentNumber = "";                 // Clear current number for next input
            this.displayElement.value = this._getDisplayString(); // Update display
            return;
          }
        }

        // Case: N1 op N2 (e.g., "5*5" or "5+3.2")
        if (parts.length === 3) {
          const [pNum, op, cNum] = parts;
          if (this._isValidNumeric(pNum) && this._isValidOperatorSymbol(op) && this._isValidPartialNumeric(cNum)) {
            this.previousNumber = pNum;
            this.operation = this.mapOperator(op);
            this.currentNumber = cNum;
            this.displayElement.value = this._getDisplayString(); // Update display
            return;
          }
        }

        // Case: N1 op (e.g., "5*" or "5+")
        if (parts.length === 2) {
          const [pNum, op] = parts;
          if (this._isValidNumeric(pNum) && this._isValidOperatorSymbol(op)) {
            this.previousNumber = pNum;
            this.operation = this.mapOperator(op);
            this.currentNumber = "";
            this.displayElement.value = this._getDisplayString(); // Update display
            return;
          }
        }

        // Case: N1 (e.g., "5" or "12.3" or "-")
        if (parts.length === 1) {
          const num = parts[0];
          if (this._isValidPartialNumeric(num)) {
            this.currentNumber = num;
            this.previousNumber = "";
            this.operation = null;
            this.displayElement.value = this._getDisplayString(); // Update display
            return;
          }
        }

        // If none of the above valid patterns matched, revert the display
        // to the last known valid state representation.
        // This check prevents the input field from staying in an invalid state if user types "abc" or "5++"
        if (this.displayElement.value !== this._getDisplayString()) {
          this.displayElement.value = this._getDisplayString();
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
          // Cleaner backspace: modify display and dispatch input event
          // to let the main input parser handle the new state.
          e.preventDefault();
          let displayVal = this.displayElement.value;
          if (displayVal.length > 0) {
            this.displayElement.value = displayVal.slice(0, -1);
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            this.displayElement.dispatchEvent(inputEvent);
          }
        }
      });
    }
  }

  // Helper to get the string representation of the current state for display
  _getDisplayString() {
    if (this.operation) {
      const canonicalToDisplayMap = { // Map canonical to preferred display
        '+': '+',
        '-': '−', // Unicode minus
        '*': '*', 
        '/': '÷', // Unicode division
        'x': 'x'  // 'x' for multiplication, displays as 'x'
      };
      let opToDisplay = canonicalToDisplayMap[this.operation] || this.operation;
      return `${this.previousNumber || ""}${opToDisplay}${this.currentNumber || ""}`;
    }
    // If no operation, display currentNumber.
    // If currentNumber is empty (e.g. after clear), display "".
    return this.currentNumber || "";
  }

  clear() {
    this.currentNumber = "";
    this.previousNumber = "";
    this.operation = null;
    this.updateDisplay(""); // Explicitly clear display to empty string
  }

  updateDisplay(value = this.currentNumber) {
    if (this.displayElement) {
      this.displayElement.value = value;
    }
  }

  appendNumber(number) {
    if (number === "." && this.currentNumber.includes(".")) return;

    // Explicitly handle starting a number when currentNumber is empty or just "-"
    if (this.currentNumber === "" && number !== ".") { // Starting a new number
      this.currentNumber = number;
    } else if (this.currentNumber === "-" && number === ".") { // Input is "-."
      this.currentNumber += number; // Becomes "-."
    } else if (this.currentNumber === "-" && number !== ".") { // Input is "-<digit>"
      this.currentNumber += number;
    } else { // Appending to an existing number (e.g., "123" + "4", or "-5" + "6")
      this.currentNumber += number;
    }

    if (this.previousNumber && this.operation) { // Display shows full expression
      this.displayElement.value = this._getDisplayString();
    } else {
      this.updateDisplay(this.currentNumber);
    }
  }

  chooseOperation(displayOpSymbol) { // Receives the symbol from the button e.g. "×", "÷"
    // Handle edge case: if currentNumber is just "-", treat it as "0" before proceeding with an operation.
    if (this.currentNumber === "-") {
      this.currentNumber = "0";
    }

    // Allow the minus operator to be the first input when the calculator is empty,
    // treating it as the start of a negative number.
    if (this.currentNumber === "" && this.previousNumber === "" && (displayOpSymbol === "−" || displayOpSymbol === "-")) {
      this.currentNumber = "-"; // Set currentNumber to "-"
      this.displayElement.value = this._getDisplayString(); // Update display to "-"
      return; // Stop here, waiting for the number
    }
    // If nothing has been entered yet (e.g. AC then operator button)
    if (this.currentNumber === "" && this.previousNumber === "") return;

    // If currentNumber is empty, but an operation is pending (e.g., "5+", then user clicks "×")
    // This allows changing the operator.
    if (this.currentNumber === "" && this.previousNumber !== "" && this.operation) {
      this.operation = this.mapOperator(displayOpSymbol);
      this.displayElement.value = this._getDisplayString();
      return;
    }

    // If there's a previous number, a computation might be pending or just completed.
    if (this.previousNumber !== "") {
      this.compute();
      // After compute, currentNumber holds the result, previousNumber is cleared.
      // The result in currentNumber will become the new previousNumber.
    }

    this.operation = this.mapOperator(displayOpSymbol);
    this.previousNumber = this.currentNumber;
    this.currentNumber = "";
    this.displayElement.value = this._getDisplayString();
  }

  compute() {
    let result;
    const prev = parseFloat(this.previousNumber) || 0;
    const current = parseFloat(this.currentNumber || "0");
    if (isNaN(prev) || isNaN(current)) {
      this.currentNumber = "Error";
      this.displayElement.value = this._getDisplayString(); // Show "Error"
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
        // console.log(`Unkown operation: ${this.operation}`);
        return;
    }

    this.currentNumber = result.toString();
    this.operation = null;
    this.previousNumber = "";
    this.displayElement.value = this._getDisplayString(); // Display the result
    // console.log(result);
  }

  toggleSign() {
    if (this.currentNumber.startsWith("-")) {
      // If currentNumber is "-5", it becomes "5". If it's "-", it becomes "".
      this.currentNumber = this.currentNumber.substring(1);
    } else {
      if (this.currentNumber === "0" || this.currentNumber === "") {
        // If "0" or empty, make it "-" to start typing a negative number.
        this.currentNumber = "-"; // Start a negative number
      } else {
        // Otherwise, prepend "-" to the existing number (e.g. "5" becomes "-5").
        this.currentNumber = `-${this.currentNumber}`;
      }
    }
    this.displayElement.value = this._getDisplayString();
  }

  percent() {
    this.currentNumber = (parseFloat(this.currentNumber || "0") / 100).toString();
  }

  mapOperator(operator) {
    const operatorMap = {
      "+": "+",
      "−": "-", // Map Unicode minus (from button) to standard minus (internal)
      "×": "*", // Map Unicode multiplication to standard multiplication
      "÷": "/", // Map Unicode division to standard division
      "*": "*",
      "x": "x" // Keep 'x' as 'x' for multiplication if typed
    };
    return operatorMap[operator] || operator;
  }

  // Helper validation methods
  _isValidNumeric(str) {
    // Validates if a string is a non-empty, complete number
    return str !== "" && str !== "-" && /^-?\d*\.?\d+$/.test(str) || /^-?\d+\.?\d*$/.test(str);
  }

  _isValidPartialNumeric(str) {
    // Validates if a string could be part of a number being typed (e.g., "", "-", "1.", "1.2")
    return /^-?\d*\.?\d*$/.test(str);
  }

  _isValidOperatorSymbol(opSymbol) {
    const mappedOp = this.mapOperator(opSymbol);
    const validCanonicalOperators = ['+', '-', '*', '/', 'x']; // 'x' is also a canonical multiplication operator
    return validCanonicalOperators.includes(mappedOp);
  }
}