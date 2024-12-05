import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
import crypto from 'crypto';
import fs from 'fs';
import RAM  from 'random-access-memory'

export class CryptoDataStorage {
  constructor(storagePath = './db') {
    // Ensure storage path exists
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    
    this.storagePath = storagePath;
    this.core = null;
    this.bee = null;
  }

  async initialize() {
    // Create Hypercore
    this.core = new Hypercore(RAM, {
      valueEncoding: 'json'
    });
    await this.core.ready();

    // Create Hyperbee on top of Hypercore
    this.bee = new Hyperbee(this.core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    });
    await this.bee.ready();
  }

  async storePriceData(priceData) {
    if (!this.bee) await this.initialize();

    // Store the entire price data snapshot
    const key = `prices:${Date.now()}`;
    await this.bee.put(key, priceData);

    // Create index for quick retrieval
    for (const [symbol, data] of Object.entries(priceData)) {
      const indexKey = `latest:${symbol}`;
      await this.bee.put(indexKey, {
        averagePrice: data.averagePrice,
        timestamp: data.timestamp
      });
    }
  }

  async getLatestPrices(pairs = []) {
    if (!this.bee) await this.initialize();

    const prices = {};
    for (const pair of pairs) {
      const result = await this.bee.get(`latest:${pair.toLowerCase()}`);
      if (result) prices[pair] = result.value;
    }
    return prices;
  }

  async getHistoricalPrices(pairs = [], from = 0, to = Date.now()) {
    if (!this.bee) await this.initialize();

    const historicalPrices = {};
    
    // Iterate through all keys to find historical data
    for await (const { key, value } of this.bee.createReadStream()) {
      if (key.startsWith('prices:')) {
        const timestamp = parseInt(key.split(':')[1]);
        if (timestamp >= from && timestamp <= to) {
          for (const [symbol, data] of Object.entries(value)) {
            if (pairs.length === 0 || pairs.includes(symbol)) {
              if (!historicalPrices[symbol]) historicalPrices[symbol] = [];
              historicalPrices[symbol].push({
                timestamp,
                ...data
              });
            }
          }
        }
      }
    }

    return historicalPrices;
  }
}