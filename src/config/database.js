const mongoose = require('mongoose');

/**
 * Initialize MongoDB connection
 * Requires MONGO_URI environment variable
 */
async function connectDatabase() {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('[Database] MONGO_URI environment variable is not defined');
      console.warn('[Database] Make sure to set MONGO_URI in your .env file');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });

    console.log('[Database] Connected to MongoDB successfully');
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    console.warn('[Database] Server will start but without database connectivity');
    console.warn('[Database] Make sure MongoDB is running and MONGO_URI is correct in .env');
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Disconnected from MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error('[Database] Connection error:', error.message);
});

connectDatabase();

module.exports = mongoose;
