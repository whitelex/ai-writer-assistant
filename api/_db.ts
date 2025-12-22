
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  connectTimeoutMS: 10000, // 10 second timeout for cold starts
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  console.error('CRITICAL: MONGODB_URI is not defined in environment variables.');
  throw new Error('Please add your Mongo URI to Vercel Environment Variables');
}

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect().catch(err => {
      console.error('Failed to connect to MongoDB (Dev):', err);
      throw err;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(err => {
    console.error('Failed to connect to MongoDB (Prod):', err);
    throw err;
  });
}

export default clientPromise;
