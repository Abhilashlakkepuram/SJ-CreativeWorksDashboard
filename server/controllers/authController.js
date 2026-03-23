const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { notifyAdmins } = require("./notificationController");
const crypto = require("crypto");
const sendEmail = require("../services/emailService");

const registerUser = async (req, res) => {
  console.log("== REGISTER USER CALLED ==");
  console.log("User object type:", typeof User);
  console.log("User properties:", typeof User === 'object' || typeof User === 'function' ? Object.keys(User) : null);
  console.log("User itself:", User);

  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // allow only employee roles
    const allowedRoles = ["developer", "seo", "designer", "marketing"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isApproved: false
    });

    await user.save();

    // 🔥 Get socket instance
    const io = req.app.get("io");

    // 🔔 Notify admins (existing function)
    await notifyAdmins(req.app, "registration", `New employee registration: ${name} (${role})`);

    io.emit("dashboard-update");

    res.status(201).json({
      message: "Registration successful. Wait for admin approval."
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Login User
const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    if (!user.isApproved && user.role !== "admin") {
      return res.status(403).json({
        message: "Account waiting for SJ Creativeworks admin approval"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

};

const forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP
    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    user.resetOTP = hashedOTP;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000;
    user.resetAttempts = 0;

    await user.save();


    const logoUrl = "https://sjcreativeworks.com/wp-content/uploads/2024/04/latestup-scaled.png"; // Replace with your actual hosted logo URL

    const html = `
<div style="background-color: #f4f8f9; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e0e8eb;">
        
        <div style="padding: 35px 20px 20px; text-align: center; border-bottom: 2px solid #f4f8f9;">
            <img src="${logoUrl}" alt="SJ Creativeworks" style="max-width: 140px; height: auto; display: inline-block;">
        </div>

        <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1F8B8D; font-size: 20px; margin-top: 0; margin-bottom: 15px; font-weight: 600;">Password Reset Request</h2>
            
            <p style="font-size: 15px; color: #4f566b; margin-top: 0; line-height: 1.6;">Hello,</p>
            <p style="font-size: 15px; color: #4f566b; margin-top: 0; line-height: 1.6;">We received a request to reset the password for your <strong>SJ Creativeworks</strong> account. Please use the verification code below to complete the process:</p>
            
            <div style="background-color: #fffafa; border: 2px dashed #1F8B8D; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h1 style="font-size: 36px; font-weight: 800; color: #1F8B8D; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>

            <p style="font-size: 14px; color: #8792a2; margin-bottom: 0;">For your security, this code will expire in <span style="font-weight: 600; color: #1F8B8D;">10 minutes</span>.</p>
        </div>

        <div style="padding: 20px; background-color: #f8fbfb; text-align: center;">
            <p style="font-size: 12px; color: #8792a2; margin: 0; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
        </div>
    </div>
    
    <div style="max-width: 480px; margin: 20px auto; text-align: center;">
        <p style="font-size: 11px; color: #adb5bd; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 SJ Creativeworks • Automated Security Message</p>
    </div>
</div>
`;

    await sendEmail(email, "Password Reset OTP", html);

    res.json({
      message: "OTP sent to email"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {

  try {

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.resetAttempts >= 5) {
      return res.status(403).json({
        message: "Too many attempts"
      });
    }

    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (user.resetOTP !== hashedOTP) {

      user.resetAttempts += 1;
      await user.save();

      return res.status(400).json({
        message: "Invalid OTP"
      });

    }

    if (Date.now() > user.resetOTPExpires) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    user.resetAttempts = 0;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }

};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
};