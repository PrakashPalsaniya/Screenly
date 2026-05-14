const { getChannel } = require("../../config/rabbitmq");
const {
  sendBookingConfirmationEmail,
  sendNewShowPublishedEmail,
} = require("./email.service");

const EMAIL_QUEUE = "email_notifications_queue";

const startEmailConsumer = async () => {
  try {
    const channel = await getChannel();
    
    // Ensure queue exists
    await channel.assertQueue(EMAIL_QUEUE, { durable: true });
    
    // Prefetch 1 to avoid overwhelming the worker
    await channel.prefetch(1);

    console.log(`[RabbitMQ] Consumer started. Waiting for messages in ${EMAIL_QUEUE}...`);

    channel.consume(EMAIL_QUEUE, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        const { type, data } = content;

        console.log(`[RabbitMQ] Received ${type} notification.`);

        try {
          if (type === "BOOKING_CONFIRMATION") {
            await sendBookingConfirmationEmail(data);
          } else if (type === "NEW_SHOW_PUBLISHED") {
            await sendNewShowPublishedEmail(data);
          } else {
            console.warn(`[RabbitMQ] Unknown notification type: ${type}`);
          }

          // Acknowledge message
          channel.ack(msg);
          console.log(`[RabbitMQ] ${type} processed and acknowledged.`);
        } catch (error) {
          console.error(`[RabbitMQ] Error processing ${type}:`, error.message);
          // Nack and requeue
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (error) {
    console.error("[RabbitMQ] Consumer initialization failed:", error.message);
  }
};

module.exports = {
  startEmailConsumer,
};
