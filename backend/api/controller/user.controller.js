import userService from "../services/user.service";

const updateProfile = async (req, res) => {
  try {
    const userResponse = await userService.updateUserProfile(req);

    return res.status(200).json({ 
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export default { updateProfile };