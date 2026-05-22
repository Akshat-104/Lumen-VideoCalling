import React, { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../provider/Socket.jsx";

const Room = () => {
  const { socket } = useSocket();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  // Media Toggle States
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true); // Track Mic State

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  const rtcConfig = {
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
        ],
      },
    ],
  };

  const getUserMediaStream = useCallback(async () => {
    try {
      if (myStream) return myStream;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMyStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  }, [myStream]);

  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) return peerConnection.current;

    const pc = new RTCPeerConnection(rtcConfig);

    pc.ontrack = (event) => {
      console.log("Received remote tracks");
      const [stream] = event.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketId) {
        socket.emit("ice:candidate", {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        console.log("Negotiation needed...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
      } catch (err) {
        console.error("Negotiation error:", err);
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [remoteSocketId, socket]);

  // Camera Toggle Functionality
  const toggleCamera = useCallback(() => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
      }
    }
  }, [myStream]);

  // NEW: Microphone Toggle Functionality
  const toggleMic = useCallback(() => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled; // Toggle mute/unmute
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, [myStream]);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`User ${email} joined with socket ID: ${id}`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await getUserMediaStream();
    const pc = createPeerConnection();

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket, getUserMediaStream, createPeerConnection]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);
    const stream = await getUserMediaStream();
    const pc = createPeerConnection();

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);

    socket.emit("call:accepted", { to: from, ans });
  }, [socket, getUserMediaStream, createPeerConnection]);

  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    const pc = peerConnection.current;
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(ans));
      console.log("Call completely established!");
    }
  }, []);

  const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
    const pc = peerConnection.current;
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      socket.emit("peer:nego:done", { to: from, ans });
    }
  }, [socket]);

  const handleNegoFinalIncoming = useCallback(async ({ ans }) => {
    const pc = peerConnection.current;
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(ans));
    }
  }, []);

  const handleIceCandidateIncoming = useCallback(async ({ candidate }) => {
    const pc = peerConnection.current;
    if (pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const closePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach(sender => {
        if (peerConnection.current.signalingState !== "closed") {
          peerConnection.current.removeTrack(sender);
        }
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteSocketId(null);
    setRemoteStream(null);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const handleUserLeft = useCallback(({ id }) => {
    console.log(`User left: ${id}`);
    if (remoteSocketId === id) {
      closePeerConnection();
    }
  }, [remoteSocketId, closePeerConnection]);

  const handleLeaveCall = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    closePeerConnection();

    if (socket && roomId) {
      socket.emit("call:leave", { room: roomId });
    }

    navigate("/dashboard");
  }, [myStream, closePeerConnection, socket, roomId, navigate]);

  useEffect(() => {
    if (!socket) return;

    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeededIncoming);
    socket.on("peer:nego:final", handleNegoFinalIncoming);
    socket.on("ice:candidate", handleIceCandidateIncoming);
    socket.on("user:left", handleUserLeft);

    getUserMediaStream();

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeededIncoming);
      socket.off("peer:nego:final", handleNegoFinalIncoming);
      socket.off("ice:candidate", handleIceCandidateIncoming);
      socket.off("user:left", handleUserLeft);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeededIncoming,
    handleNegoFinalIncoming,
    handleIceCandidateIncoming,
    handleUserLeft,
    getUserMediaStream,
  ]);

  return (
    <div className="room-container" style={{ padding: "20px", textAlign: "center" }}>
      <h2>Room: {roomId}</h2>
      <h4>{remoteSocketId ? "Connected to Peer" : "Waiting for someone to join..."}</h4>
      
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        {remoteSocketId && <button onClick={handleCallUser} style={{ padding: "10px 20px" }}>Start Video Call</button>}
        
        {/* Toggle Microphone Button */}
        <button 
          onClick={toggleMic} 
          style={{ 
            padding: "10px 20px", 
            backgroundColor: isMicOn ? "#007bff" : "#6c757d", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: "pointer" 
          }}
        >
          {isMicOn ? "Mute Mic" : "Unmute Mic"}
        </button>

        {/* Toggle Camera Button */}
        <button 
          onClick={toggleCamera} 
          style={{ 
            padding: "10px 20px", 
            backgroundColor: isCamOn ? "#28a745" : "#6c757d", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: "pointer" 
          }}
        >
          {isCamOn ? "Turn Camera Off" : "Turn Camera On"}
        </button>

        <button 
          onClick={handleLeaveCall} 
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#dc3545", 
            color: "white", 
            border: "none", 
            borderRadius: "5px", 
            cursor: "pointer" 
          }}
        >
          Leave Call
        </button>
      </div>
      
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
        <div>
          <h5>My Feed</h5>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "400px", borderRadius: "10px", transform: "scaleX(-1)" }} />
        </div>
        <div>
          <h5>Remote Feed</h5>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "400px", borderRadius: "10px" }} />
        </div>
      </div>
    </div>
  );
};

export default Room;