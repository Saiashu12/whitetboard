import React, { useState } from "react";
import axios from "axios";

const RoomJoin = ({ setRoomId }) => {
  const [input, setInput] = useState("");

  const joinRoom = async () => {
    if (!input.trim()) return;
    await axios.post("http://localhost:5000/api/rooms/join", { roomId: input });
    setRoomId(input);
  };

  return (
    <div className="centered">
      <h2>Enter Room Code</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. ABC123"
      />
      <button onClick={joinRoom}>Join</button>
    </div>
  );
};

export default RoomJoin;
