import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://lumen12.netlify.app",
  },
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || "your_fallback_secret_key";

// Socket.io Middleware for JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
    socket.user = decoded;
    next();
  });
});

// Middleware to verify JWT for Express
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Format: "Bearer <token>"

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: "Unauthorized: No token provided" });
  }
};

app.use(express.json());

// Express Routes
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Protected route to get current user info
app.get("/me", authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/register", async (req, res) => {
  const { name , email, password } = req.body;
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await prisma.user.create({
      data: { email , name , password: hashedPassword },
    });
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Socket.io Logic
const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("room:join", (data) => {
    const { room } = data; 
    const email = socket.user?.email; 

    if (!email || !room) {
      console.log("Rejected join attempt: missing user context or room id");
      return;
    }

    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    
    const roomSockets = io.sockets.adapter.rooms.get(room) || new Set();
    const usersInRoom = [];
    
    roomSockets.forEach(sid => {
       if (sid !== socket.id) {
         usersInRoom.push({ id: sid, email: socketidToEmailMap.get(sid) });
       }
    });

    socket.join(room);
    
    socket.to(room).emit("user:joined", { email, id: socket.id });
    socket.emit("existing-users", usersInRoom);
    socket.emit("room:join-success", { room });
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  // ICE Candidate Signaling
  socket.on("ice:candidate", ({ to, candidate }) => {
    io.to(to).emit("ice:candidate", { from: socket.id, candidate });
  });

  // NEW: Explicitly leave call event listener
  socket.on("call:leave", ({ room }) => {
    console.log(`Socket ${socket.id} intentionally left room: ${room}`);
    
    // Broadcast to others in the room that this user has left
    socket.to(room).emit("user:left", { id: socket.id });
    
    // Make the socket actively leave the Room channel on the backend
    socket.leave(room);
  });

  socket.on("disconnecting", () => {
    // Using disconnecting allows us to see rooms before they are automatically cleared
    socket.rooms.forEach(room => {
       if (room !== socket.id) {
          socket.to(room).emit("user:left", { id: socket.id });
       }
    });
  });

  socket.on("disconnect", () => {
    const email = socketidToEmailMap.get(socket.id);
    if (email) {
      emailToSocketIdMap.delete(email);
    }
    
    socketidToEmailMap.delete(socket.id);
    console.log("Socket Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 4444;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;