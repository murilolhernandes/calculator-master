// import { loadCalculatorTemplate, qs } from "./utils.mjs";
// import RegularCalculator from "./RegularCalculator.mjs";
// import CookingCore from "./CookingCore.mjs";
// import ConversionCore from "./ConversionCore.mjs";

// const API_KEY = import.meta.env.VITE_API_KEY;

// if (!API_KEY) {
//   console.error(
//     "API Key is not configured. Please set VITE_API_KEY environment variable.",
//   );

//   document.body.innerHTML = `<div style="padding: 20px; color: red;">Configuration error: API key is missing. Please contact support.</div>`;
//   throw new Error("API Key is required but not found.");
// }

// let calculator = null; // Store the calculator instance

// function initializeAutocomplete(inputElement, core) {
//   let currentFocus = -1;

//   inputElement.addEventListener("input", function () {
//     const value = this.value;
//     closeAllLists();
//     currentFocus = -1; // Reset focus when input changes

//     if (!value) return false;

//     // Extract ingredient part from input
//     const match = value.match(/^\d+\.?\d*\s+\w+\s+(.*)$/);
//     if (!match) return false;

//     const ingredientPart = match[1];
//     if (ingredientPart.length < 2) return false;

//     const suggestions = core.getSuggestions(ingredientPart);
//     if (suggestions.length === 0) return false;

//     // Create autocomplete div
//     const listDiv = document.createElement("div");
//     listDiv.setAttribute("id", "autocomplete-list");
//     listDiv.setAttribute("class", "autocomplete-items");
//     listDiv.style.position = "absolute";
//     listDiv.style.width = inputElement.offsetWidth + "px";
//     listDiv.style.top =
//       inputElement.offsetTop + inputElement.offsetHeight + "px";
//     listDiv.style.left = inputElement.offsetLeft + "px";
//     listDiv.style.border = "1px solid #d4d4d4";
//     listDiv.style.borderTop = "none";
//     listDiv.style.zIndex = "99";
//     listDiv.style.maxHeight = "200px";
//     listDiv.style.overflowY = "auto";
//     this.parentNode.appendChild(listDiv);

//     suggestions.forEach((suggestion) => {
//       const itemDiv = document.createElement("div");
//       itemDiv.style.padding = "10px";
//       itemDiv.style.cursor = "pointer";
//       itemDiv.style.backgroundColor = "#fff";
//       itemDiv.style.borderBottom = "1px solid #d4d4d4";

//       // Store the suggestion data on the element
//       itemDiv.dataset.value = suggestion.display;
//       itemDiv.dataset.ingredientPart = ingredientPart;

//       // Highlight matching part
//       const matchIndex = suggestion.display
//         .toLowerCase()
//         .indexOf(ingredientPart.toLowerCase());
//       if (matchIndex >= 0) {
//         itemDiv.innerHTML =
//           suggestion.display.substr(0, matchIndex) +
//           `<strong>${suggestion.display.substr(matchIndex, ingredientPart.length)}</strong>` +
//           suggestion.display.substr(matchIndex + ingredientPart.length);
//       } else {
//         itemDiv.innerHTML = suggestion.display;
//       }

//       itemDiv.addEventListener("click", function () {
//         selectItem(this);
//       });

//       itemDiv.addEventListener("mouseenter", function () {
//         this.style.backgroundColor = "#e9e9e9";
//       });

//       itemDiv.addEventListener("mouseleave", function () {
//         this.style.backgroundColor = "#fff";
//       });

//       listDiv.appendChild(itemDiv);
//     });
//   });

//   // Keyboard navigation
//   inputElement.addEventListener("keydown", function (e) {
//     let items = document.getElementById("autocomplete-list");
//     if (items) items = items.getElementsByTagName("div");

//     if (e.keyCode == 40) {
//       // Arrow DOWN
//       e.preventDefault();
//       currentFocus++;
//       addActive(items);
//     } else if (e.keyCode == 38) {
//       // Arrow UP
//       e.preventDefault();
//       currentFocus--;
//       addActive(items);
//     } else if (e.keyCode == 13) {
//       // Enter
//       e.preventDefault();
//       if (currentFocus > -1 && items) {
//         selectItem(items[currentFocus]);
//       }
//     } else if (e.keyCode == 27) {
//       // Escape
//       closeAllLists();
//     }
//   });

//   function selectItem(item) {
//     const value = inputElement.value;
//     const ingredientPart = item.dataset.ingredientPart;
//     const selectedValue = item.dataset.value;

//     const beforeIngredient = value.substring(
//       0,
//       value.lastIndexOf(ingredientPart),
//     );
//     inputElement.value = beforeIngredient + selectedValue;
//     closeAllLists();
//     inputElement.focus();
//   }

//   function addActive(items) {
//     if (!items) return false;
//     removeActive(items);

//     if (currentFocus >= items.length) currentFocus = 0;
//     if (currentFocus < 0) currentFocus = items.length - 1;

//     items[currentFocus].style.backgroundColor = "#e9e9e9";
//     items[currentFocus].classList.add("autocomplete-active");
//   }

//   function removeActive(items) {
//     for (let i = 0; i < items.length; i++) {
//       items[i].style.backgroundColor = "#fff";
//       items[i].classList.remove("autocomplete-active");
//     }
//   }

//   function closeAllLists(elmnt) {
//     const items = document.getElementsByClassName("autocomplete-items");
//     for (let i = 0; i < items.length; i++) {
//       if (elmnt != items[i] && elmnt != inputElement) {
//         items[i].parentNode.removeChild(items[i]);
//       }
//     }
//   }

