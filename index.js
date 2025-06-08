const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

//import middleware and handers
const { corsOption } = require('./middleware/corsMiddleware');


dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors(corsOption));

// Connect DB
require('./config/db')();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
// ... other routes

// Start server
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } }); // allow frontend to connect
require('./sockets/socketHandler')(io);

require('./roomCleaner')(); //start background cleaner

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
