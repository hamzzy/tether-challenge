// export class RateLimiter {
//   constructor(requestsPerMinute = 30, windowMs = 60000) {
//     this.requestsPerMinute = requestsPerMinute;
//     this.windowMs = windowMs;
//     this.queue = [];
//     this.pendingRequests = [];
//   }

//   async wait() {
//     const now = Date.now();

//     // Remove old timestamps
//     this.queue = this.queue.filter(timestamp => now - timestamp < this.windowMs);

//     // Check if we've exceeded rate limit
//     if (this.queue.length >= this.requestsPerMinute) {
//       return new Promise((resolve) => {
//         this.pendingRequests.push(resolve);
//         this.processPendingRequests();
//       });
//     }

//     // Add current timestamp and resolve immediately
//     this.queue.push(now);
//     return Promise.resolve();
//   }

//   processPendingRequests() {
//     while (
//       this.pendingRequests.length > 0 && 
//       this.queue.length < this.requestsPerMinute
//     ) {
//       const resolve = this.pendingRequests.shift();
//       this.queue.push(Date.now());
//       resolve();
//     }
//   }

//   // Utility method to wrap an async function with rate limiting
//   wrap(asyncFn) {
//     return async (...args) => {
//       await this.wait();
//       return asyncFn(...args);
//     };
//   }
// }

// export default RateLimiter;



export class RateLimiter {
  constructor(requestsPerMinute = 30) {
    this.requestsPerMinute = requestsPerMinute;
    this.requestTimestamps = [];
  }

  async wait() {
    const now = Date.now();
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );

    // Check if we've exceeded the rate limit
    if (this.requestTimestamps.length >= this.requestsPerMinute) {
      // Calculate how long to wait
      const oldestRequestTime = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequestTime);
      
      // Wait if necessary
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Add current timestamp
    this.requestTimestamps.push(now);
  }
}