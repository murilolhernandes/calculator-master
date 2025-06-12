import { loadCalculatorTemplate, qs } from "./utils.mjs";
import RegularCalculator from "./RegularCalculator.mjs";
import CookingCore from "./CookingCore.mjs";
import ConversionCore from "./ConversionCore.mjs";

// Constants
const API_KEY = import.meta.env.VITE_API_KEY;
const PATHS = {
  DISPLAY: "../partials/calculatorDisplay.html",
  REGULAR: "../partials/calculatorContainer.html",
  COOKING: "../partials/cookingContainer.html",
  CONVERSION: "../partials/conversionContainer.html",
};

const SELECTORS = {
  CALCULATOR: "#calculator",
  DISPLAY_CONTAINER: "#display-container",
  INPUT_BOX: "#input-box",
  ERROR_MESSAGE: "#error-message",
  RESULT: "#result",
  CONVERT_BUTTON: "#convert-unit",
  SCALE_BUTTON: "#scale-recipe",
  FROM_UNIT: "#conversion-from-unit",
  TO_UNIT: "#conversion-to-unit",
};

// API Key validation
if (!API_KEY) {
  console.error(
    "API Key is not configured. Please set VITE_API_KEY environment variable.",
  );
  document.body.innerHTML = `
    <div style="padding: 20px; color: red;">
      Configuration error: API key is missing. Please contact support.
    </div>
  `;
  throw new Error("API Key is required but not found.");
}

// Calculator Manager
class CalculatorManager {
  constructor() {
    this.currentCalculator = null;
    this.calculatorTypes = {
      regular: this.initializeRegularCalculator.bind(this),
      cooking: this.initializeCookingCalculator.bind(this),
      conversion: this.initializeConversionCalculator.bind(this),
    };
  }

  async loadCalculator(type, templatePath) {
    try {
      await loadCalculatorTemplate(templatePath, SELECTORS.DISPLAY_CONTAINER);

      if (this.calculatorTypes[type]) {
        await this.calculatorTypes[type]();
      }
    } catch (error) {
      console.error(`Failed to load ${type} calculator:`, error);
      this.showError(`Failed to load ${type} calculator`);
    }
  }

  initializeRegularCalculator() {
    const displayElement = qs(SELECTORS.INPUT_BOX);
    const errorMessage = qs(SELECTORS.ERROR_MESSAGE);

    if (displayElement) {
      this.currentCalculator = new RegularCalculator(displayElement);
      if (errorMessage) errorMessage.style.display = "none";
    } else if (errorMessage) {
      errorMessage.style.display = "block";
    }
  }

  initializeCookingCalculator() {
    const cooking = new CookingCore(API_KEY);

    // Setup event handlers
    this.setupButton(SELECTORS.CONVERT_BUTTON, () =>
      this.handleCookingConvert(cooking),
    );
    this.setupButton(SELECTORS.SCALE_BUTTON, () =>
      this.handleCookingScale(cooking),
    );

    // Initialize autocomplete
    const inputBox = qs(SELECTORS.INPUT_BOX);
    if (inputBox) {
      new Autocomplete(inputBox, cooking);
    }
  }

  initializeConversionCalculator() {
    const conversion = new ConversionCore(API_KEY);

    this.setupButton(SELECTORS.CONVERT_BUTTON, () =>
      this.handleGeneralConvert(conversion),
    );
  }

  async handleCookingConvert(cooking) {
    const input = qs(SELECTORS.INPUT_BOX)?.value || "";
    try {
      const result = await cooking.convertUnit(input);
      this.displayResult(result);
    } catch (error) {
      this.displayResult(error.message, true);
    }
  }

  handleCookingScale(cooking) {
    const input = qs(SELECTORS.INPUT_BOX)?.value || "";
    try {
      const result = cooking.scaleRecipe(input);
      this.displayResult(result);
    } catch (error) {
      this.displayResult(error.message, true);
    }
  }

  async handleGeneralConvert(conversion) {
    const value = qs(SELECTORS.INPUT_BOX)?.value || "";
    const fromUnit = qs(SELECTORS.FROM_UNIT)?.value || "";
    const toUnit = qs(SELECTORS.TO_UNIT)?.value || "";

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
    const resultDiv = qs(SELECTORS.RESULT);
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
    const errorDiv = qs(SELECTORS.ERROR_MESSAGE);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
  }
}

// Autocomplete Class
class Autocomplete {
  constructor(inputElement, core) {
    this.inputElement = inputElement;
    this.core = core;
    this.currentFocus = -1;
    this.init();
  }

  init() {
    this.inputElement.addEventListener("input", this.handleInput.bind(this));
    this.inputElement.addEventListener(
      "keydown",
      this.handleKeydown.bind(this),
    );
    document.addEventListener("click", this.handleDocumentClick.bind(this));
  }

