const express = require("express");
const router = express.Router();
const { createAnnouncement, getAnnouncements } = require("../controllers/announcementController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, createAnnouncement);
router.get("/", auth, getAnnouncements);

module.exports = router;