import { loadCalculatorTemplate, qs } from "./utils.mjs";
import RegularCalculator from "./RegularCalculator.mjs";

document.addEventListener("DOMContentLoaded", () => {
  //Load the category selector
  loadCalculatorTemplate("../partials/calculatorDisplay.html", "#calculator");

  // Load the calculator keypad and initialize RegularCalculator 
  loadCalculatorTemplate(
    "../partials/calculatorContainer.html",
    "#display-container"
  ).then(() => {
    const displayElement = qs("#number1");
    if (displayElement) {
      const calculator = new RegularCalculator(displayElement);
    } else {
      console.error("Display element not found.");
    }
    
  });

  // Add event listeners for category switching (to be implemented later)
  // qs(".reg-cal").addEventListener("click", () => {
  //   loadCalculatorTemplate("../partials/calculatorContainer.html", "#display-container").then(() => {
  //     const displayElement = qs("#number1");
  //     const calculator = new RegularCalculator(displayElement);
  //   });
  // });
});
