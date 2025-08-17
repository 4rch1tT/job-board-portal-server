const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: {
      url: { type: String, required: true },
      fileName: { type: String, required: true },
      fileType: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
    coverLetter: { type: String, fileUrl: String },
    status: {
      type: String,
      enum: [
        "applied",
        "withdrawn",
        "in review",
        "shortlisted",
        "rejected",
        "hired",
      ],
      default: "applied",
    },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
