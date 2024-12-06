import Hypercore from "hypercore";
import Hyperbee from "hyperbee";
import RAF from "random-access-file";
export class CryptoDataStorage {
  constructor() {
    // Ensure storage path exists
    this.core = null;
    this.bee = null;
  }

  async initialize() {
    this.core = new Hypercore(RAF);
    this.bee = new Hyperbee(this.core, {
      keyEncoding: "utf-8",
      valueEncoding: "json",
    });
    await this.bee.ready();
  }

  async storePriceData(priceData) {
    if (!this.bee) await this.initialize();

    console.log("StorePriceData called with:", priceData);
    // Store the price data snapshot
    const key = `prices:${Date.now()}`;
    await this.bee.put(key, priceData);

    for (const [symbol, data] of Object.entries(priceData)) {
      const indexKey = `latest:${symbol.toLowerCase()}`;
      this.bee.put(indexKey, {
        averagePrice: data.averagePrice,
        timestamp: data.timestamp,
      });
    }
  }

  async getLatestPrices(pairs = []) {
    if (!this.bee) await this.initialize();

    console.log("GetLatestPrices called with:", pairs);
    const prices = {};
    for (const pair of pairs) {
      const result = await this.bee.get(`latest:${pair.toLowerCase()}`);
      console.log(result);
      console.log(`Result for ${pair}:`, result);
      if (result) prices[pair] = result.value;
    }
    return prices;
  }

  async getHistoricalPrices(pairs = [], from = 0, to = Date.now()) {
    if (!this.bee) await this.initialize();

    const historicalPrices = {};

    // Iterate through all keys to find historical data
    for await (const { key, value } of this.bee.createReadStream()) {
      if (key.startsWith("prices:")) {
        const timestamp = parseInt(key.split(":")[1]);
        if (timestamp >= from && timestamp <= to) {
          for (const [symbol, data] of Object.entries(value)) {
            if (pairs.length === 0 || pairs.includes(symbol)) {
              if (!historicalPrices[symbol]) historicalPrices[symbol] = [];
              historicalPrices[symbol].push({
                timestamp,
                ...data,
              });
            }
          }
        }
      }
    }

    return historicalPrices;
  }
  async destroy() {
    if (this.bee) await this.bee.close();
    if (this.core) await this.core.close();
  }
}
