import userService from '../services/user.service.js';

// ── GET /user/profile ─────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    return res.status(200).json({ user: userService.sanitizeUser(req.user) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── PATCH /user/profile ───────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const updated = await userService.updateUserProfile(req);
    return res.status(200).json({ message: 'Profile updated successfully', user: updated });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Server error' });
  }
};

export default { getProfile, updateProfile };