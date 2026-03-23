import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = "http://localhost:5000";

function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: localStorage.getItem("token")
      }
    });

    setSocket(newSocket);

    // Join user-specific room when authenticated
    if (user?.id) {
      newSocket.emit("join", user.id);
    }

    return () => {
      newSocket.close();
    };
  }, [user?.id]); // Re-run when user ID changes (e.g. login/logout)

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;