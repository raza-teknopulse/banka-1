import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const connectWithRetry = async () => {
  const maxRetries = 5;
  let attempts = 0;

  console.log('⏳ Attempting to connect to the database...');

  while (attempts < maxRetries) {
    try {
      const client = await pool.connect();
      console.log('✅ Successfully connected to the database');
      client.release();
      break;
    } catch (err) {
      attempts++;
      console.error(`❌ Connection attempt ${attempts} failed: ${err.message}`);
      if (attempts < maxRetries) {
        console.log('🔁 Retrying in 5 seconds...');
        await new Promise((res) => setTimeout(res, 5000));
      } else {
        console.error('❌ Max retry attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }
};

connectWithRetry();

process.on('SIGINT', () => {
  console.log('🛑 Gracefully shutting down the application...');
  pool.end(() => {
    console.log('✅ Database connection pool closed');
    process.exit(0);
  });
});

export default pool;
