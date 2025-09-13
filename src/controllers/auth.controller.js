const userModel = require("../models/user.model");
const jobModel = require("../models/job.model");
const uploadFileToCloudinary = require("../utils/uploadFileToCloudinary");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const saltRounds = Number(process.env.SALT_ROUNDS);
const jwtSecret = process.env.JWT_SECRET;

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, jwtSecret, { expiresIn: "7d" });
};

const registerCandidate = async (req, res) => {
  try {
    const { name, email, password, profilePic } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Please provide name" });
    }
    if (!email) {
      return res.status(400).json({ message: "Please provide email" });
    }
    if (!password) {
      return res.status(400).json({ message: "Please provide password" });
    }

    const existingCandidate = await userModel.findOne({ email });
    if (existingCandidate) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const candidate = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: "candidate",
      profilePic,
    });

    res
      .status(201)
      .cookie("token", generateToken(candidate._id, candidate.role), {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        path: "/",
      })
      .json({
        message: "Registered successfully",
        candidate: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          role: candidate.role,
        },
      });
  } catch (error) {
    console.log("Register error", error.message);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

const loginCandidate = async (req, res) => {
  try {
    const { password, email } = req.body;
    const candidate = await userModel.findOne({ email });
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const isMatch = await bcrypt.compare(password, candidate.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (candidate.isDeleted === true) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .cookie("token", generateToken(candidate._id, candidate.role), {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        path: "/",
      })
      .json({
        message: "Login sucessful",
        candidate: {
          id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          role: candidate.role,
        },
      });
  } catch (error) {
    console.log("Login error", error.message);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const logoutCandidate = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

const getCandidateProfile = async (req, res) => {
  try {
    const candidate = await userModel
      .findById(req.user._id)
      .select("-password")
      .populate("wishlist");

    if (!candidate) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCandidateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      email,
      resume,
      profilePic,
      wishlist,
      currentPassword,
      newPassword,
    } = req.body;

    const candidate = await userModel.findById(userId);
    if (!candidate || candidate.role !== "candidate") {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const updatedFields = [];

    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required to change password" });
      }
      const isMatch = await bcrypt.compare(currentPassword, candidate.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
      candidate.password = await bcrypt.hash(newPassword, saltRounds);
      updatedFields.push("Password updated successfully");
    }

    if (name && name !== candidate.name) {
      candidate.name = name;
      updatedFields.push("Name updated successfully");
    }
    if (email && email !== candidate.email) {
      const existing = await userModel.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "Email already in use" });
      }
      candidate.email = email;
      updatedFields.push("Email updated successfully");
    }
    if (resume) {
      candidate.resume = resume;
      updatedFields.push("Resume updated successfully");
    }
    if (profilePic) {
      candidate.profilePic = profilePic;
      updatedFields.push("Profile picture updated successfully");
    }
    if (wishlist) {
      candidate.wishlist = wishlist;
      updatedFields.push("Wishlist updated successfully");
    }

    await candidate.save();

    let finalMessage = "No changes made";
    if (updatedFields.length === 1) {
      finalMessage = updatedFields[0];
    } else if (updatedFields.length > 1) {
      finalMessage = "Profile updated successfully";
    }

    res.status(200).json({
      message: finalMessage,
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        resume: candidate.resume,
        profilePic: candidate.profilePic,
        wishlist: candidate.wishlist,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteCandidateProfile = async (req, res) => {
  try {
    if (req.user.role !== "candidate") {
      return res.status(403).json({ message: "Unauthorized action" });
    }
    const updatedCandidate = await userModel.findByIdAndUpdate(
      req.user._id,
      { isDeleted: true },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.status(200).json({ message: "Profile marked as deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { jobId } = req.body;

    const job = await jobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const candidate = await userModel.findById(req.user._id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (candidate.wishlist.some((id) => id.toString() === jobId)) {
      return res.status(400).json({ message: "Job already in wishlist" });
    }
    candidate.wishlist.push(jobId);
    await candidate.save();

    res.status(200).json({ message: "Job added to wishlist" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { jobId } = req.body;

    const job = await jobModel.findById(jobId);
    if (req.user.role !== "candidate") {
      return res
        .status(403)
        .json({ message: "Only candidates can remove from wishlist" });
    }
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const candidate = await userModel.findById(req.user._id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.wishlist = candidate.wishlist.filter(
      (id) => id.toString() !== jobId
    );
    await candidate.save();

    res.status(200).json({ message: "Job removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const uploadCandidateProfilePic = async (req, res) => {
  try {
    // console.log("File received", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadFileToCloudinary(req.file.buffer, {
      folder: "profile_pics",
      public_id: `profile_pic_${req.user._id}`,
      resource_type: "auto",
    });

    const candidate = await userModel.findByIdAndUpdate(
      req.user._id,
      { profilePic: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        profilePic: candidate.profilePic,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error });
  }
};

module.exports = {
  registerCandidate,
  loginCandidate,
  logoutCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  deleteCandidateProfile,
  addToWishlist,
  removeFromWishlist,
  uploadCandidateProfilePic,
};
