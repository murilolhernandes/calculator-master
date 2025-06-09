import { loadCalculatorTemplate, qs } from "./utils.mjs";
import RegularCalculator from "./RegularCalculator.mjs";

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

    // Add event listeners for category switching (to be implemented later)
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
            if (calculator) {
              calculator = new RegularCalculator(displayElement);
            } else {
              calculator = new RegularCalculator(displayElement);
            }
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
  });
});
