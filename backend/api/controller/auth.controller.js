import argon2 from "argon2";
import jwtProvider from "../config/jwtProvider.js";
import userService from "../services/user.service.js";

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

export default { signin, signup };
