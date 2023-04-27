describe("metadata microservice", () => {
  const mockListenFn = jest.fn((port, callback) => callback()); // Mock the listen function of express app
  const mockGetFn = jest.fn(); // Mock the get function of express app

  // Mock the express module
  jest.doMock("express", () => {
    return () => {
      return {
        listen: mockListenFn,
        get: mockGetFn,
      };
    };
  });

  const mockVideosCollection = {}; // Mock the videos mongodb collection

  // Mock the mongodb database
  const mockDb = {
    collection: () => mockVideosCollection,
  };

  // Mock the mongodb client
  const mockMongoClient = {
    db: () => mockDb,
  };

  // Mock the mongodb module
  jest.doMock("mongodb", () => {
    return {
      MongoClient: {
        connect: async () => mockMongoClient,
      },
    };
  });

  const { startMicroservice } = require("./index"); // Import the microservice

  test("microservice starts web server on startup", async () => {
    await startMicroservice();

    expect(mockListenFn.mock.calls.length).toEqual(1);
    expect(mockListenFn.mock.calls[0][0]).toEqual(3000);
  });

  test("/videos route is handled", async () => {
    await startMicroservice();

    expect(mockGetFn).toHaveBeenCalled();

    const videoRoute = mockGetFn.mock.calls[0][0];
    expect(videoRoute).toEqual("/videos");
  });

  test("/videos route retreives data via videos collection", async () => {
    await startMicroservice();

    const mockRequest = {};
    const mockJsonFn = jest.fn();
    const mockResponse = {
      json: mockJsonFn,
    };

    const mockRecord1 = {};
    const mockRecord2 = {};

    mockVideosCollection.find = () => {
      return {
        toArray: async () => [mockRecord1, mockRecord2],
      };
    };

    const videosRouteHandler = mockGetFn.mock.calls[0][1];
    await videosRouteHandler(mockRequest, mockResponse);

    expect(mockJsonFn.mock.calls.length).toEqual(1);
    expect(mockJsonFn.mock.calls[0][0]).toEqual({
      videos: [mockRecord1, mockRecord2],
    });
  });
});
