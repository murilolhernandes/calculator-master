import Cooking from "./Cooking.mjs";

export default class ConversionCore {
  #converter;
  #cache = new Map(); // In-memory cache for conversions
  #requestCount = 0; // Track API requests per session

  constructor(apiKey) {
    this.#converter = new Cooking(apiKey);
  }

  getRequestCount() {
    return this.#requestCount;
  }

  parseConvertInput(input) {
    const match = input.match(/(\d+\.?\d*)\s*(\w+)\s*(\w+)\s*(?:to\s*(\w+))?/i);
    if (!match) {
      throw new Error(`Invalid format. Use: "2 cups flour" or "2 cups flour to grams"`);
    }
    return {
      value: match[1],
      unit: match[2],
      ingredient: match[3],
      targetUnit: match[4] || null
    };
  }

  parseScaleInput(input) {
    const match = input.match(/(\d+\.?\d*)\s*(\w+)\s*(\w+)\s*for\s*(\d+)\s*servings\s*to\s*(\d+)\s*servings/i);
    if (!match) {
      throw new Error(`Invalid format. Use: "2 cups flour for 4 servings to 2 servings"`);
    }
    return {
      value: match[1],
      unit: match[2],
      ingredient: match[3],
      originalServings: match[4],
      newServings: match[5]
    };
  }

  normalizeIngredient(ingredient) {
    const ingredientMap = {
      "salt": "sea_salt"
    };
    return ingredientMap[ingredient.toLowerCase()] || ingredient.toLowerCase();
  }

  async convertUnit(input) {
    const { value, unit, ingredient, targetUnit } = this.parseConvertInput(input);
    const normalizedUnit = this.normalizeUnit(unit);
    const normalizedIngredient = this.normalizeIngredient(ingredient);
    const cacheKey = `${value}-${normalizedUnit}-${normalizedIngredient}-${targetUnit || ""}`;

    // Check cache first
    if (this.#cache.has(cacheKey)) {
      const result = this.#cache.get(cacheKey);
      console.log(`Cache Hit - Result: ${result}`);
      return this.formatResult(value, normalizedUnit, normalizedIngredient, result, targetUnit);
    }

    let conversions;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        conversions = await this.#converter.convert(value, normalizedUnit, normalizedIngredient);
        console.log(`API Conversions Attempt ${attempt}: ${JSON.stringify(conversions, null, 2)}`);
        break;
      } catch (error) {
        console.error(`API Conversions Attempt ${attempt} failed: ${error.message}`);
        if (attempt === 3) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    if (Object.keys(conversions).length === 0 || conversions.error) {
      throw new Error("No valid conversions returned from API");
    }

    // Make API call
    let result;
    if (targetUnit) {
      result = conversions[targetUnit.toLowerCase()];
      console.log(`Targeted Result: ${result}`);
    } else {
      result = conversions;
    }

    if (result === undefined) {
      // Fallback conversion for flour
      if (normalizedIngredient.toLowerCase() === "flour" && normalizedUnit.toLowerCase() === "cups") {
        const gramsPerCup = 120;
        if (targetUnit === "fl_oz") {
          const flOzPerCup = 8.12;
          result = parseFloat(value) * flOzPerCup;
        } else {
          result = parseFloat(value) * gramsPerCup;
        }
        console.log(`Fallback Used - Result: ${result}`);
      } else if (normalizedIngredient === "sea_salt" && normalizedUnit === "teaspoons") {
        const gramsPerTeaspoon = 6;
        result = parseFloat(value) * gramsPerTeaspoon;
        // const conversionRate = 120;
        // result = parseFloat(value) * conversionRate;
        console.log(`Fallback Used - Result: ${result}`);
      } else {
        throw new Error(`Conversion to ${targetUnit} not supported`);
      }
    }

    // Store in cache and increment request count
    this.#cache.set(cacheKey, result);
    this.#requestCount++;
    return this.formatResult(value, normalizedUnit, normalizedIngredient, result, targetUnit);
  }

  normalizeUnit(unit) {
    const unitMap = {
      "cup": "cups",
      "teaspoon": "teaspoons",
      "tablespoon": "tablespoons",
      "ounce": "oz",
      "pound": "lbs",
      "milliliter": "milliliters",
      "liter": "liters",
      "gram": "grams",
      "quart": "quarts",
      "pint": "pints",
      "fl": "fl_oz"
    };
    const normalized = unitMap[unit.toLowerCase()];
    return normalized || (unit.toLowerCase().endsWith("s") || unit.toLowerCase() === "teaspoon" || unit.toLowerCase() === "tablespoon" ? unit.toLowerCase() : unitToLowerCase() + "s");
  }

  formatResult(value, unit, ingredient, result, targetUnit) {
    if (typeof result === "object" && result !== null) {
      return Object.entries(result).map(([unit, value]) => `${parseFloat(value).toFixed(2)} ${unit.replace("_", " ")}`).join(", ");
    }
    return `${value} ${unit} ${ingredient} = ${parseFloat(result).toFixed(2)} ${targetUnit || ""}`;
  }

  scaleRecipe(input) {
    const { value, unit, ingredient, originalServings, newServings } = this.parseScaleInput(input);
    const scaleFactor = parseInt(newServings) / parseInt(originalServings);
    const newQuantity = (parseFloat(value) * scaleFactor).toFixed(2);
    return `${value} ${unit} ${ingredient} for ${originalServings} servings = ${newQuantity} ${unit} for ${newServings} servings`;
  }
}