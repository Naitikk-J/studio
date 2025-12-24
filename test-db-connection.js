require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  if (!MONGODB_URI) {
    console.error('✗ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  console.log('Testing MongoDB connection...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ MongoDB connection successful!');
    // You can also list collections to be sure
    const collections = await client.db().listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
