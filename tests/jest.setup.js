const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Start in-memory MongoDB instance
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  // use mongoose.connect options compatible with current mongoose
  await mongoose.connect(uri);
}, 60000);

// Clean up DB between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Stop DB
afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
