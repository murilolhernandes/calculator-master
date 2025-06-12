import { loadCalculatorTemplate, qs } from "./utils.mjs";
import CalculatorManager from "./CalculatorManager.mjs";

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

// Initialize Application
async function initializeApp() {
  try {
    await loadCalculatorTemplate(PATHS.DISPLAY, SELECTORS.CALCULATOR);

    const manager = new CalculatorManager(SELECTORS, API_KEY);

    // Load default calculator
    await manager.loadCalculator("regular", PATHS.REGULAR);

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
