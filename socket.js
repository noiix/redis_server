const PORT = process.env.PORT;
const server = app.listen(PORT, () => {});

const io = require("socket.io")(server, {
  pingTimeout: 6000,
  cors: {
    origin: "*"
  }
})

io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on('setup', (userData) => {
    socket.join(userData._id)
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room)
    console.log("user joined room: " + room)
  });

  socket.on('typing', (room) => {
    socket.in(room).emit('typing', room)
  })

  socket.on('stop typing', (room) => {
    socket.in(room).emit('stop typing')
  })
  

  socket.on('new message', (newMessageReceived) => {
    let chat = newMessageReceived.chat;

    if(!chat.users) return console.log("chat.users not defined")

    chat.users.forEach(user => {
      socket.in(user._id).emit('message received', newMessageReceived);
  })
  });
  socket.off('setup', () => {
    console.log('USER DISCONNECTED');
    socket.leave(userData._id);
  })

  socket.off('setup', () => {
    console.log('USER DISCONNECTED');
    socket.leave(userData._id)
  })
})