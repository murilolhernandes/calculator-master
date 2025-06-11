export default class Cooking {
  #apiKey;
  #apiUrl = "https://food-unit-of-measurement-converter.p.rapidapi.com/convert";

  constructor(apiKey) {
    if (!apiKey) throw new Error("API key is required.");
    this.#apiKey = apiKey;
  }

  async convert(value, unit, ingredient) {
    try {
      const url = new URL(this.#apiUrl);
      url.searchParams.append("value", value);
      url.searchParams.append("unit", unit);
      url.searchParams.append("ingredient", ingredient);

      console.log(`Request URL: ${url.toString()}`);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": this.#apiKey,
          "X-RapidAPI-Host": "food-unit-of-measurement-converter.p.rapidapi.com",
        }
      });
      console.log(`Response Status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} - ${await response.text() || "No details"}`);
      }
      const data = await response.json();
      console.log(`API Response: ${JSON.stringify(data, null, 2)}`);
      if (data.error) {
        throw new Error(data.error);
      }
      console.log(`Available Keys: ${Object.keys(data)}`);
      return data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}