//   document.addEventListener("click", function (e) {
//     closeAllLists(e.target);
//   });
// }

// document.addEventListener("DOMContentLoaded", () => {
//   //Load the category selector
//   loadCalculatorTemplate(
//     "../partials/calculatorDisplay.html",
//     "#calculator",
//   ).then(() => {
//     // Load the calculator keypad and initialize RegularCalculator
//     loadCalculatorTemplate(
//       "../partials/calculatorContainer.html",
//       "#display-container",
//     ).then(() => {
//       const displayElement = qs("#input-box");
//       const errorMessage = qs("#error-message");
//       if (displayElement) {
//         calculator = new RegularCalculator(displayElement);
//         if (errorMessage) errorMessage.style.display = "none";
//       } else {
//         if (errorMessage) {
//           errorMessage.style.display = "block";
//         }
//       }
//     });

//     // Event listeners for category switching
//     const regCalcElement = qs(".reg-calc");
//     if (regCalcElement) {
//       regCalcElement.addEventListener("click", () => {
//         loadCalculatorTemplate(
//           "../partials/calculatorContainer.html",
//           "#display-container",
//         ).then(() => {
//           const displayElement = qs("#input-box");
//           const errorMessage = qs("#error-message");
//           if (displayElement) {
//             calculator = new RegularCalculator(displayElement);
//             if (errorMessage) errorMessage.style.display = "none";
//           } else {
//             if (errorMessage) {
//               errorMessage.style.display = "block";
//             }
//           }
//         });
//       });
//     } else {
//       console.error("Element with class 'reg-calc' not found.");
//     }

//     const cookingElement = qs(".cooking");
//     if (cookingElement) {
//       cookingElement.addEventListener("click", () => {
//         loadCalculatorTemplate(
//           "../partials/cookingContainer.html",
//           "#display-container",
//         ).then(() => {
//           const cooking = new CookingCore(API_KEY);

//           function displayResult(message, isError = false) {
//             const resultDiv = document.getElementById("result");
//             if (resultDiv) {
//               if (typeof message === "string" && message.includes(",")) {
//                 // Multi-unit response: format as a list or keep as is
//                 resultDiv.innerHTML = `<ul><li>${message.split(", ").join("</li><li>")}</li></ul>`;
//               } else {
//                 resultDiv.textContent = message;
//               }
//               resultDiv.className = isError ? "error" : "";
//             } else {
//               console.error("Result div not found.");
//             }
//           }

//           async function convertUnit() {
//             const input = document.getElementById("input-box")?.value || "";
//             try {
//               const result = await cooking.convertUnit(input);
//               displayResult(result);
//             } catch (error) {
//               displayResult(error.message, true);
//             }
//           }

//           function scaleRecipe() {
//             const input = document.getElementById("input-box")?.value || "";
//             try {
//               const result = cooking.scaleRecipe(input);
//               displayResult(result);
//             } catch (error) {
//               displayResult(error.message, true);
//             }
//           }

//           // Add event listeners for buttons
//           const convertUnitButton = document.getElementById("convert-unit");
//           if (convertUnitButton) {
//             convertUnitButton.addEventListener("click", convertUnit);
//           } else {
//             console.error("Convert unit button not found.");
//           }

//           const scaleRecipeButton = document.getElementById("scale-recipe");
//           if (scaleRecipeButton) {
//             scaleRecipeButton.addEventListener("click", scaleRecipe);
//           } else {
//             console.error("Scale recipe button not found.");
//           }

//           // Autocomplete
//           const inputBox = document.getElementById("input-box");
//           if (inputBox) {
//             initializeAutocomplete(inputBox, cooking);
//           }
//         });
//       });
//     }

//     const conversionElement = qs(".conversion");
//     if (conversionElement) {
//       conversionElement.addEventListener("click", () => {
//         loadCalculatorTemplate(
//           "../partials/conversionContainer.html",
//           "#display-container",
//         ).then(() => {
//           const conversion = new ConversionCore(API_KEY);

//           function displayResult(message, isError = false) {
//             const resultDiv = document.getElementById("result");
//             if (resultDiv) {
//               resultDiv.textContent = message;
//               resultDiv.className = isError ? "error" : "";
//             } else {
//               console.error("Result div not found.");
//             }
//           }

//           async function convertUnit() {
//             const value = document.getElementById("input-box")?.value || "";
//             const fromUnit =
//               document.getElementById("conversion-from-unit")?.value || "";
//             const toUnit =
//               document.getElementById("conversion-to-unit")?.value || "";
//             try {
//               if (!value || !fromUnit || !toUnit) {
//                 displayResult("Please fill all fields", true);
//                 return;
//               }
//               const result = await conversion.convertUnit(
//                 value,
//                 fromUnit,
//                 toUnit,
//               );
//               const formattedValue = parseFloat(value).toLocaleString("en-US");
//               const formattedResult = result.toLocaleString("en-US", {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               });
//               displayResult(
//                 `${formattedValue} ${fromUnit} = ${formattedResult} ${toUnit}`,
//               );
//             } catch (error) {
//               displayResult(error.message, true);
//             }
//           }

//           const convertUnitButton = document.getElementById("convert-unit");
//           if (convertUnitButton) {
//             convertUnitButton.addEventListener("click", convertUnit);
//           } else {
//             console.error("Convert unit button not found.");
//           }
//         });
//       });
//     }
//   });
// });
