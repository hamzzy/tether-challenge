import RPC from '@hyperswarm/rpc';
import DHT from 'hyperdht';

export class CryptoRPCClient {
  constructor(serverPublicKey) {
    this.serverPublicKey = Buffer.from(serverPublicKey, 'hex');
    this.dht = null;
    this.rpc = null;
  }

  async initialize() {
    // Setup DHT
    this.dht = new DHT({
      port: 50001,
      bootstrap: [{ host: '127.0.0.1', port: 30001 }]
    });
    await this.dht.ready();

    // Setup RPC
    this.rpc = new RPC({ dht: this.dht });
  }

  async getLatestPrices(pairs) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 5000)  // 5 seconds timeout
    );
    const payload = Buffer.from(JSON.stringify({ pairs }), 'utf-8');
    try {
      console.log('Requesting latest prices for:', pairs);
      const respRaw = await Promise.race([
        this.rpc.request(this.serverPublicKey, 'getLatestPrices', payload),
        timeout
      ]);
      return JSON.parse(respRaw.toString('utf-8'));
    } catch (error) {
      console.error('Error while fetching latest prices:', error);
      return { error: 'Failed to fetch latest prices' };
    }
  }
  
  async getHistoricalPrices(pairs, from, to) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 5000)  // 5 seconds timeout
    );
    const payload = Buffer.from(JSON.stringify({ pairs, from, to }), 'utf-8');
    try {
      console.log('Requesting historical prices for:', pairs, from, to);
      const respRaw = await Promise.race([
        this.rpc.request(this.serverPublicKey, 'getHistoricalPrices', payload),
        timeout
      ]);
      return JSON.parse(respRaw.toString('utf-8'));
    } catch (error) {
      console.error('Error while fetching historical prices:', error);
      return { error: 'Failed to fetch historical prices' };
    }
  }

  async destroy() {
    try {
      await this.rpc.destroy();
      await this.dht.destroy();
      console.log('CryptoRPCClient successfully destroyed.');
    } catch (error) {
      console.error('Error during client shutdown:', error);
    }
  }
}

// Example usage
async function main() {
  const client = new CryptoRPCClient('a1e32735e11919933d446f517ccd2cb7406c9c6b11c5a219c74e455c0a950a5d');
  await client.initialize();

  try {
    // Get latest prices for specific pairs
    const latestPrices = await client.getLatestPrices(['btc','usdt']);
    console.log('Latest Prices:', latestPrices);

    // Get historical prices for a time range
    const historicalPrices = await client.getHistoricalPrices(
      ['btc', 'xrp'], 
      Date.now() - 24 * 60 * 60 * 1000,  // 24 hours ago
      Date.now()
    );
    console.log('Historical Prices:', historicalPrices);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.destroy();
  }
}

// Uncomment to run
main().catch(console.error);