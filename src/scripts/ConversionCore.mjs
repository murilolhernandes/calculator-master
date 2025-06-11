import Cooking from "./Cooking.mjs";
import { 
  findBestIngredientMatch, 
  getIngredientSuggestions,
  VALID_INGREDIENTS_SET 
} from "./ingredients.mjs";

export default class ConversionCore {
  #converter;
  #cache = new Map();
  #requestCount = 0;

  constructor(apiKey) {
    this.#converter = new Cooking(apiKey);
  }

  getRequestCount() {
    return this.#requestCount;
  }

  parseConvertInput(input) {
    // More flexible regex to handle multi-word ingredients
    const match = input.match(/^(\d+\.?\d*)\s+(\w+)\s+(.+?)(?:\s+to\s+(\w+))?$/i);
    if (!match) {
      throw new Error(`Invalid format. Use: "2 cups flour" or "2 cups flour to grams"`);
    }
    return {
      value: match[1],
      unit: match[2],
      ingredient: match[3].trim(),
      targetUnit: match[4] || null
    };
  }

  parseScaleInput(input) {
    const match = input.match(/^(\d+\.?\d*)\s+(\w+)\s+(.+?)\s+for\s+(\d+)\s+servings?\s+to\s+(\d+)\s+servings?$/i);
    if (!match) {
      throw new Error(`Invalid format. Use: "2 cups flour for 4 servings to 2 servings"`);
    }
    return {
      value: match[1],
      unit: match[2],
      ingredient: match[3].trim(),
      originalServings: match[4],
      newServings: match[5]
    };
  }

  normalizeIngredient(ingredient) {
    return findBestIngredientMatch(ingredient);
  }

  validateIngredient(normalizedIngredient) {
    if (!VALID_INGREDIENTS_SET.has(normalizedIngredient)) {
      // Get suggestions for user
      const suggestions = getIngredientSuggestions(normalizedIngredient.replace(/_/g, " "))
        .map(s => s.display)
        .slice(0, 3);
      
      if (suggestions.length > 0) {
        throw new Error(`Unknown ingredient "${normalizedIngredient.replace(/_/g, " ")}". Did you mean: ${suggestions.join(", ")}?`);
      } else {
        throw new Error(`Unknown ingredient "${normalizedIngredient.replace(/_/g, " ")}". Try common ingredients like flour, sugar, salt, etc.`);
      }
    }
  }

  async convertUnit(input) {
    const { value, unit, ingredient, targetUnit } = this.parseConvertInput(input);
    const normalizedUnit = this.normalizeUnit(unit);
    const normalizedIngredient = this.normalizeIngredient(ingredient);
    
    // Validate ingredient
    this.validateIngredient(normalizedIngredient);
    
    const cacheKey = `${value}-${normalizedUnit}-${normalizedIngredient}-${targetUnit || ""}`.toLowerCase();

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

    // Process result
    let result;
    if (targetUnit) {
      const normalizedTargetUnit = this.normalizeUnit(targetUnit);
      result = conversions[normalizedTargetUnit] || conversions[targetUnit.toLowerCase()];
      
      if (result === undefined) {
        // Check if target unit exists in any form
        const possibleUnits = Object.keys(conversions);
        const suggestions = possibleUnits.slice(0, 3).map(u => u.replace(/_/g, " "));
        throw new Error(`Cannot convert to ${targetUnit}. Available units: ${suggestions.join(", ")}`);
      }
      
      console.log(`Targeted Result: ${result}`);
    } else {
      result = conversions;
    }

    // Store in cache and increment request count
    this.#cache.set(cacheKey, result);
    this.#requestCount++;
    return this.formatResult(value, normalizedUnit, normalizedIngredient, result, targetUnit);
  }

  normalizeUnit(unit) {
    const unitMap = {
      // Singular to plural mappings
      "cup": "cups",
      "teaspoon": "teaspoons",
      "tsp": "teaspoons",
      "tablespoon": "tablespoons",
      "tbsp": "tablespoons",
      "ounce": "oz",
      "ounces": "oz",
      "pound": "lbs",
      "pounds": "lbs",
      "milliliter": "milliliters",
      "ml": "milliliters",
      "liter": "liters",
      "l": "liters",
      "gram": "grams",
      "g": "grams",
      "quart": "quarts",
      "qt": "quarts",
      "pint": "pints",
      "pt": "pints",
      "fl oz": "fl_oz",
      "fluid ounce": "fl_oz",
      "fluid ounces": "fl_oz"
    };
    
    const normalized = unit.toLowerCase().trim();
    return unitMap[normalized] || normalized;
  }

  formatResult(value, unit, ingredient, result, targetUnit) {
    const readableIngredient = ingredient.replace(/_/g, " ");
    
    if (typeof result === "object" && result !== null) {
      // Format multiple conversions
      const conversions = Object.entries(result)
        .map(([unit, value]) => {
          const readableUnit = unit.replace(/_/g, " ");
          return `${parseFloat(value).toFixed(2)} ${readableUnit}`;
        })
        .join(", ");
      
      return `${value} ${unit} ${readableIngredient} = ${conversions}`;
    }
    
    // Single conversion
    const readableTargetUnit = targetUnit ? targetUnit.replace(/_/g, " ") : "";
    return `${value} ${unit} ${readableIngredient} = ${parseFloat(result).toFixed(2)} ${readableTargetUnit}`.trim();
  }

  scaleRecipe(input) {
    const { value, unit, ingredient, originalServings, newServings } = this.parseScaleInput(input);
    const normalizedIngredient = this.normalizeIngredient(ingredient);
    
    // Validate ingredient
    this.validateIngredient(normalizedIngredient);
    
    const scaleFactor = parseInt(newServings) / parseInt(originalServings);
    const newQuantity = (parseFloat(value) * scaleFactor).toFixed(2);
    
    const readableIngredient = normalizedIngredient.replace(/_/g, " ");
    return `${value} ${unit} ${readableIngredient} for ${originalServings} servings = ${newQuantity} ${unit} for ${newServings} servings`;
  }

  // New method to get ingredient suggestions for autocomplete
  getSuggestions(partial) {
    return getIngredientSuggestions(partial);
  }

  // Clear cache method
  clearCache() {
    this.#cache.clear();
    console.log("Cache cleared");
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.#cache.size,
      entries: Array.from(this.#cache.keys())
    };
  }
}