import Construction from "./Construction.mjs";

export default class ConstructionCore {
  #converter;

  constructor(apiKey) {
    this.#converter = new Construction(apiKey);
  }

  async convertUnit(input) {
    const [value, fromUnit, toUnit] = this.parseInput(input);
    if (!value || !fromUnit || !toUnit) {
      throw new Error(`Please enter a value and valid units ("10 meters to feet")`);
    }

    // Determine appropriate endpoint based on unit type
    const endpoint = this.determineEndPoint(fromUnit, toUnit);
    return await this.#converter.convert(value, fromUnit, toUnit, endpoint);
  }

  parseInput(input) {
    const match = input.match(/(\d+\.?\d*)\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)/i);
    if (match) {
      return [parseFloat(match[1]), match[2].toLowerCase(), match[3].toLowerCase()];
    }
    return [];
  }

  determineEndPoint(fromUnit, toUnit) {
    const unitTypes = {
      length: ["meters", "feet", "yards", "inches"],
      volume: ["liters", "gallons", "cubicmeters", "cubicyards"],
      mass: ["kilograms", "pounds", "grams"]
    };

    for (let type in unitTypes) {
      if (unitTypes[type].includes(fromUnit) && unitTypes[type].includes(toUnit)) {
        return type;
      }
    }
    return "convert"; // Default endpoint if unit type is unclear
  }
}