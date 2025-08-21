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

    res.status(201).json({
      message: "Registered successfully",
      token: generateToken(candidate._id, candidate.role),
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
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
    res.status(200).json({
      message: "Login sucessful",
      token: generateToken(candidate._id, candidate.role),
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
      },
    });
  } catch (error) {
    console.log("Login error", error.message);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const getCandidateProfile = async (req, res) => {
  try {
    const candidate = await userModel
      .findById(req.user.id)
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
    const userId = req.user.id;
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
    }

    if (name) candidate.name = name;
    if (email && email !== candidate.email) {
      const existing = await userModel.findOne({ email });
      if (existing) {
        res.status(409).json({ message: "Email already in use" });
      }
      candidate.email = email;
    }
    if (resume) candidate.resume = resume;
    if (profilePic) candidate.profilePic = profilePic;
    if (wishlist) candidate.wishlist = wishlist;

    await candidate.save();

    res.status(200).json({
      message: "Profile updated successfully",
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
      req.user.id,
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

    const candidate = await userModel.findById(req.user.id);
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

    const candidate = await userModel.findById(req.user.id);
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
    const result = await uploadFileToCloudinary(req.file.buffer, {
      folder: "profile_pics",
      public_id: `profile_pic_${req.user._id}`,
      resource_type: "auto",
    });

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  deleteCandidateProfile,
  addToWishlist,
  removeFromWishlist,
  uploadCandidateProfilePic,
};
