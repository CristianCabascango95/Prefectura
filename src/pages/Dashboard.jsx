import React, { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { parseExcelFile } from "../utils/excelParser";
import "../App.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [portafolios, setPortafolios] = useState({});
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/"));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) return navigate("/");
      setUser(user);
    });

    const fetchExcel = async () => {
      const res = await fetch("/PLANTILLA TICS 18_11_2024.xlsx");
      const blob = await res.blob();
      const parsed = await parseExcelFile(blob);
      setPortafolios(parsed);
      setLoading(false);
    };

    fetchExcel();
    return () => unsubscribe();
  }, [navigate]);

  if (loading || !user) return <p className="loading-text">Cargando...</p>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2 className="dashboard-title">Panel de Portafolios</h2>
        <div className="user-section">
          <div
            className="user-avatar"
            onClick={() => setShowMenu(!showMenu)}
            title={user.email}
          >
            {user.email.charAt(0).toUpperCase()}
          </div>
          {showMenu && (
            <div className="user-menu">
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>

      <div className="cards-container">
        {Object.keys(portafolios).map((nombre) => (
          <div key={nombre} className="portfolio-card">
            <h4 className="portfolio-title">{nombre}</h4>
            <ul className="activity-list">
              {portafolios[nombre].map((act, idx) => (
                <li key={idx} className="activity-item">
                  {act}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
