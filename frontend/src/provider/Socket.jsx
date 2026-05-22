import React, { useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = React.createContext(null);

export const useSocket = () => {
  return React.useContext(SocketContext);
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => {
    // 1. Grab the token generated during your login step
    // (Ensure the key string matches whatever you used in your login component, e.g., 'token' or 'jwt')
    const token = localStorage.getItem("token"); 

    return io("http://localhost:4444", {
      auth: {
        token: token // 2. Send the token inside the auth payload
      }
    });
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};