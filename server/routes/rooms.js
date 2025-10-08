const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

router.post("/join", async (req, res) => {
  const { roomId } = req.body;

  if (!roomId || typeof roomId !== "string") {
    return res.status(400).json({ error: "Invalid room ID" });
  }

  try {
    let room = await Room.findOne({ roomId });

    if (!room) {
      room = new Room({ roomId });
      await room.save();
      console.log(`Room created: ${roomId}`);
    } else {
      console.log(`Room joined: ${roomId}`);
    }

    return res.status(200).json({ roomId });
  } catch (error) {
    console.error("Room join error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/:roomId", async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    return res.status(200).json(room);
  } catch (error) {
    console.error("Room fetch error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
