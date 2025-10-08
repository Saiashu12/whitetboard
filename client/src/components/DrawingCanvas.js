import React, { useEffect, useRef, useState } from "react";
import socket from "../socket";

const DrawingCanvas = ({ roomId, color, width }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const path = useRef([]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    return {
      x: (clientX - rect.left) / canvas.width,
      y: (clientY - rect.top) / canvas.height,
    };
  };

  const drawPath = ({ path, color, width }) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!path || path.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
    }
    ctx.stroke();
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

    canvas.width = window.innerWidth - 4;
    canvas.height = window.innerHeight - 100 - 4;

    ctx.putImageData(image, 0, 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    socket.on("draw-move", drawPath);
    socket.on("clear-canvas", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on("load-drawing", (drawingData) => {
      drawingData.forEach((cmd) => {
        if (cmd.type === "stroke") {
          drawPath(cmd.data);
        } else if (cmd.type === "clear") {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socket.off("draw-move");
      socket.off("clear-canvas");
      socket.off("load-drawing");
    };
  }, []);

  const startDrawing = (e) => {
    setDrawing(true);
    path.current = [getCoordinates(e)];
  };

  const draw = (e) => {
    if (!drawing) return;
    const point = getCoordinates(e);
    const lastPoint = path.current[path.current.length - 1];
    path.current.push(point);

    if (lastPoint) {
      drawPath({ path: [lastPoint, point], color, width });
    }

    socket.emit("draw-move", {
      path: [lastPoint, point],
      color,
      width,
    });
  };

  const endDrawing = () => {
    setDrawing(false);
    socket.emit("draw-end", {
      path: path.current,
      color,
      width,
    });
    path.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: "100px",
        left: "0",
        width: "100vw",
        height: "calc(100vh - 100px)",
        backgroundColor: "#ffffff",
        touchAction: "none",
        border: "2px solid #000000",
        boxSizing: "border-box",
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={endDrawing}
    />
  );
};

export default DrawingCanvas;
