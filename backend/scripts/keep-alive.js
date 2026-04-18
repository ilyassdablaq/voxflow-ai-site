#!/usr/bin/env node

/**
 * Keep-Alive Script for Render Backend (JavaScript version)
 * Use this if you prefer not to compile TypeScript
 */

const http = require("http");
const https = require("https");

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const PING_INTERVAL = parseInt(process.env.PING_INTERVAL || "600000", 10); // 10 minutes
const KEEP_ALIVE_ENDPOINT = "/keep-alive";

const isHttps = BACKEND_URL.startsWith("https");
const client = isHttps ? https : http;

function ping() {
  return new Promise((resolve, reject) => {
    const url = new URL(KEEP_ALIVE_ENDPOINT, BACKEND_URL);

    const options = {
      method: "GET",
      timeout: 10000,
    };

    const request = client.request(url, options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          console.log(`[${new Date().toISOString()}] ✓ Keep-alive ping successful`);
          resolve();
        } else {
          console.warn(
            `[${new Date().toISOString()}] ✗ Unexpected status: ${response.statusCode}`
          );
          reject(new Error(`Status: ${response.statusCode}`));
        }
      });
    });

    request.on("error", (error) => {
      console.error(`[${new Date().toISOString()}] ✗ Ping failed: ${error.message}`);
      reject(error);
    });

    request.on("timeout", () => {
      request.destroy();
      console.error(`[${new Date().toISOString()}] ✗ Ping timeout`);
      reject(new Error("Timeout"));
    });

    request.end();
  });
}

async function startKeepAlive() {
  console.log(`🚀 Starting keep-alive service (${PING_INTERVAL / 60000} min interval)`);
  console.log(`📍 Backend URL: ${BACKEND_URL}`);

  // Initial ping
  try {
    await ping();
  } catch (error) {
    console.error("Initial ping failed, will retry");
  }

  // Schedule periodic pings
  setInterval(async () => {
    try {
      await ping();
    } catch (error) {
      // Error already logged in ping function
    }
  }, PING_INTERVAL);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Keep-alive service shutting down");
    process.exit(0);
  });
}

startKeepAlive().catch((error) => {
  console.error("Failed to start:", error.message);
  process.exit(1);
});
