import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please add your MONGODB_URI to Vercel Environment Variables');
}

const options: MongoClientOptions = {
  // Increased timeouts for home-hosted servers
  serverSelectionTimeoutMS: 30000, 
  connectTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  maxPoolSize: 1,
};

// Auto-detect if we need directConnection (usually for single-node home setups)
if (!uri.includes('replicaSet=') && !uri.startsWith('mongodb+srv')) {
  options.directConnection = true;
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

const getClientPromise = (): Promise<MongoClient> => {
  if (clientPromise) return clientPromise;

  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(err => {
    console.error('FAILED TO CONNECT TO MONGODB:', err.message);
    // Clear the promise so the next request can try again
    (clientPromise as any) = null;
    throw err;
  });

  return clientPromise;
};

export default getClientPromise;