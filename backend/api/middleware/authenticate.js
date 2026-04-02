import jwtProvider from '../config/jwtProvider.js';
import userService from '../services/user.service.js';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const userId = jwtProvider.getIdByToken(token);

    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Authentication failed', error: err.message });
  }
};

export default authenticate;
