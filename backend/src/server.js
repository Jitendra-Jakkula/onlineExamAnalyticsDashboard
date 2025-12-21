const http = require("http");
const dotenv = require("dotenv");

dotenv.config();

const { createApp } = require("./app");
const { connectDb } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDb(process.env.MONGODB_URI);

  const app = createApp();
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
