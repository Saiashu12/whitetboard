import React from "react";
import socket from "../socket";

const Toolbar = ({ color, setColor, width, setWidth }) => {
  const handleClear = () => {
    socket.emit("clear-canvas");
  };

  return (
    <div style={{
      position: "absolute",
      top: 10,
      left: 10,
      zIndex: 2,
      background: "#fff",
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 0 5px rgba(0,0,0,0.2)",
      display: "flex",
      gap: "10px",
      alignItems: "center"
    }}>
      <label>🎨 Color:</label>
      <select value={color} onChange={(e) => setColor(e.target.value)}>
        <option value="black">Black</option>
        <option value="red">Red</option>
        <option value="blue">Blue</option>
        <option value="green">Green</option>
      </select>

      <label>✏️ Width:</label>
      <input
        type="range"
        min="1"
        max="10"
        value={width}
        onChange={(e) => setWidth(parseInt(e.target.value))}
      />

      <button onClick={handleClear}>🧹 Clear</button>
    </div>
  );
};

export default Toolbar;
