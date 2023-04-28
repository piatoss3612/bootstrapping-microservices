const express = require("express");
const mongodb = require("mongodb");
const amqp = require("amqplib");
const http = require("http");

if (!process.env.RABBIT) {
  throw new Error(
    "Please specify the name of the RabbitMQ host using environment variable RABBIT"
  );
}

const RABBIT = process.env.RABBIT;

const streamToHttpPost = (inputStream, uploadHost, uploadRoute, headers) => {
  return new Promise((resolve, reject) => {
    const forwardRequest = http.request({
      host: uploadHost,
      path: uploadRoute,
      method: "POST",
      headers: headers,
    });

    inputStream.on("error", reject);
    inputStream
      .pipe(forwardRequest)
      .on("error", reject)
      .on("end", resolve)
      .on("finish", resolve)
      .on("close", resolve);
  });
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

  await messageChannel.assertExchange("viewed", "fanout");
  return messageChannel;
};

const broadcastViewedMessage = (messageChannel, videoMetadata) => {
  console.log(`Publishing message on "video-uploaded" exchange.`);

  const msg = { video: videoMetadata };
  const jsonMsg = JSON.stringify(msg);
  messageChannel.publish("video-uploaded", "", Buffer.from(jsonMsg));
};

const setupHandlers = (app, messageChannel) => {
  app.post("/upload", async (req, res) => {
    const fileName = req.headers["file-name"];
    const videoId = new mongodb.ObjectId();
    const newHeaders = Object.assign({}, req.headers, { id: videoId });
    streamToHttpPost(req, "video-storage", "/upload", newHeaders)
      .then(() => {
        res.sendStatus(200);
      })
      .then(() => {
        broadcastViewedMessage(messageChannel, { id: videoId, name: fileName });
      })
      .catch((err) => {
        console.error(`Failed to capture uploaded file ${fileName}.`);
        console.error(err);
        console.error(err.stack);
        res.sendStatus(500);
      });
  });
};

const startServer = (messageChannel) => {
  return new Promise((resolve) => {
    const app = express();
    setupHandlers(app, messageChannel);

    const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000;
    app.listen(port, () => {
      resolve();
    });
  });
};

const main = async () => {
  const messageChannel = await connectRabbit();
  return startServer(messageChannel);
};

main()
  .then(() => {
    console.log("Video upload service started");
  })
  .catch((err) => {
    console.error("Unable to start video upload service");
    console.error((err && err.stack) || err);
  });
