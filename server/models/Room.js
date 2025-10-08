const mongoose = require("mongoose");

const drawingCommandSchema = new mongoose.Schema({
  type: String,
  data: Object,
  timestamp: Date,
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  createdAt: Date,
  lastActivity: Date,
  drawingData: [drawingCommandSchema],
});

module.exports = mongoose.model("Room", roomSchema);
