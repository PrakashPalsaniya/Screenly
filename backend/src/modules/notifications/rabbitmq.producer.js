const { getChannel } = require("../../config/rabbitmq");

const EMAIL_EXCHANGE = "email_notifications_exchange";
const EMAIL_QUEUE = "email_notifications_queue";
const EMAIL_ROUTING_KEY = "email_notification_key";

const initProducer = async () => {
  const channel = await getChannel();
  await channel.assertExchange(EMAIL_EXCHANGE, "direct", { durable: true });
  await channel.assertQueue(EMAIL_QUEUE, { durable: true });
  await channel.bindQueue(EMAIL_QUEUE, EMAIL_EXCHANGE, EMAIL_ROUTING_KEY);
};

const publishToEmailQueue = async (type, data) => {
  try {
    const channel = await getChannel();
    const payload = JSON.stringify({ type, data });
    
    channel.publish(EMAIL_EXCHANGE, EMAIL_ROUTING_KEY, Buffer.from(payload), {
      persistent: true,
    });
    
    console.log(`[RabbitMQ] Published ${type} notification to exchange.`);
  } catch (error) {
    console.error(`[RabbitMQ] Failed to publish ${type} notification:`, error.message);
    throw error;
  }
};

const publishBookingEmail = async (data) => {
  return publishToEmailQueue("BOOKING_CONFIRMATION", data);
};

const publishShowEmail = async (data) => {
  return publishToEmailQueue("NEW_SHOW_PUBLISHED", data);
};

module.exports = {
  initProducer,
  publishBookingEmail,
  publishShowEmail,
};
