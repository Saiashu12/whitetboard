import React, { useEffect, useState } from "react";
import socket from "../socket";
import DrawingCanvas from "./DrawingCanvas";
import Toolbar from "./Toolbar";
import UserCursors from "./UserCursors";
import { throttle } from "lodash";


const Whiteboard = ({ roomId }) => {
  const [color, setColor] = useState("black");
  const [width, setWidth] = useState(2);
  const [userCount, setUserCount] = useState(1);
  const [cursors, setCursors] = useState({});
  const emitCursor = throttle((x, y) => {
  socket.emit("cursor-move", { x, y });
}, 50); 

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("user-count", (count) => setUserCount(count));
    socket.on("cursor-update", ({ x, y, id }) => {
      setCursors((prev) => ({
        ...prev,
        [id]: { x, y, timestamp: Date.now() },
      }));
    });
    const handleMouseMove = (e) => {
  emitCursor(e.clientX, e.clientY);
};

window.addEventListener("mousemove", handleMouseMove);

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("user-count");
      socket.off("cursor-update");
       window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [roomId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <DrawingCanvas roomId={roomId} color={color} width={width} />

      <UserCursors cursors={cursors} />

      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}>
        <Toolbar
          color={color}
          setColor={setColor}
          width={width}
          setWidth={setWidth}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 4,
          background: "rgba(255,255,255,0.8)",
          padding: "4px 8px",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        🟢 Users in room: {userCount}
      </div>
    </div>
  );
};

export default Whiteboard;
