export default class Autocomplete {
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

    listDiv.style.position = "absolute";
    listDiv.style.width = this.inputElement.offsetWidth + "px";
    listDiv.style.top =
      this.inputElement.offsetTop + this.inputElement.offsetHeight + "px";
    listDiv.style.left = this.inputElement.offsetLeft + "px";
    listDiv.style.border = "1px solid #d4d4d4";
    listDiv.style.borderTop = "none";
    listDiv.style.zIndex = "99";
    listDiv.style.maxHeight = "200px";
    listDiv.style.overflowY = "auto";

    this.inputElement.parentNode.appendChild(listDiv);

    suggestions.forEach((suggestion) => {
      const itemDiv = this.createSuggestionItem(suggestion, ingredientPart);
      itemDiv.style.padding = "10px";
      itemDiv.style.cursor = "pointer";
      itemDiv.style.borderBottom = "1px solid #d4d4d4";
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