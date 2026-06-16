const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { config } = require("./config/config");
const connectDB = require("./config/db");
require("./config/redis");
const { registerSocketHandlers } = require("./socket/sockethandlers");
const { connectRabbitMQ } = require("./config/rabbitmq");
const { initProducer } = require("./modules/notifications/rabbitmq.producer");
const { startEmailConsumer } = require("./modules/notifications/rabbitmq.consumer");

async function startServer() {
  const port = config.port || 5000;

  await connectDB();
  
  try {
    await connectRabbitMQ();
    await initProducer();
    await startEmailConsumer();
  } catch (error) {
    console.error("RabbitMQ initialization failed:", error.message);
    // Depending on criticality, you might want to process.exit(1) here
  }

  const httpServer = http.createServer(app);
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean);
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    registerSocketHandlers(socket, io);

    socket.on("disconnect", (reason) => {
      console.log("User disconnected:", socket.id, "Reason:", reason);
    });
  });

  httpServer.listen(port, () => {
    const env = process.env.NODE_ENV || "development";
    console.log(`[${new Date().toISOString()}] Server running on port ${port} (${env})`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
