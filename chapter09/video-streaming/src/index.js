const express = require("express");
const amqp = require("amqplib");
const http = require("http");

if (!process.env.RABBIT) {
  throw new Error(
    "Please specify the name of the RabbitMQ host using environment variable RABBIT"
  );
}

const RABBIT = process.env.RABBIT;

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

const broadcastViewedMessage = (messageChannel, videoId) => {
  console.log(`Publishing message on "viewed" exchange.`);

  const msg = { video: { id: videoId } };
  const jsonMsg = JSON.stringify(msg);
  messageChannel.publish("viewed", "", Buffer.from(jsonMsg));
};

const setupHandlers = (app, messageChannel) => {
  app.get("/video", (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
      res.status(400).send("No video ID provided");
      return;
    }

    const forwardRequest = http.request(
      {
        host: "video-streaming",
        path: `/video?id=${videoId}`,
        method: "GET",
        headers: req.headers,
      },
      (forwardResponse) => {
        res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
        forwardResponse.pipe(res);
      }
    );

    req.pipe(forwardRequest);

    broadcastViewedMessage(messageChannel, videoId);
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
    console.log("Video streaming service started.");
  })
  .catch((err) => {
    console.error("Unable to start video streaming service.");
    console.error((err && err.stack) || err);
  });
