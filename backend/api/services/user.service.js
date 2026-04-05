import User from "../models/user_model.js";
import fs from "node:fs";
import argon2 from "argon2";
import jwtProvider from "../config/jwtProvider.js";

const createUser = async (userData) => {
  try {
    let { role, password, name, email, department, badgeNumber, contact } =
      userData;
    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
      throw new Error(`User already exists with Email: ${email}`);
    }

    const hashedPassword = await argon2.hash(password);

    const data = {
      name,
      password: hashedPassword,
      email,
      role,
      department,
      badgeNumber,
      contact,
    };

    const user = await User.create(data);

    return user;
  } catch (err) {
    console.error(`User Creation error: ${err.message}`);
  }
};

const findUserById = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      const err = new Error(`User not found with id: ${userId}`);
      err.status = 404;
      throw err;
    }

    return user;
  } catch (error) {
    console.error(`FindUserById error: ${error.message}`);
    throw err;
  }
};

const findUserByEmail = async (userEmail) => {
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      const err = new Error(`User not found with email: ${userEmail}`);
      err.status = 404;
      throw err;
    }
    return user;
  } catch (err) {
    console.error(`FindBYEmail error: ${err.message}`);
    throw err;
  }
};

const getProfileByToken = async (token) => {
  try {
    const userId = jwtProvider.getIdByToken(token);
    if (!userId) {
      const err = new Error("Invalid token");
      err.status = 401;
      throw err;
    }

    const user = await findUserById(userId);
    if (!user) {
      const err = new Error(`User not found with id: ${userId}`);
      err.status = 404;
      throw err;
    }
    return user;
  } catch (err) {
    console.error(`getProfile error: ${err.message}`);
    throw err;
  }
};

const updateUserProfile = async (req) => {
  try {
    const { name, contact, department, badgeNumber } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (contact) updateData.contact = contact;
    if (department) updateData.department = department;
    if (badgeNumber) updateData.badgeNumber = badgeNumber;

    if (req.file) {
      updateData.profilePhoto = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype,
      };

      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    const updated = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updated) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    return sanitizeUser(updated);
  } catch (error) {
    console.error("Update error:", error.message);
  }
};

const sanitizeUser = (user) => {
  try {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    if (obj.profilePhoto?.data) {
      obj.profilePic = `data:${obj.profilePhoto.contentType};base64,${obj.profilePhoto.data.toString("base64")}`;
      delete obj.profilePhoto;
    }
    return obj;
  } catch (err) {
    console.error(`Sanitization Error: ${err.message}`);
  }
};

// Mark user as face-enrolled and store how many samples are saved
const updateFaceEnrollment = async (userId, encodingsCount) => {
  await User.findByIdAndUpdate(userId, {
    faceEnrolled:  true,
    faceEncodings: encodingsCount,
  });
};

// Record the timestamp of a successful face login
const recordFaceLogin = async (userId) => {
  await User.findByIdAndUpdate(userId, { lastFaceLoginAt: new Date() });
};

// Clear all face data from MongoDB (called after deleting from Python service)
const clearFaceEnrollment = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    faceEnrolled:    false,
    faceEncodings:   0,
    lastFaceLoginAt: null,
  });
};

export default {
  createUser,
  updateUserProfile,
  findUserById,
  getProfileByToken,
  findUserByEmail,
  sanitizeUser,
  updateFaceEnrollment,
  recordFaceLogin,
  clearFaceEnrollment
};
