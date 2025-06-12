import { loadCalculatorTemplate, qs } from "./utils.mjs";
import ConversionCore from "./ConversionCore.mjs";
import RegularCalculator from "./RegularCalculator.mjs";
import CookingCore from "./CookingCore.mjs";
import Autocomplete from "./Autocomplete.mjs";

export default class CalculatorManager {
  constructor(SELECTORS, API_KEY) {
    this.currentCalculator = null;
    this.calculatorTypes = {
      regular: this.initializeRegularCalculator.bind(this),
      cooking: this.initializeCookingCalculator.bind(this),
      conversion: this.initializeConversionCalculator.bind(this),
    };
    this.SELECTORS = SELECTORS;
    this.API_KEY = API_KEY;
  }

  async loadCalculator(type, templatePath) {
    try {
      await loadCalculatorTemplate(templatePath, this.SELECTORS.DISPLAY_CONTAINER);

      if (this.calculatorTypes[type]) {
        await this.calculatorTypes[type]();
      }
    } catch (error) {
      console.error(`Failed to load ${type} calculator:`, error);
      this.showError(`Failed to load ${type} calculator`);
    }
  }

  initializeRegularCalculator() {
    const displayElement = qs(this.SELECTORS.INPUT_BOX);
    const errorMessage = qs(this.SELECTORS.ERROR_MESSAGE);

    if (displayElement) {
      this.currentCalculator = new RegularCalculator(displayElement);
      if (errorMessage) errorMessage.style.display = "none";
    } else if (errorMessage) {
      errorMessage.style.display = "block";
    }
  }

  initializeCookingCalculator() {
    const cooking = new CookingCore(this.API_KEY);

    // Setup event handlers
    this.setupButton(this.SELECTORS.CONVERT_BUTTON, () =>
      this.handleCookingConvert(cooking),
    );
    this.setupButton(this.SELECTORS.SCALE_BUTTON, () =>
      this.handleCookingScale(cooking),
    );

    // Initialize autocomplete
    const inputBox = qs(this.SELECTORS.INPUT_BOX);
    if (inputBox) {
      new Autocomplete(inputBox, cooking);
    }
  }

  initializeConversionCalculator() {
    const conversion = new ConversionCore(this.API_KEY);

    this.setupButton(this.SELECTORS.CONVERT_BUTTON, () =>
      this.handleGeneralConvert(conversion),
    );
  }

  async handleCookingConvert(cooking) {
    const input = qs(this.SELECTORS.INPUT_BOX)?.value || "";
    try {
      const result = await cooking.convertUnit(input);
      this.displayResult(result);
    } catch (error) {
      this.displayResult(error.message, true);
    }
  }

  handleCookingScale(cooking) {
    const input = qs(this.SELECTORS.INPUT_BOX)?.value || "";
    try {
      const result = cooking.scaleRecipe(input);
      this.displayResult(result);
    } catch (error) {
      this.displayResult(error.message, true);
    }
  }

  async handleGeneralConvert(conversion) {
    const value = qs(this.SELECTORS.INPUT_BOX)?.value || "";
    const fromUnit = qs(this.SELECTORS.FROM_UNIT)?.value || "";
    const toUnit = qs(this.SELECTORS.TO_UNIT)?.value || "";

    try {
      if (!value || !fromUnit || !toUnit) {
        this.displayResult("Please fill all fields", true);
        return;
      }

      const result = await conversion.convertUnit(value, fromUnit, toUnit);
      const formattedValue = parseFloat(value).toLocaleString("en-US");
      const formattedResult = result.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      this.displayResult(
        `${formattedValue} ${fromUnit} = ${formattedResult} ${toUnit}`,
      );
    } catch (error) {
      this.displayResult(error.message, true);
    }
  }

  displayResult(message, isError = false) {
    const resultDiv = qs(this.SELECTORS.RESULT);
    if (!resultDiv) {
      console.error("Result div not found.");
      return;
    }

    if (typeof message === "string" && message.includes(",") && !isError) {
      const items = message
        .split(", ")
        .map((item) => `<li>${item}</li>`)
        .join("");
      resultDiv.innerHTML = `<ul>${items}</ul>`;
    } else {
      resultDiv.textContent = message;
    }

    resultDiv.className = isError ? "error" : "";
  }

  setupButton(selector, handler) {
    const button = qs(selector);
    if (button) {
      button.addEventListener("click", handler);
    } else {
      console.error(`Button ${selector} not found.`);
    }
  }

  showError(message) {
    const errorDiv = qs(this.SELECTORS.ERROR_MESSAGE);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
  }
}