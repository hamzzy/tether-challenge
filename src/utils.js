export class RateLimiter {
  constructor(requestsPerMinute = 30) {
    this.requestsPerMinute = requestsPerMinute;
    this.timeWindow = 60000; // 1 minute in milliseconds
    this.requestTimestamps = [];
  }

  async wait() {
    const now = Date.now();

    // Remove timestamps older than the time window (1 minute)
    this._cleanUpOldRequests(now);

    // Check if the rate limit is exceeded
    if (this.requestTimestamps.length >= this.requestsPerMinute) {
      const waitTime = this.timeWindow - (now - this.requestTimestamps[0]);

      // If we have exceeded the rate limit, wait for the remaining time
      if (waitTime > 0) {
        await this._sleep(waitTime);
      }
    }

    // Record the current request timestamp
    this.requestTimestamps.push(now);
  }

  _cleanUpOldRequests(now) {
    // Remove timestamps that are outside the time window
    while (this.requestTimestamps.length > 0 && this.requestTimestamps[0] <= now - this.timeWindow) {
      this.requestTimestamps.shift();
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}