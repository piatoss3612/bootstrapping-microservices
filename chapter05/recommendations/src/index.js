const express = require("express");
const amqp = require("amqplib");

const RABBIT = process.env.RABBIT;

if (!RABBIT) {
  throw new Error(
    "Please specify the URL of the RabbitMQ server with the environment variable RABBIT."
  );
}

const connectRabbit = async () => {
  const conn = await amqp.connect(RABBIT);
  return conn.createChannel();
};

const setupHandlers = async (app, msgChannel) => {
  const consumeViewdMessage = async (msg) => {
    const parsedMsg = JSON.parse(msg.content.toString());
    console.log("Received a 'viewed' message:");
    console.log(JSON.stringify(parsedMsg, null, 4));

    console.log("Acknowledging message was handled.");

    msgChannel.ack(msg);
  };

  await msgChannel.assertExchange("viewed", "fanout");
  const { queue } = await msgChannel.assertQueue("", {});
  await msgChannel.bindQueue(queue, "viewed", "");

  return msgChannel.consume(queue, consumeViewdMessage);
};

const startHttpServer = (msgChannel) => {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    setupHandlers(app, msgChannel);

    const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000;
    app.listen(port, () => {
      resolve();
    });
  });
};

const main = async () => {
  const msgChannel = await connectRabbit();

  return startHttpServer(msgChannel);
};

main()
  .then(() => {
    console.log("Server started.");
  })
  .catch((err) => {
    console.error("Failed to start server");
    console.error((err && err.stack) || err);
  });
