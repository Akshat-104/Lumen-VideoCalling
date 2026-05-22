import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Room from "./pages/Room.jsx";
import { SocketProvider } from "./provider/Socket.jsx";

// 1. Create a dynamic Protected Route wrapper
const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  
  // If there is no token, redirect to landing/login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If there is a token, render the child routes
  return <Outlet />;
};

export default function App() {
  return (
    <SocketProvider>
      <Routes> 
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Private/Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<div style={{ padding: 40 }}>404 — Not found</div>} />
      </Routes>
    </SocketProvider>
  );
}