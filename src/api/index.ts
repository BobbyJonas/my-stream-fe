import express from "express";

import routes from "./routes";
// Create express instance
const app = express();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.all("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Import API Routes
app.use("/", routes);

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
