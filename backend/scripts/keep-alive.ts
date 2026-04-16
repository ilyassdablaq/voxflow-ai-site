#!/usr/bin/env node

/**
 * Keep-Alive Script for Render Backend
 * Prevents Render from putting the backend service to sleep by pinging the /health endpoint
 * every 10 minutes (before the 15-minute inactivity timeout)
 */

import http from "http";
import https from "https";
import { logger } from "../src/config/logger.js";

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const PING_INTERVAL = parseInt(process.env.PING_INTERVAL || "600000", 10); // 10 minutes in milliseconds
const HEALTH_ENDPOINT = "/health";

const isHttps = BACKEND_URL.startsWith("https");
const client = isHttps ? https : http;

async function ping(): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(HEALTH_ENDPOINT, BACKEND_URL);

    const options = {
      method: "GET",
      timeout: 10000, // 10 second timeout
    };

    const request = client.request(url, options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          logger.info(
            { statusCode: response.statusCode, timestamp: new Date().toISOString() },
            "✓ Keep-alive ping successful"
          );
          resolve();
        } else {
          logger.warn(
            { statusCode: response.statusCode, timestamp: new Date().toISOString() },
            "✗ Keep-alive ping returned unexpected status"
          );
          reject(new Error(`Unexpected status code: ${response.statusCode}`));
        }
      });
    });

    request.on("error", (error) => {
      logger.error(
        { error: error.message, timestamp: new Date().toISOString() },
        "✗ Keep-alive ping failed"
      );
      reject(error);
    });

    request.on("timeout", () => {
      request.destroy();
      logger.error({ timestamp: new Date().toISOString() }, "✗ Keep-alive ping timeout");
      reject(new Error("Request timeout"));
    });

    request.end();
  });
}

async function startKeepAlive(): Promise<void> {
  logger.info(
    { backendUrl: BACKEND_URL, intervalMinutes: PING_INTERVAL / 60000 },
    "🚀 Starting keep-alive service"
  );

  // Initial ping
  try {
    await ping();
  } catch (error) {
    logger.error({ error }, "Initial ping failed, will retry");
  }

  // Schedule periodic pings
  setInterval(async () => {
    try {
      await ping();
    } catch (error) {
      logger.error({ error }, "Scheduled ping failed");
    }
  }, PING_INTERVAL);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Keep-alive service shutting down");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("Keep-alive service terminated");
    process.exit(0);
  });
}

// Start the service
startKeepAlive().catch((error) => {
  logger.error({ error }, "Failed to start keep-alive service");
  process.exit(1);
});
