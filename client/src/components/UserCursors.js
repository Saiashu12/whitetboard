import React, { useEffect } from "react";
import socket from "../socket";

const UserCursors = ({ cursors }) => {
  useEffect(() => {
    const sendCursor = (e) => {
      socket.emit("cursor-move", {
        x: e.clientX,
        y: e.clientY,
        id: socket.id,
      });
    };

    window.addEventListener("mousemove", sendCursor);
    return () => window.removeEventListener("mousemove", sendCursor);
  }, []);

  return (
    <>
      {Object.entries(cursors).map(([id, cursor]) => {
        const isStale = Date.now() - cursor.timestamp > 5000;
        if (isStale) return null;

        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: cursor.x,
              top: cursor.y,
              background: "rgba(0, 0, 255, 0.5)",
              width: 10,
              height: 10,
              borderRadius: "50%",
              pointerEvents: "none",
              transform: "translate(-50%, -50%)",
              zIndex: 3,
            }}
          />
        );
      })}
    </>
  );
};

export default UserCursors;