  handleInput() {
    const value = this.inputElement.value;
    this.closeAllLists();
    this.currentFocus = -1;

    if (!value) return;

    const match = value.match(/^\d+\.?\d*\s+\w+\s+(.*)$/);
    if (!match || match[1].length < 2) return;

    const ingredientPart = match[1];
    const suggestions = this.core.getSuggestions(ingredientPart);

    if (suggestions.length === 0) return;

    this.createSuggestionList(suggestions, ingredientPart);
  }

  createSuggestionList(suggestions, ingredientPart) {
    const listDiv = document.createElement("div");
    listDiv.id = "autocomplete-list";
    listDiv.className = "autocomplete-items";

    // Position the list
    const rect = this.inputElement.getBoundingClientRect();
    listDiv.style.width = `${rect.width}px`;
    listDiv.style.top = `${rect.bottom}px`;
    listDiv.style.left = `${rect.left}px`;

    this.inputElement.parentNode.appendChild(listDiv);

    suggestions.forEach((suggestion) => {
      const itemDiv = this.createSuggestionItem(suggestion, ingredientPart);
      listDiv.appendChild(itemDiv);
    });
  }

  createSuggestionItem(suggestion, ingredientPart) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "autocomplete-item";
    itemDiv.dataset.value = suggestion.display;
    itemDiv.dataset.ingredientPart = ingredientPart;

    // Highlight matching part
    const matchIndex = suggestion.display
      .toLowerCase()
      .indexOf(ingredientPart.toLowerCase());
    if (matchIndex >= 0) {
      const before = suggestion.display.substr(0, matchIndex);
      const match = suggestion.display.substr(
        matchIndex,
        ingredientPart.length,
      );
      const after = suggestion.display.substr(
        matchIndex + ingredientPart.length,
      );
      itemDiv.innerHTML = `${before}<strong>${match}</strong>${after}`;
    } else {
      itemDiv.textContent = suggestion.display;
    }

    itemDiv.addEventListener("click", () => this.selectItem(itemDiv));
    return itemDiv;
  }

  handleKeydown(e) {
    const items = document
      .getElementById("autocomplete-list")
      ?.getElementsByTagName("div");
    if (!items) return;

    switch (e.keyCode) {
      case 40: // Arrow DOWN
        e.preventDefault();
        this.currentFocus++;
        this.setActive(items);
        break;
      case 38: // Arrow UP
        e.preventDefault();
        this.currentFocus--;
        this.setActive(items);
        break;
      case 13: // Enter
        e.preventDefault();
        if (this.currentFocus > -1) {
          this.selectItem(items[this.currentFocus]);
        }
        break;
      case 27: // Escape
        this.closeAllLists();
        break;
    }
  }

  selectItem(item) {
    const value = this.inputElement.value;
    const ingredientPart = item.dataset.ingredientPart;
    const selectedValue = item.dataset.value;

    const beforeIngredient = value.substring(
      0,
      value.lastIndexOf(ingredientPart),
    );
    this.inputElement.value = beforeIngredient + selectedValue;
    this.closeAllLists();
    this.inputElement.focus();
  }

  setActive(items) {
    if (!items) return;

    // Remove active class from all items
    Array.from(items).forEach((item) =>
      item.classList.remove("autocomplete-active"),
    );

    // Wrap around
    if (this.currentFocus >= items.length) this.currentFocus = 0;
    if (this.currentFocus < 0) this.currentFocus = items.length - 1;

    // Add active class to current item
    items[this.currentFocus].classList.add("autocomplete-active");
  }

  closeAllLists(except) {
    const items = document.getElementsByClassName("autocomplete-items");
    Array.from(items).forEach((item) => {
      if (item !== except && item !== this.inputElement) {
        item.remove();
      }
    });
  }

  handleDocumentClick(e) {
    this.closeAllLists(e.target);
  }
}

// Initialize Application
async function initializeApp() {
  try {
    await loadCalculatorTemplate(PATHS.DISPLAY, SELECTORS.CALCULATOR);

    const manager = new CalculatorManager();

    // Load default calculator
    await manager.loadCalculator("regular", PATHS.REGULAR);

    // // Set the calculator tab as active by default
    // const regCalcTab = qs(".reg-calc");
    // if (regCalcTab) {
    //   regCalcTab.classList.add("active");
    // }

    // Setup tab navigation
    const tabs = [
      { selector: ".reg-calc", type: "regular", path: PATHS.REGULAR },
      { selector: ".cooking", type: "cooking", path: PATHS.COOKING },
      { selector: ".conversion", type: "conversion", path: PATHS.CONVERSION },
    ];

    tabs.forEach((tab) => {
      const element = qs(tab.selector);
      if (element) {
        element.addEventListener("click", () => {
          // Update active state
          document
            .querySelectorAll(".reg-calc, .cooking, .conversion")
            .forEach((el) => el.classList.remove("active"));
          element.classList.add("active");

          // Load calculator
          manager.loadCalculator(tab.type, tab.path);
        });
      }
    });
  } catch (error) {
    console.error(`Failed to initialize app: ${error}`);
  }
}

// Start the application
document.addEventListener("DOMContentLoaded", initializeApp);
