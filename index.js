const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3001",
  },
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;
  // fetch existing users
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {

    users.push({
      // userID: id,
      socketId: id,
      username: socket.username,
      userId,
    });
  }
  socket.emit("users", users);

  // notify existing users
  socket.broadcast.emit("user connected", {
    // userID: socket.id,
    socketId: socket.id,
    username: socket.username,
    userId: userId,
  });

  // forward the private message to the right recipient
  socket.on("private message", ({ content, imageData, receivedUserId, to }) => {
    console.log("private message", content, imageData, to, receivedUserId)
    socket.to(to).emit("private message", {
      content,
      // from: socket.id,
      from: userId,
    });
    // calling api to add message to DB here
  });

  // notify users upon disconnection
  socket.on("disconnect", () => {
    socket.broadcast.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
