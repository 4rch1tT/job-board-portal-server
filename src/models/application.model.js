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
      url: { type: String },
      fileName: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      publicId: {type: String}
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
