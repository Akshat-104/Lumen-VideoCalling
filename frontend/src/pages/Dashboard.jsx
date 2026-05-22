import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../provider/Socket.jsx";

const Dashboard = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const handleRoomJoinedConfirmation = useCallback((data) => {
    console.log("Successfully joined room:", data.room);
    navigate(`/room/${data.room}`);
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      if (!socket) {
        console.error("Socket connection not available.");
        return;
      }
      socket.emit("room:join", { room: roomId });
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("room:join-success", handleRoomJoinedConfirmation);

    return () => {
      socket.off("room:join-success", handleRoomJoinedConfirmation);
    };
  }, [socket, handleRoomJoinedConfirmation]);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-card glass glow">
        <div className="dashboard-header">
          {/* Using your preset logo system */}
          <div className="logo-mark gradient-bg">⚡</div>
          <h1 className="gradient-text">Join a Session</h1>
        </div>
        
        <p className="dashboard-subtitle">
          Enter a room ID below to connect with your team instantly.
        </p>

        <form onSubmit={handleSubmit} className="dashboard-form">
          <div className="form-group">
            <label htmlFor="roomId" className="field-label">
              Room Identifier
            </label>
            <input
              id="roomId"
              type="text"
              name="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g., alpha-bravo-charlie"
              className="field-input"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary gradient-bg">
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;