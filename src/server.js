require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const port = Number(process.env.PORT || 5000);

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  await connectDB();
  const server = app.listen(port, () => console.log(`Doctor Tracker API listening on port ${port}`));
  const shutdown = async (signal) => {
    console.log(`${signal} received; closing server.`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('Failed to start API:', error.message);
  process.exit(1);
});
