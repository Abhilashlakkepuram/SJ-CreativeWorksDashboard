const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        },
        roleReceiver: {
            type: String,
            required: false
        },
        isGroupMessage: {
            type: Boolean,
            default: false
        },
        isRead: {
            type: Boolean,
            default: false
        },
        message: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);