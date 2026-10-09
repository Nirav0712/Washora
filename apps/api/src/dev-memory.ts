import { MongoMemoryServer } from 'mongodb-memory-server';

async function startDevInMemory() {
  console.log('⏳ Starting in-memory MongoDB instance for local development...');
  const mongod = await MongoMemoryServer.create({
    binary: { version: '7.0.14' },
  });
  const uri = mongod.getUri();
  console.log(`✅ In-memory MongoDB running at: ${uri}`);
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'development';

  // Dynamically import and run main
  require('./main');
}

startDevInMemory().catch((err) => {
  console.error('Failed to start in-memory dev server:', err);
  process.exit(1);
});
