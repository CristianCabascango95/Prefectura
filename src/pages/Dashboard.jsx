import React from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/"));
  };

  return (
    <div className="container">
      <h2>Bienvenido al Dashboard</h2>
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
