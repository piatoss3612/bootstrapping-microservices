const express = require("express");
const fs = require("fs");

const app = express();

if (!process.env.PORT) {
  throw new Error(
    "Please specify the port number for the HTTP server with the environment variable PORT."
  );
}

const port = process.env.PORT;

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
  });
});

app.listen(port, () => {
  console.log(`Video streaming app listening at http://localhost:${port}`);
});
