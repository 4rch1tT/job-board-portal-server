const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uploadFileToCloudinary = require("../utils/uploadFileToCloudinary");

const saltRounds = Number(process.env.SALT_ROUNDS);
const jwtSecret = process.env.JWT_SECRET;

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, jwtSecret, { expiresIn: "7d" });
};

const registerRecruiter = async (req, res) => {
  try {
    const { name, email, password, company, profilePic } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const recruiter = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: "recruiter",
      company,
      profilePic,
    });

    res
      .status(201)
      .cookie("token", generateToken(recruiter._id, recruiter.role), {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        path: "/",
      })
      .json({
        message: "Registered successfully",
        recruiter: {
          id: recruiter._id,
          name: recruiter.name,
          email: recruiter.email,
          role: recruiter.role,
        },
      });
  } catch (error) {
    console.log("Register error", error.message);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

const loginRecruiter = async (req, res) => {
  try {
    const { email, password } = req.body;
    const recruiter = await userModel.findOne({ email });
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter no found" });
    }

    const isMatch = await bcrypt.compare(password, recruiter.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res
      .status(200)
      .cookie("token", generateToken(recruiter._id, recruiter.role), {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        path: "/",
      })
      .json({
        message: "Login successful",
        recruiter: {
          id: recruiter._id,
          name: recruiter.name,
          email: recruiter.email,
          role: recruiter.role,
        },
      });
  } catch (error) {
    console.log("Login error", error.message);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const logoutRecruiter = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

const getRecruiterProfile = async (req, res) => {
  try {
    const recruiter = await userModel
      .findById(req.user._id)
      .select("-password")
      .populate("company");
    res.status(200).json(recruiter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRecruiterProfile = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.newPassword) {
      const recruiter = await userModel.findById(req.user._id);
      const isMatch = await bcrypt.compare(
        updates.currentPassword,
        recruiter.password
      );
      if (!isMatch) {
        res.status(401).json({ message: "Current password incorrect" });
      }
      updates.password = await bcrypt.hash(updates.newPassword, saltRounds);
    }

    if (updates.email) {
      const existing = await userModel.findOne({ email: updates.email });
      if (existing && existing._id.toString() !== req.user._id) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }

    const updatedRecruiter = await userModel
      .findByIdAndUpdate(req.user._id, updates, { new: true })
      .select("-password");
    res
      .status(200)
      .json({ message: "Profile updated", user: updatedRecruiter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRecruiterProfile = async (req, res) => {
  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ message: "Unauthorized  action" });
    }

    const updatedRecruiter = await userModel.findByIdAndUpdate(
      req.user._id,
      { isDeleted: true },
      { new: true }
    );

    if (!updatedRecruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.status(200).json({ message: "Profile marked as deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadRecruiterProfilePic = async (req, res) => {
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
  registerRecruiter,
  loginRecruiter,
  logoutRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  deleteRecruiterProfile,
  uploadRecruiterProfilePic,
};
