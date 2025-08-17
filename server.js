const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const authRouter = require("./src/routes/auth.routes");
const recruiterRouter = require("./src/routes/recruiter.routes");
const adminRouter = require("./src/routes/admin.routes");
const jobRouter = require("./src/routes/job.routes");
const applicationRouter = require("./src/routes/application.routes");

const port = process.env.PORT;
const mongoConnection = process.env.MONGODB_URI;
const frontendDomain = process.env.FRONTEND_DOMAIN;

mongoose
  .connect(mongoConnection)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting", err);
  });

const corsOptions = {
  origin: frontendDomain,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Job portal API is running");
});

app.use("/api/candidate", authRouter);
app.use("/api/recruiter", recruiterRouter);
app.use("/api/user", adminRouter);
app.use("/api/job", jobRouter);
app.use("/api/application", applicationRouter);

app.listen(port, () => {
  console.log(`server running on http://localhost:${port}`);
});
