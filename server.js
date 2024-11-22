const path = require("path");
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeaves,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Study Buddy";

// Simulated database for demonstration
const users = [
  { enrollment: "MITU22BTCS0772", name: "Shivam Khode" },
  { enrollment: "MITU22BTCS0902", name: "Tanmay Deskhmukh" },
  { enrollment: "MITU22BTCS0442", name: "SHREYAS innamdar" },
  { enrollment: "MITU22BTCS0123", name: "celcilin cs" },
  { enrollment: "MITU22BTCS0034", name: "Aditi Shinde" },
];

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// API to check enrollment
app.post("/", (req, res) => {
  const { enrollment } = req.body;
  console.log('Received enrollment:', enrollment);  // Debug log
  const user = users.find((u) => u.enrollment === enrollment);
  
  if (user) {
    console.log("User found:", user);  // Debug log
    res.json({ success: true, name: user.name });
  } else {
      console.log("Enrollment not found");  // Debug log
      res.json({ success: false, message: "Enrollment number not found." });
    }
  }
);
app.get("/404", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});


// Socket.IO events
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome the user
    socket.emit("message", formatMessage(botName, `Welcome to ${user.room}!`));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat!`)
      );

    // Send room and users info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chat messages
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const user = userLeaves(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat!`)
      );

      // Update room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}...`));
