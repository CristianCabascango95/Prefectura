import React, { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/"));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) return navigate("/");
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading || !user) return <p className="loading-text">Cargando...</p>;

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <img src="/coto1.png" alt="Logo" className="dashboard-logo" />
        </div>

        <div className="navbar-right">
          <div
            className="user-info"
            onClick={() => setMenuOpen(!menuOpen)}
            title={user.email}
          >
            {user.email.charAt(0).toUpperCase()}
            <span className="user-email">{user.email}</span>
          </div>

          {menuOpen && (
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar sesión
            </button>
          )}
        </div>
      </nav>

      {/* Contenido del Dashboard */}
      <div className="dashboard-content">
        <h2>Bienvenido</h2>
        <div className="card-row">
          <div className="dashboard-card" onClick={() => navigate("/ruta1")}>
            <h3>Repositorio</h3>
            <p>Documentación de cada portafólio </p>
          </div>
          <div className="dashboard-card" onClick={() => navigate("/ruta2")}>
            <h3>Registro de gui de áreas restringidas</h3>
            <p>Ver control de asistencia</p>
          </div>
          <div className="dashboard-card" onClick={() => navigate("/ruta3")}>
            <h3>Informe Técnico</h3>
            <p>Gestión de Accesos a Sistemas y Aplicaciones</p>
          </div>
          <div className="dashboard-card" onClick={() => navigate("/ruta4")}>
            <h3>Plan de mitigación de riesgos</h3>
            <p>Modificar preferencias</p>
          </div>
        </div>
      </div>
    </div>
  );
}