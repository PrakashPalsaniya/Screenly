const amqp = require("amqplib");
const { config } = require("./config");

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  if (connection && channel) {
    return { connection, channel };
  }

  try {
    console.log("[RabbitMQ] Connecting to:", config.rabbitmqUrl);
    connection = await amqp.connect(config.rabbitmqUrl);
    
    connection.on("error", (err) => {
      console.error("[RabbitMQ] Connection error:", err.message);
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      console.warn("[RabbitMQ] Connection closed. Attempting to reconnect...");
      connection = null;
      channel = null;
    });

    channel = await connection.createChannel();
    console.log("[RabbitMQ] Connected and channel created.");

    return { connection, channel };
  } catch (error) {
    console.error("[RabbitMQ] Initialization failed:", error.message);
    throw error;
  }
};

const getChannel = async () => {
  if (!channel) {
    const res = await connectRabbitMQ();
    return res.channel;
  }
  return channel;
};

module.exports = {
  connectRabbitMQ,
  getChannel,
};
