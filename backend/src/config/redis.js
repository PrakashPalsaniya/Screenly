const Redis = require("ioredis");
const { config } = require("./config");

const redisConnectionOptions = {
  host: config.redisHost,
  port: config.redisPort,
  retryStrategy: () => 5000,
};

if (config.redisPassword) {
  redisConnectionOptions.password = config.redisPassword;
}
if (config.redisUsername) {
  redisConnectionOptions.username = config.redisUsername;
}

const redisClient = new Redis(redisConnectionOptions);

redisClient.on("error", (error) => {
  console.error("[Redis error]:", error);
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected successfully.");
});

module.exports = redisClient;
module.exports.redisConnectionOptions = redisConnectionOptions;
