import Conversion from "./Conversion.mjs";

export default class ConversionCore {
  #converter;

  constructor(apiKey) {
    this.#converter = new Conversion(apiKey);
  }

  async convertUnit(value, fromUnit, toUnit) {
    if (!value || !fromUnit || !toUnit) {
      throw new Error(`Please enter a value and valid units ("10 meters to feet")`);
    }

    const numValue = parseFloat(value);
    if (numValue <= 0) {
      throw new Error("Negative values are not supported");
    }
    const conversionPair = `${fromUnit}-${toUnit}`;
    if (!this.isSupportedConversion(conversionPair)) {
      throw new Error("Conversion not supported by this API");
    }
    const result = await this.#converter.convert(value, fromUnit, toUnit);
    return result;
  }

  parseInput(input) {
    const match = input.match(/(\d+\.?\d*)\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)/i);
    return match ? [parseFloat(match[1]), match[2].toLowerCase(), match[3].toLowerCase()] : [];
  }

  isSupportedConversion(pair) {
    const supportedPairs = [
      "kg-g", "g-kg", "lb-kg", "kg-lb", "oz-g", "g-oz", "km-m", "m-km", "mi-km", "km-mi",
      "l-ml", "ml-l", "gal-l", "l-gal", "ft-m", "m-ft", "in-cm", "cm-in", "F-C", "C-F",
      "J-cal", "cal-J", "mph-kmh", "kmh-mph", "deg-rad", "rad-deg", "m/s-ft/s", "ft/s-m/s",
      "m/s-mph", "mph-m/s", "m/s-km/h", "km/h-m/s", "m-yd", "yd-m", "m-mi", "mi-m", "m-ly", "ly-m",
      "s-min", "min-s", "s-h", "h-s", "s-d", "d-s", "s-week", "week-s", "year-d", "d-year", "year-s",
      "l-oz", "oz-l", "lb-oz", "oz-lb", "ft-in", "in-ft", "tsp-ml", "ml-tsp", "tbsp-ml", "ml-tbsp",
      "cup-ml", "ml-cup", "floz-ml", "ml-floz", "pint-ml", "ml-pint", "quart-ml", "ml-quart",
      "gal-ml", "ml-gal"
    ]
    return supportedPairs.includes(pair);
  }
}