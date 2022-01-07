import express from "express";

// Require API routes
import test from "./routes/test";

// Create express instance
const app = express();

// Import API Routes
app.use(test);

// Start standalone server if directly running
if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on port ${port}`);
  });
}

// Export express app
export default app;
