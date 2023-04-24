const express = require("express");
const mongodb = require("mongodb");
const amqp = require("amqplib");

const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const RABBIT = process.env.RABBIT;

if (!DB_HOST) {
  throw new Error(
    "Please specify the host of the MongoDB database with the environment variable DB_HOST."
  );
}

if (!DB_NAME) {
  throw new Error(
    "Please specify the name of the MongoDB database with the environment variable DB_NAME."
  );
}

if (!RABBIT) {
  throw new Error(
    "Please specify the URL of the RabbitMQ server with the environment variable RABBIT."
  );
}

const connectDB = async () => {
  const client = await mongodb.MongoClient.connect(DB_HOST);
  return client.db(DB_NAME);
};

const connectRabbit = async () => {
  const conn = await amqp.connect(RABBIT);
  return conn.createChannel();
};

const setupHandlers = async (app, db, msgChannel) => {
  const videosCollection = db.collection("videos");

  const consumeViewdMessage = async (msg) => {
    console.log("Received a 'viewd' message");

    const parsedMsg = JSON.parse(msg.content.toString());

    const result = await videosCollection.insertOne({
      videoPath: parsedMsg.videoPath,
    });

    if (result && result.acknowledged) {
      console.log("Acknowledging message was handled.");
      msgChannel.ack(msg);
    }
  };

  await msgChannel.assertQueue("viewed", {});

  return msgChannel.consume("viewed", consumeViewdMessage);
};

const startHttpServer = (db, msgChannel) => {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    setupHandlers(app, db, msgChannel);

    const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000;
    app.listen(port, () => {
      resolve();
    });
  });
};

const main = async () => {
  const db = await connectDB();
  const msgChannel = await connectRabbit();

  return startHttpServer(db, msgChannel);
};

main()
  .then(() => {
    console.log("Server started");
  })
  .catch((err) => {
    console.error("Failed to start server");
    console.error((err && err.stack) || err);
  });
