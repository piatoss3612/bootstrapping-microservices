const express = require("express");
const mongodb = require("mongodb");

const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;

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

const connectDB = async () => {
  const client = await mongodb.MongoClient.connect(DB_HOST);
  return client.db(DB_NAME);
};

const setupHandlers = (app, db) => {
  const videosCollection = db.collection("videos");

  app.post("/viewed", async (req, res) => {
    const videoPath = req.body.videoPath;

    try {
      const result = await videosCollection.insertOne({ videoPath: videoPath });

      if (result && result.acknowledged) {
        res.status(201).send();
      } else {
        throw new Error("Failed to insert document");
      }
    } catch (err) {
      console.error(`Error adding video ${videoPath} to history.`);
      console.error((err && err.stack) || err);
      res.status(500).send();
    }
  });

  app.get("/history", async (req, res) => {
    const skip = parseInt(req.query.skip);
    const limit = parseInt(req.query.limit);

    try {
      const documents = await videosCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();

      res.status(200).json({ history: documents });
    } catch (err) {
      console.error(`Error retrieving history from database.`);
      console.error((err && err.stack) || err);
      res.sendStatus(500);
    }
  });
};

const startHttpServer = (db) => {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());
    setupHandlers(app, db);

    const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000;
    app.listen(port, () => {
      resolve();
    });
  });
};

const main = () => {
  return connectDB().then((db) => {
    return startHttpServer(db);
  });
};

main()
  .then(() => {
    console.log("Server started");
  })
  .catch((err) => {
    console.error("Failed to start server");
    console.error((err && err.stack) || err);
  });
