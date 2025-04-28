import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set up DATABASE_URL based on environment
let DATABASE_URL;
if (process.env.NODE_ENV === 'TEST') {
  DATABASE_URL = process.env.DATABASE_URL_TEST;
} else {
  DATABASE_URL = process.env.DATABASE_URL;
}

// Ensure DATABASE_URL is available in the environment
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in your environment variables!');
  process.exit(1); // Exit the process if DATABASE_URL is missing
}

// Create a new Pool instance to manage PostgreSQL connections
const pool = new Pool({ connectionString: DATABASE_URL });

// Handling successful connection
pool.on('connect', () => {
  console.log('✅ Connected to the database');
});

// Handling errors during connection
pool.on('error', (err) => {
  console.error('❌ Error connecting to the database:', err.message);
  console.error('Error stack:', err.stack); // Full error stack for better debugging
  // Exit the process if there is a critical error with DB connection
  process.exit(1);
});

// Connection retry logic with timeout and backoff
const connectWithRetry = () => {
  console.log('⏳ Attempting to connect to the database...');
  
  const timeout = 10000; // 10 seconds timeout
  const retryInterval = 5000; // Retry every 5 seconds
  const maxRetries = 5; // Retry up to 5 times
  let attempts = 0;

  const connectPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('❌ Connection timed out!'));
    }, timeout);

    const tryConnection = () => {
      if (attempts >= maxRetries) {
        clearTimeout(timer);
        reject(new Error(`❌ Failed to connect after ${maxRetries} attempts!`));
        return;
      }

      attempts += 1;

      pool.connect((err, client, done) => {
        if (err) {
          console.error(`❌ Connection attempt ${attempts} failed. Retrying...`);
          setTimeout(tryConnection, retryInterval); // Retry after 5 seconds
        } else {
          // Connection was successful
          console.log('✅ Successfully connected to the database');
          clearTimeout(timer); // Clear the timer when connection is successful
          done(); // Release the client back to the pool after using it
          resolve();
        }
      });
    };

    tryConnection();
  });

  connectPromise.catch((err) => {
    console.error('❌ Failed to connect:', err.message);
  });
};

// Start the initial database connection attempt
connectWithRetry();

// Graceful shutdown and cleanup
process.on('SIGINT', () => {
  console.log('🛑 Gracefully shutting down the application...');
  pool.end(() => {
    console.log('✅ Database connection pool closed');
    process.exit(0); // Exit the process gracefully after closing the pool
  });
});

export default pool;
