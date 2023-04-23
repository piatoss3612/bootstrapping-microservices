const express = require("express");
const http = require("http");
const mongodb = require("mongodb");

const app = express();

const PORT = process.env.PORT;
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = process.env.VIDEO_STORAGE_PORT;

const main = async () => {
  const client = await mongodb.MongoClient.connect(DB_HOST); // Connect to the database.

  if (!client) {
    throw new Error("Failed to connect to the database.");
  }

  const db = client.db(DB_NAME);
  const videosCollection = db.collection("videos");

  await videosCollection.insertOne({
    videoPath: "SampleVideo_1280x720_1mb.mp4",
    _id: new mongodb.ObjectId("5d9e690ad76fe06a3d7ae416"),
  });

  app.get("/video", (req_1, res) => {
    const videoId = new mongodb.ObjectId(req_1.query.id);

    videosCollection
      .findOne({ _id: videoId })
      .then((videoRecord) => {
        if (!videoRecord) {
          res.sendStatus(404);
          return;
        }

        console.log(
          `Translated id ${videoId} to path ${videoRecord.videoPath}.`
        );

        const forwardRequest = http.request(
          // Forward the request to the video storage microservice.
          {
            host: VIDEO_STORAGE_HOST,
            port: VIDEO_STORAGE_PORT,
            path: `/video?path=${videoRecord.videoPath}`,
            method: "GET",
            headers: req_1.headers,
          },
          (forwardResponse) => {
            res.writeHeader(
              forwardResponse.statusCode,
              forwardResponse.headers
            );
            forwardResponse.pipe(res);
          }
        );

        req_1.pipe(forwardRequest);
      })
      .catch((err) => {
        console.error("Database query failed.");
        console.error((err && err.stack) || err);
        res.sendStatus(500);
      });
  });
  //
  // Starts the HTTP server.
  //
  app.listen(PORT, () => {
    console.log(
      `Microservice listening, please load the data file db-fixture/videos.json into your database before testing this microservice.`
    );
  });
};

main()
  .then(() => console.log("Microservice online."))
  .catch((err) => {
    console.error("Microservice failed to start.");
    console.error((err && err.stack) || err);
  });
