const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectDB = require("./src/config/dbConnect");
const authRouter = require("./src/routes/auth.routes");
const recruiterRouter = require("./src/routes/recruiter.routes");
const adminRouter = require("./src/routes/admin.routes");
const jobRouter = require("./src/routes/job.routes");
const applicationRouter = require("./src/routes/application.routes");
const companyRouter = require("./src/routes/company.routes");

const port = process.env.PORT;
const mongoConnection = process.env.MONGODB_URI;
const frontendDomain = process.env.FRONTEND_DOMAIN;

connectDB(mongoConnection);

const corsOptions = {
  origin: frontendDomain,
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.get("/", (req, res) => {
  res.send("Job portal API is running");
});

app.use("/api/candidate", authRouter);
app.use("/api/recruiter", recruiterRouter);
app.use("/api/user", adminRouter);
app.use("/api/job", jobRouter);
app.use("/api/application", applicationRouter);
app.use("/api/company", companyRouter);

app.listen(port, () => {
  console.log(`server running on http://localhost:${port}`);
});
