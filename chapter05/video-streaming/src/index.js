const express = require("express");
const fs = require("fs");
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

const sendViewdMessage = (msgChannel, videoPath) => {
  const msg = { videoPath: videoPath };
  const jsonMsg = JSON.stringify(msg);

  msgChannel.publish("", "viewed", Buffer.from(jsonMsg));

  console.log(`Publishing message on "viewed" queue.`);
};

const setupHandlers = (app, msgChannel) => {
  app.get("/video", (req, res) => {
    const videoPath = "./videos/SampleVideo_1280x720_1mb.mp4";

    fs.stat(videoPath, (err, stats) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err.message);
      }

      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(videoPath).pipe(res);

      sendViewdMessage(msgChannel, videoPath);
    });
  });
};

const startHttpServer = (msgChannel) => {
  return new Promise((resolve) => {
    const app = express();
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
    console.log("Microservice online.");
  })
  .catch((err) => {
    console.error("Microservice failed to start.");
    console.error((err && err.stack) || err);
  });
