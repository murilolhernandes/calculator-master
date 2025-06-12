export default class Conversion {
  #apiKey;
  #apiBaseUrl = "https://measurement-units-converter.p.rapidapi.com/api/v1/market/conversions/convert";

  constructor(apiKey) {
    if (!apiKey) throw new Error("API key is required.");
    this.#apiKey = apiKey;
  }

  async convert(value, inputUnit, outputUnit) {
    try {
      const url = new URL(`${this.#apiBaseUrl}`);
      url.searchParams.append("value", value);
      url.searchParams.append("input_unit", inputUnit);
      url.searchParams.append("output_unit", outputUnit);

      // console.log(`Request URL: ${url.toString()}`);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": this.#apiKey,
          "X-RapidAPI-Host": "measurement-units-converter.p.rapidapi.com",
        }
      });
      // console.log(`Response Status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${await response.text() || "No details"}`);
      }
      const data = await response.json();
      // console.log(`API Response: ${JSON.stringify(data, null, 2)}`);
      if (data.error) {
        throw new Error(data.error);
      }
      // console.log(`API Response: ${JSON.stringify(data)}`);
      return data.output.value;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}