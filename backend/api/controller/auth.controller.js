import jwtProvider from "../config/jwtProvider";
import userService from "../services/user.service";

const signup = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        const jwt = jwtProvider.generateToken(user._id);

        return res.status(201).json({ jwt, role: user.role,  message: "User registered successfully" });

    } catch (err) {
        console.error("Error during signup: ", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

const signin = async (req, res) => {
    const {password, email} = req.body;
    try {
        const user = await userService.findUserByEmail(email);
        
        if (!user) {
            return res.status(404).send({ error_location: "login Controller", message: "User not found" });
        }
        
        const isMatch = await argon2.verify(user.password, password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        
        const jwt = jwtProvider.generateToken(user._id);
        return res.status(200).json({jwt, role: user.role, message: "Login success"});

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export default { signin, signup };