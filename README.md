# Tether Crypto Data Gatherer

## Overview
This project is a cryptocurrency data gathering solution using Hyperswarm RPC and Hypercores. It fetches price data for top cryptocurrencies from CoinGecko and provides an RPC interface for retrieving latest and historical prices.

## Features
- Fetches top 5 cryptocurrencies by market cap
- Retrieves prices from top 3 exchanges
- Calculates average prices
- Stores data using Hypercore and Hyperbee
- Provides RPC methods for price retrieval
- Scheduled data collection every 30 seconds

## Technical Components
- `CryptoDataFetcher`: Fetches cryptocurrency and exchange data from CoinGecko
- `CryptoDataStorage`: Manages data storage using Hyperbee
- `CryptoPipeline`: Orchestrates data collection and storage
- `CryptoRPCServer`: Exposes RPC methods for data retrieval
- `CryptoRPCClient`: Client for interacting with the RPC server

## Setup
1. Install dependencies:
```bash
npm install
```

2. Start a DHT bootstrap node:
```bash
npx hyperdht --bootstrap --host 127.0.0.1 --port 30001
```

3. Run the server:
```bash
npm run server
```

4. Run the client (modify with your server's public key):
```bash
npm run client
```