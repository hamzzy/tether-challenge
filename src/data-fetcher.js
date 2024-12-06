import fetch from "node-fetch";
import "dotenv/config";
import { RateLimiter } from "./utils.js";
import { URLSearchParams } from "url";

export class CryptoDataFetcher {
  constructor() {
    this.apiBaseUrl = "https://api.coingecko.com/api/v3/";
    this.apiKey = process.env.COINGECKO_API_KEY;

    // Initialize rate limiter (30 requests per minute)
    this.rateLimiter = new RateLimiter(30);

    if (!this.apiKey) {
      throw new Error(
        "CoinGecko API key is required. Please set COINGECKO_API_KEY in .env file."
      );
    }
  }

  async apiRequest(endpoint, options = {}) {
    await this.rateLimiter.wait();
    // Build query string if provided
    const queryString = options.query ? `?${options.query.toString()}` : "";

    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}${queryString}`, {
        ...options,
        headers: {
          ...options.headers,
          "x-cg-demo-api-key": this.apiKey,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in API request to ${endpoint}:`, error);
      throw error;
    }
  }

  async getTopCryptocurrencies(limit = 5) {
    const data = await this.apiRequest("coins/markets", {
      query: new URLSearchParams({
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: limit.toString(),
        page: "1",
        sparkline: "false",
      }),
    });

    // Extract required fields
    return data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
    }));
  }

  async getTopExchanges(limit = 3) {
    const data = await this.apiRequest("exchanges", {
      query: new URLSearchParams({
        order: "volume_desc",
        per_page: limit.toString(),
        page: "1",
      }),
    });

    // Extract required fields
    return data.map((exchange) => ({
      id: exchange.id,
      name: exchange.name,
    }));
  }

  async fetchCryptoPrices(cryptocurrencies, exchanges) {
    const priceData = {};

    // Build all price request promises concurrently
    const pricePromises = cryptocurrencies.map(async (crypto) => {
      const cryptoPrices = [];

      // Fetch prices for all exchanges concurrently
      const exchangePromises = exchanges.map(async (exchange) => {
        try {
          const data = await this.apiRequest("simple/price", {
            query: new URLSearchParams({
              ids: crypto.id,
              vs_currencies: "usd",
              exchange: exchange.id,
            }),
          });

          if (data[crypto.id] && data[crypto.id].usd) {
            cryptoPrices.push({
              exchange: exchange.name,
              price: data[crypto.id].usd,
            });
          }
        } catch (error) {
          console.error(
            `Error fetching price for ${crypto.name} on ${exchange.name}:`,
            error
          );
        }
      });

      // Wait for all exchange requests to complete
      await Promise.all(exchangePromises);

      // Calculate average price after fetching all exchange data
      const avgPrice =
        cryptoPrices.length > 0
          ? cryptoPrices.reduce((sum, p) => sum + p.price, 0) / cryptoPrices.length
          : null;

      priceData[crypto.symbol] = {
        name: crypto.name,
        prices: cryptoPrices,
        averagePrice: avgPrice,
        timestamp: Date.now(),
      };
    });

    // Wait for all cryptocurrency price fetches to complete
    await Promise.all(pricePromises);

    return priceData;
  }
}