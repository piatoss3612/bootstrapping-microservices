const express = require("express");
const azure = require("@azure/storage-blob");

const app = express();

const port = process.env.PORT;
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
const STORAGE_ACCOUNT_KEY = process.env.STORAGE_ACCOUNT_KEY;
const STORAGE_CONNECTION_STRING = `DefaultEndpointsProtocol=https;AccountName=${STORAGE_ACCOUNT_NAME};AccountKey=${STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;

const createBlobService = () => {
  const blobService = azure.BlobServiceClient.fromConnectionString(
    STORAGE_CONNECTION_STRING
  );
  return blobService;
};

app.get("/video", async (req, res) => {
  const videoPath = req.query.path;
  const blobServiceClient = createBlobService();

  const containerName = "videos";
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(videoPath);

  const exists = await blobClient.exists();

  if (!exists) {
    return res.status(404).send("Not found");
  }

  const content = await blobClient.download();
  const stream = content.readableStreamBody;

  const headers = {
    "Content-Type": content.contentType,
    "Content-Length": content.contentLength,
  };

  res.writeHead(200, headers);
  stream.pipe(res);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
