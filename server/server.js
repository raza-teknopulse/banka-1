import Debug from 'debug';
import dotenv from 'dotenv';
import express from 'express';
import logger from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.json';
import route from './routes';

// Initialize dotenv to load environment variables from .env file
dotenv.config();

// Calling an instance of express
const app = express();

// Set up logging with morgan to log all incoming requests
app.use(logger('dev'));

// Middleware to parse incoming request bodies as JSON and URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve API documentation with Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Sample home route to check if the API is working
app.get('/', (req, res) => {
  res.status(200).send('The API is working');
});

// Route handler imported from routes
route(app);

// Setup Debug to log the server status
const debug = Debug('http');

// Extract the PORT from environment variables, default to 5000 if not specified
const { PORT = 5000 } = process.env;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  debug(`Server is running on PORT ${PORT}`);
});

// Export app for further testing or use
export default app;
