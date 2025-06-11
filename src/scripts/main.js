import { loadCalculatorTemplate, qs } from "./utils.mjs";
import RegularCalculator from "./RegularCalculator.mjs";
import ConversionCore from "./ConversionCore.mjs";
// import { config } from 'dotenv';

// const API_KEY = process.env.VITE_API_KEY;

let calculator = null; // Store the calculator instance

document.addEventListener("DOMContentLoaded", () => {
  //Load the category selector
  loadCalculatorTemplate(
    "../partials/calculatorDisplay.html",
    "#calculator",
  ).then(() => {
    // Load the calculator keypad and initialize RegularCalculator
    loadCalculatorTemplate(
      "../partials/calculatorContainer.html",
      "#display-container",
    ).then(() => {
      const displayElement = qs("#number1");
      const errorMessage = qs("#error-message");
      if (displayElement) {
        calculator = new RegularCalculator(displayElement);
        if (errorMessage) errorMessage.style.display = "none";
      } else {
        if (errorMessage) {
          errorMessage.style.display = "block";
        }
      }
    });

    // Event listeners for category switching
    const regCalcElement = qs(".reg-calc");
    if (regCalcElement) {
      regCalcElement.addEventListener("click", () => {
        loadCalculatorTemplate(
          "../partials/calculatorContainer.html",
          "#display-container",
        ).then(() => {
          const displayElement = qs("#number1");
          const errorMessage = qs("#error-message");
          if (displayElement) {
            calculator = new RegularCalculator(displayElement);
            if (errorMessage) errorMessage.style.display = "none";
          } else {
            if (errorMessage) {
              errorMessage.style.display = "block";
            }
          }
        });
      });
    } else {
      console.error("Element with class 'reg-calc' not found.");
    }

    const cookingElement = qs(".cooking");
    if (cookingElement) {
      cookingElement.addEventListener("click", () => {
        loadCalculatorTemplate(
          "../partials/cookingContainer.html",
          "#display-container",
        ).then(() => {
          const API_KEY = "e2b94f34d5msh9bcfb55c0627eb3p1af9c1jsnd91212fb853f"; // Move to env var in production
          const core = new ConversionCore(API_KEY);
          const DAILY_LIMIT = 100;

          function displayResult(message, isError = false) {
            const resultDiv = document.getElementById("result");
            if (resultDiv) {
              if (typeof message === "string" && message.includes(",")) {
                // Multi-unit response: format as a list or keep as is
                resultDiv.innerHTML = `<ul><li>${message.split(", ").join("</li><li>")}</li></ul>`;
              } else {
                resultDiv.textContent = message;
              }
              resultDiv.className = isError ? "error" : "";
            } else {
              console.error("Result div not found.");
            }
          }

          function updateRequestCount() {
            const count = core.getRequestCount();
            const requestDiv = document.getElementById("request-count");
            if (requestDiv) {
              requestDiv.textContent = `API Requests Today: ${count}/${DAILY_LIMIT}`;
              requestDiv.className = count > 80 ? "warning" : "";
            } else {
              console.error("Request count div not found.");
            }
          }

          async function convertUnit() {
            const input = document.getElementById("input-box")?.value || "";
            try {
              const result = await core.convertUnit(input);
              displayResult(result);
              updateRequestCount();
            } catch (error) {
              displayResult(error.message, true);
            }
          }

          function scaleRecipe() {
            const input = document.getElementById("input-box")?.value || "";
            try {
              const result = core.scaleRecipe(input);
              displayResult(result);
              updateRequestCount();
            } catch (error) {
              displayResult(error.message, true);
            }
          }

          // Add event listeners for buttons
          const convertUnitButton = document.getElementById("convert-unit");
          if (convertUnitButton) {
            convertUnitButton.addEventListener("click", convertUnit);
          } else {
            console.error("Convert unit button not found.");
          }

          const scaleRecipeButton = document.getElementById("scale-recipe");
          if (scaleRecipeButton) {
            scaleRecipeButton.addEventListener("click", scaleRecipe);
          } else {
            console.error("Scale recipe button not found.");
          }
        });
      });
    }

    const constructionElement = qs(".construction");
    if (constructionElement) {
      constructionElement.addEventListener("click", () => {
        loadCalculatorTemplate(
          "../partials/constructionContainer.html",
          "#display-container",
        );
      });
    }

    const currencyElement = qs(".currency");
    if (currencyElement) {
      currencyElement.addEventListener("click", () => {
        loadCalculatorTemplate(
          "../partials/currencyContainer.html",
          "#display-container",
        );
      });
    }
  });
});
