const express = require("express");

const setupHandlers = (app) => {};

const startHttpServer = () => {
  return new Promise((resolve) => {
    const app = express();
    setupHandlers(app);
    const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000;
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
    console.log("Server started");
  })
  .catch((err) => {
    console.error("Failed to start server");
    console.error((err && err.stack) || err);
  });
