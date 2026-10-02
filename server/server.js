const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(410).json({
    status: "retired",
    message: "SmartSafar authentication now runs in the FastAPI backend on port 8000.",
  });
});

app.use("/api/auth", (_req, res) => {
  res.status(410).json({
    detail: "The Express authentication endpoints have been retired. Use the FastAPI service on port 8000.",
  });
});

app.listen(5000, "127.0.0.1", () => {
  console.log("Legacy Express service is retired; FastAPI is the only SmartSafar API.");
});
