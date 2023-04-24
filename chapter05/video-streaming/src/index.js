const express = require("express");
const fs = require("fs");
const http = require("http");

const port = process.env.PORT;

if (!port) {
  throw new Error(
    "Please specify the port number for the HTTP server with the environment variable PORT."
  );
}

const sendViewdMessage = (videoPath) => {
  const postOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const requestBody = {
    videoPath: videoPath,
  };

  const req = http.request("http://history/viewed", postOptions);

  req.on("close", () => {
    console.log("Sent 'viewed' message to history microservice.");
  });

  req.on("error", (err) => {
    console.error("Failed to send 'viewed' message!");
    console.error((err && err.stack) || err);
  });

  req.write(JSON.stringify(requestBody));
  req.end();
};

const setupHandlers = (app) => {
  app.get("/video", (req, res) => {
    const path = "./videos/SampleVideo_1280x720_1mb.mp4";

    fs.stat(path, (err, stats) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err.message);
      }

      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(path).pipe(res);

      sendViewdMessage(path);
    });
  });
};

const startHttpServer = () => {
  return new Promise((resolve) => {
    const app = express();
    setupHandlers(app);

    app.listen(port, () => {
      resolve();
    });
  });
};

const main = () => {
  return startHttpServer();
};

main()
  .then(() => {
    console.log(`Listening on port ${port}`);
  })
  .catch((err) => {
    console.error("Microservice failed to start.");
    console.error((err && err.stack) || err);
  });
