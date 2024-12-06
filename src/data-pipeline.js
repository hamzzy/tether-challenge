import schedule from 'node-schedule';
import { CryptoDataFetcher } from './data-fetcher.js';
import { CryptoDataStorage } from './data-storage.js';

export class CryptoPipeline {
  constructor(intervalSeconds = 30) {
    this.intervalSeconds = intervalSeconds;
    this.dataStorage = new CryptoDataStorage();
    this.scheduledJob = null;
    this.dataFetcher = new CryptoDataFetcher()
  }

  async runPipeline() {
    try {
      // Fetch top cryptocurrencies and exchanges
      const cryptocurrencies = await this.dataFetcher.getTopCryptocurrencies(5);
      const exchanges = await this.dataFetcher.getTopExchanges(3);

      // Fetch and process price data
      const priceData = await this.dataFetcher.fetchCryptoPrices(cryptocurrencies, exchanges);
      // console.log(priceData)
      // // Store the data
      await this.dataStorage.storePriceData(priceData);
      console.log('Data pipeline completed successfully');
    } catch (error) {
      console.error('Error in data pipeline:', error);
    }
  }

  startSchedule() {
    // Run immediately and then schedule
    this.runPipeline();
    
    this.scheduledJob = schedule.scheduleJob(`*/${this.intervalSeconds} * * * * *`, async () => {
      await this.runPipeline();
    });
  }

  stopSchedule() {
    if (this.scheduledJob) {
      this.scheduledJob.cancel();
    }
  }
}