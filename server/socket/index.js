const Room = require('../models/Room');

module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log(' User connected');

    socket.on('join-room', async (roomId) => {
      socket.join(roomId);
      socket.roomId = roomId;
      console.log(`User joined room: ${roomId}`);
      io.to(roomId).emit('user-count', io.sockets.adapter.rooms.get(roomId)?.size || 1);
    });

    socket.on('cursor-move', (data) => {
      socket.to(socket.roomId).emit('cursor-update', data);
    });

    socket.on('draw-start', (data) => {
      socket.to(socket.roomId).emit('draw-start', data);
    });

    socket.on('draw-move', (data) => {
      socket.to(socket.roomId).emit('draw-move', data);
    });
    socket.on('draw-end', (data) => {
      Room.updateOne(
        { roomId: socket.roomId },
        { $push: { drawingData: { type: 'stroke', data, timestamp: new Date() } } }
      ).exec();
      console.log(`Stroke saved in room ${socket.roomId}`);
      socket.to(socket.roomId).emit('draw-end', data);
    });

    socket.on('clear-canvas', () => {
      Room.updateOne(
        { roomId: socket.roomId },
        { $push: { drawingData: { type: 'clear', data: {}, timestamp: new Date() } } }
      ).exec();
      console.log(`Canvas cleared in room ${socket.roomId}`);
      io.to(socket.roomId).emit('clear-canvas');
    });

    socket.on('disconnect', () => {
      if (socket.roomId) {
        socket.leave(socket.roomId);
        io.to(socket.roomId).emit('user-count', io.sockets.adapter.rooms.get(socket.roomId)?.size || 0);
      }
      console.log('User disconnected');
    });
  });
};
