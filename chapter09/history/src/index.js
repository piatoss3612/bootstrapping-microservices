const express = require("express");
const mongodb = require("mongodb");
const amqp = require("amqplib");

if (!process.env.DBHOST) {
  throw new Error(
    "Please specify the databse host using environment variable DBHOST."
  );
}

if (!process.env.DBNAME) {
  throw new Error(
    "Please specify the name of the database using environment variable DBNAME"
  );
}

if (!process.env.RABBIT) {
  throw new Error(
    "Please specify the name of the RabbitMQ host using environment variable RABBIT"
  );
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

const connectDb = async () => {
  const client = await mongodb.MongoClient.connect(DBHOST);
  if (!client) {
    throw new Error("Could not connect to database");
  }
  return client.db(DBNAME);
};

const connectRabbit = async () => {
  console.log(`Connecting to RabbitMQ at ${RABBIT}`);

  const connection = await amqp.connect(RABBIT);
  if (!connection) {
    throw new Error("Unable to connect to RabbitMQ");
  }

  const messageChannel = await connection.createChannel();
  if (!messageChannel) {
    throw new Error("Unable to create channel");
  }

  return messageChannel;
};

const setupHandlers = async (app, db, messageChannel) => {
  const videosCollection = db.collection("videos");

  app.get("/videos", async (req, res) => {
    try {
      const videos = await videosCollection.find().toArray();
      res.status(200).json({ videos });
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  });

  const consumeViewedMessage = async (msg) => {
    console.log("Received a 'viewed' message");

    const parsedMsg = JSON.parse(msg.content.toString());

    try {
      await videosCollection.insertOne({
        videoId: parsedMsg.video.id,
        watched: new Date(),
      });

      console.log("Acknowledging message was handled.");
      messageChannel.ack(msg);
    } catch (err) {
      console.error(err);
    }
  };

  await messageChannel.assertExchange("viewed", "fanout");
  const { queue } = await messageChannel.assertQueue("", {});
  await messageChannel.bindQueue(queue, "viewed", "");
  return messageChannel.consume(queue, consumeViewedMessage);
};

const startHttpServer = (db, messageChannel) => {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());
    setupHandlers(app, db, messageChannel);

    const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000;
    app.listen(port, () => {
      resolve();
    });
  });
};

const main = async () => {
  const db = await connectDb();
  if (!db) {
    throw new Error("Unable to connect to database");
  }

  const messageChannel = await connectRabbit();
  if (!messageChannel) {
    throw new Error("Unable to connect to RabbitMQ");
  }

  return startHttpServer(db, messageChannel);
};

main()
  .then(() => {
    console.log("History service started");
  })
  .catch((err) => {
    console.error("Unable to start history service");
    console.error((err && err.stack) || err);
  });
