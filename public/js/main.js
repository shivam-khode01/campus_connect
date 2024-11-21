// Select DOM elements
const chatMessages = document.querySelector(".chat-messages");
const chatForm = document.getElementById("chat-form");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const notificationSound = new Audio('message-tone.mp3');

// Get enrollment and room from URL
const { enrollment, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Connect to Socket.IO
const socket = io();


// Verify enrollment number before emitting joinRoom event
fetch("/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ enrollment })
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      const username = data.name; // Set username based on the server response
      socket.emit("joinRoom", { username, room }); // Emit event after verifying
    } else {
      alert(data.message || "Enrollment number not found.");
      window.location.href = "/404"; // Redirect to the main route
    }
  })
  .catch((err) => console.error("Error verifying enrollment:", err));

// Listen for room and user updates
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Listen for incoming messages
socket.on("message", (message) => {
  outputMessage(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  notificationSound.play();
});

// Message submit event
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  const message = e.target.elements.msg.value;

  // Emit message to server
  socket.emit("chatMessage", message);

  // Clear input field and refocus
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

/**
 * Output message to DOM
 * @param {Object} message - Message object containing username, time, and text.
 */
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `
    <p class="meta">${message.username}<span>  ${message.time}</span></p>
    <p class="text">${message.text}</p>`;
  chatMessages.appendChild(div);
}

/**
 * Display room name in the UI
 * @param {string} room - Room name
 */
function outputRoomName(room) {
  roomName.innerText = room;
}

/**
 * Display list of users in the room
 * @param {Array} users - Array of user objects
 */
function outputUsers(users) {
  userList.innerHTML = users
    .map((user) => `<li>${user.username}</li>`)
    .join("");
}

/**
 * Play a notification sound when a message arrives
 */
function playNotificationSound() {
  notificationSound.play();
}

// Ensure notification sound loads correctly
notificationSound.addEventListener('error', () => {
  console.error("Notification sound could not be loaded.");
});
