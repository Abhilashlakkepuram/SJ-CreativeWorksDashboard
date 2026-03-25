const Announcement = require("../models/Announcement");

const createAnnouncement = async (req, res) => {
  try {
    const { title, message, priority, targetRole } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      priority,
      targetRole,
      createdBy: req.user.id
    });

    const io = req.app.get("io");

    // 🔥 SEND REALTIME
    if (targetRole === "all") {
      io.emit("new-announcement", announcement);
    } else {
      io.to(`role_${targetRole}`).emit("new-announcement", announcement);
    }

    res.json({ message: "Announcement posted", announcement });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAnnouncements = async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json(announcements);
};

module.exports = { createAnnouncement, getAnnouncements };