
import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Optimized options for Serverless/Vercel
const options: MongoClientOptions = {
  connectTimeoutMS: 10000,      // Time to wait for initial connection
  serverSelectionTimeoutMS: 5000, // Time to wait for server discovery
  socketTimeoutMS: 45000,       // Close sockets after 45s of inactivity
  maxPoolSize: 1,               // Serverless usually only needs 1 connection per instance
};

// Check if we should use directConnection (often needed for single-node home servers)
if (uri && !uri.includes('replicaSet=') && !uri.startsWith('mongodb+srv')) {
  options.directConnection = true;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  console.error('CRITICAL: MONGODB_URI is not defined.');
  throw new Error('Please add your MONGODB_URI to Vercel Environment Variables');
}

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect().catch(err => {
      console.error('MongoDB Connection Error (Dev):', err.message);
      throw err;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, it's best to not share the client between different function invocations 
  // if the environment is volatile, but Vercel handles this caching reasonably well.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(err => {
    console.error('MongoDB Connection Error (Prod):', err.message);
    throw err;
  });
}

export default clientPromise;
