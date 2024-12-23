import RPC from "@hyperswarm/rpc";
import DHT from "hyperdht";
import { CryptoDataStorage } from "./data-storage.js";
import { CryptoPipeline } from "./data-pipeline.js";

export class CryptoRPCServer {
  constructor() {
    this.dht = null;
    this.rpc = null;
    this.rpcServer = null;
    this.dataStorage = new CryptoDataStorage();
    this.dataPipeline = new CryptoPipeline();
  }

  async initialize() {
    // Initialize data storage and start data pipeline
    this.dataPipeline.startSchedule();

    // Setup DHT
    this.dht = new DHT({
      port: 40001,
      bootstrap: [{ host: "127.0.0.1", port: 30001 }],
    });
    await this.dht.ready();

    // Setup RPC
    this.rpc = new RPC({ dht: this.dht });
    this.rpcServer = this.rpc.createServer();

    // Register RPC methods

    this.rpcServer.respond("getLatestPrices", async (reqRaw) => {
      try {
        const req = JSON.parse(reqRaw.toString("utf-8"));
        console.log("Received request for getLatestPrices:", req.pairs);
        const prices = await this.dataStorage.getLatestPrices(req.pairs);

        return Buffer.from(JSON.stringify(prices), "utf-8");
      } catch (error) {
        console.error("Error in getLatestPrices:", error);
        return Buffer.from(
          JSON.stringify({ error: "Failed to fetch prices" }),
          "utf-8"
        );
      }
    });

    this.rpcServer.respond("getHistoricalPrices", async (reqRaw) => {
      try {
        const req = JSON.parse(reqRaw.toString("utf-8"));
        const prices = await this.dataStorage.getHistoricalPrices(
          req.pairs,
          req.from,
          req.to
        );
        return Buffer.from(JSON.stringify(prices), "utf-8");
      } catch (error) {
        console.error("Error in getHistoricalPrices:", error.message);
        return Buffer.from(
          JSON.stringify({ error: "Invalid request format or server error" }),
          "utf-8"
        );
      }
    });
    await this.rpcServer.listen();
    console.log(
      "RPC Server started. Public Key:",
      this.rpcServer.publicKey.toString("hex")
    );
  }

  async destroy() {
    this.dataPipeline.stopSchedule();
    await this.rpcServer.close();
    await this.dht.destroy();
  }
}

// Main execution
const server = new CryptoRPCServer();
server.initialize().catch(console.error);
