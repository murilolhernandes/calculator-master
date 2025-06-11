export default class RegularCalculator {
  constructor(displayElement) {
    this.displayElement = displayElement;
    this.clear();
    this.setupEventListeners();
  }

  // Operator mappings
  static OPERATOR_MAP = {
    "+": "+",
    "−": "-",
    "×": "*",
    "÷": "/",
    "-": "-",
    "*": "*",
    "x": "*"
  };

  static DISPLAY_OPERATORS = {
    "+": "+",
    "-": "−",
    "*": "×",
    "/": "÷"
  };

  setupEventListeners() {
    // Button event listeners
    this.addClickListener(".clear", () => this.clear());
    this.addClickListener(".positive-negative", () => this.toggleSign());
    this.addClickListener(".percentage", () => {
      this.percent();
      this.updateDisplay();
    });
    this.addClickListener(".equals", () => this.compute());

    // Number buttons
    document.querySelectorAll(".digits").forEach(button => {
      button.addEventListener("click", () => this.appendNumber(button.textContent));
    });

    // Operation buttons
    document.querySelectorAll(".divide, .times, .minus, .plus").forEach(button => {
      button.addEventListener("click", () => this.chooseOperation(button.textContent));
    });

    // Input and keyboard events
    if (this.displayElement) {
      this.displayElement.addEventListener("input", (e) => this.handleInput(e));
      this.displayElement.addEventListener("keydown", (e) => this.handleKeydown(e));
    }
  }

  addClickListener(selector, handler) {
    const element = document.querySelector(selector);
    element?.addEventListener("click", handler);
  }

  handleInput(e) {
    const value = e.target.value.trim();

    // Handle percent input
    if (this.handlePercentInput(value)) return;

    const parts = this.parseExpression(value);
    
    if (!value) {
      this.clear();
      return;
    }

    // Parse different expression patterns
    this.parsePattern(parts);
    this.updateDisplay();
  }

  handleKeydown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.compute();
    } else if (e.key === "Delete") {
      e.preventDefault();
      this.clear();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      const value = this.displayElement.value;
      if (value.length > 0) {
        this.displayElement.value = value.slice(0, -1);
        this.displayElement.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  }

  handlePercentInput(value) {
    const operatorPattern = /[-+*x/÷×−]/;
    if (!operatorPattern.test(value) && value.endsWith("%") && value.length > 1) {
      const numPart = value.slice(0, -1);
      if (this._isValidPartialNumeric(numPart)) {
        this.currentNumber = numPart || "0";
        this.previousNumber = "";
        this.operation = null;
        this.percent();
        this.updateDisplay();
        return true;
      }
    }
    return false;
  }

  parseExpression(value) {
    // Handle negative numbers at the start
    if (value.startsWith("-")) {
      // Check if this is a negative number ("-5") or an expression ("-5+3")
      const afterMinus = value.substring(1);
      const nextOpIndex = afterMinus.search(/[-+*x/÷×−]/);
      
      if (nextOpIndex === -1) {
        // No operator after the minus, it's just a negative number
        return [value];
      } else {
        // There's an operator after, so parse normally by preserve the negative number
        const negativeNum = value.substring(0, nextOpIndex + 1);
        const rest = value.substring(nextOpIndex + 1);
        const restParts = rest.split(/([-+*x/÷×−])/).map(str => str.trim()).filter(Boolean);
        return [negativeNum, ...restParts];
      }
    }

    // Parsing for non-negative starting values
    return value.split(/([-+*x/÷×−])/).map(str => str.trim()).filter(Boolean);
  }

  parsePattern(parts) {
    const handlers = {
      4: () => this.parseDoubleOperation(parts),
      3: () => this.parseFullExpression(parts),
      2: () => this.parseOperatorOnly(parts),
      1: () => this.parseNumber(parts)
    };
    
    handlers[parts.length]?.();
  }

  parseDoubleOperation([pNum, op1, cNum, op2]) {
    if (this._isValidNumeric(pNum) && this._isValidOperator(op1) &&
        this._isValidNumeric(cNum) && this._isValidOperator(op2)) {
      this.previousNumber = pNum;
      this.operation = this.mapOperator(op1);
      this.currentNumber = cNum;
      this.compute();
      this.previousNumber = this.currentNumber;
      this.operation = this.mapOperator(op2);
      this.currentNumber = "";
    }
  }

  parseFullExpression([pNum, op, cNum]) {
    if (this._isValidNumeric(pNum) && this._isValidOperator(op) && 
        this._isValidPartialNumeric(cNum)) {
      this.previousNumber = pNum;
      this.operation = this.mapOperator(op);
      this.currentNumber = cNum;
    }
  }

  parseOperatorOnly([pNum, op]) {
    if (this._isValidNumeric(pNum) && this._isValidOperator(op)) {
      this.previousNumber = pNum;
      this.operation = this.mapOperator(op);
      this.currentNumber = "";
    }
  }

  parseNumber([num]) {
    if (this._isValidPartialNumeric(num)) {
      this.currentNumber = num;
      this.previousNumber = "";
      this.operation = null;
    }
  }

  _getDisplayString() {
    if (this.operation) {
      const displayOp = RegularCalculator.DISPLAY_OPERATORS[this.operation] || this.operation;
      return `${this.previousNumber}${displayOp}${this.currentNumber}`;
    }
    return this.currentNumber;
  }

  clear() {
    this.currentNumber = "";
    this.previousNumber = "";
    this.operation = null;
    this.updateDisplay("");
  }

  updateDisplay(value) {
    this.displayElement.value = value ?? this._getDisplayString();
  }

  appendNumber(number) {
    if (number === "." && this.currentNumber.includes(".")) return;
    
    if (!this.currentNumber && number !== ".") {
      this.currentNumber = number;
    } else {
      this.currentNumber += number;
    }
    
    this.updateDisplay();
  }

  chooseOperation(displayOpSymbol) {
    // Handle negative number input
    if (!this.currentNumber && !this.previousNumber && 
        (displayOpSymbol === "−" || displayOpSymbol === "-")) {
      this.currentNumber = "-";
      this.updateDisplay();
      return;
    }

    // Handle edge cases
    if (this.currentNumber === "-") this.currentNumber = "0";
    if (!this.currentNumber && !this.previousNumber) return;

    // Allow changing operator
    if (!this.currentNumber && this.previousNumber && this.operation) {
      this.operation = this.mapOperator(displayOpSymbol);
      this.updateDisplay();
      return;
    }

    // Compute pending operation
    if (this.previousNumber) {
      this.compute();
    }

    this.operation = this.mapOperator(displayOpSymbol);
    this.previousNumber = this.currentNumber;
    this.currentNumber = "";
    this.updateDisplay();
  }

  compute() {
    const prev = parseFloat(this.previousNumber) || 0;
    const current = parseFloat(this.currentNumber || "0");
    
    if (isNaN(prev) || isNaN(current)) {
      this.currentNumber = "Error";
      this.updateDisplay();
      return;
    }

    let result;
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
        result = current === 0 ? "Error: Division by zero" : prev / current;
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
    if (this.currentNumber.startsWith("-")) {
      this.currentNumber = this.currentNumber.substring(1);
    } else if (!this.currentNumber || this.currentNumber === "0") {
      this.currentNumber = "-";
    } else {
      this.currentNumber = `-${this.currentNumber}`;
    }
    this.updateDisplay();
  }

  percent() {
    this.currentNumber = (parseFloat(this.currentNumber || "0") / 100).toString();
  }

  mapOperator(operator) {
    return RegularCalculator.OPERATOR_MAP[operator] || operator;
  }

  _isValidNumeric(str) {
    return str && str !== "-" && /^-?\d+\.?\d*$/.test(str);
  }

  _isValidPartialNumeric(str) {
    return /^-?\d*\.?\d*$/.test(str);
  }

  _isValidOperator(opSymbol) {
    return opSymbol in RegularCalculator.OPERATOR_MAP;
  }
}