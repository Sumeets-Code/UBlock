import argon2 from "argon2";
import jwtProvider from "../config/jwtProvider.js";
import userService from "../services/user.service.js";
import faceService from "../services/face.service.js";

const signup = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    const jwt = jwtProvider.generateToken(user._id);
    return res.status(200).json({
      token: jwt,
      user: userService.sanitizeUser(user),
      message: "User registered successfully",
    });
  } catch (err) {
    const status = err.status || 500;
    console.error(`Signup error: ${err.message}`);
    return res
      .status(status)
      .json({ message: err.message || "Internal Server Error" });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await userService.findUserByEmail(email);

    if (!user) {
      return res.status(404).send({
        error_location: "login Controller",
        message: "User not found",
      });
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const jwt = jwtProvider.generateToken(user._id);
    return res
      .status(200)
      .json({
        token: jwt,
        user: userService.sanitizeUser(user),
        message: "Login success",
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const enrollFace = async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ message: 'imageData is required' });
    }

    const userId = req.user._id.toString();

    // Forward to Python microservice
    const result = await faceService.registerFace(userId, imageData);

    // Update MongoDB: mark face as enrolled, store sample count
    await userService.updateFaceEnrollment(userId, result.encodings_stored);

    return res.status(200).json({
      message:          'Face sample enrolled successfully',
      encodings_stored: result.encodings_stored,
      enrolled:         true,
    });
  } catch (err) {
    console.error('Face enroll error:', err.message);
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const faceLogin = async (req, res) => {
  try {
    const { email, imageData } = req.body;
    if (!email || !imageData) {
      return res.status(400).json({ message: 'email and imageData are required' });
    }

    // Look up user by email first (we do 1-to-1 verify, not 1-to-N search)
    const user = await userService.findUserByEmail(email);

    if (!user.faceEnrolled) {
      return res.status(403).json({
        message: 'Face login is not enabled for this account. Please enroll first.',
        code:    'FACE_NOT_ENROLLED',
      });
    }

    const userId = user._id.toString();
    const result = await faceService.verifyFace(userId, imageData);

    if (!result.verified) {
      // Record failed attempt (optional — you could add lockout logic here)
      return res.status(401).json({
        message:    'Face does not match. Please try again or use password login.',
        similarity: result.similarity,
        verified:   false,
      });
    }

    // Success — issue JWT and update last face login timestamp
    const token = jwtProvider.generateToken(user._id);
    await userService.recordFaceLogin(userId);

    return res.status(200).json({
      token,
      user:       userService.sanitizeUser(user),
      similarity: result.similarity,
      message:    'Face authentication successful',
    });
  } catch (err) {
    console.error('Face login error:', err.message);
    return res.status(err.status || 500).json({ message: err.message });
  }
};

const unenrollFace = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    await faceService.deleteFace(userId);
    await userService.clearFaceEnrollment(userId);
    return res.status(200).json({ message: 'Face data removed successfully' });
  } catch (err) {
    console.error('Face unenroll error:', err.message);
    return res.status(err.status || 500).json({ message: err.message });
  }
};


export default { signin, signup, enrollFace, faceLogin, unenrollFace };
