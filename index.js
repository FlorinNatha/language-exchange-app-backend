const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
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
// ... other routes

// Start server
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });
require('./sockets/socketHandler')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
