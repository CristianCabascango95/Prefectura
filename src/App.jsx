import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ResetPassword from "./components/ResetPassword"; 
import Dashboard from "./pages/Dashboard";
import Repositorio from "./pages/Repositorio";
import RegistroAcceso from './pages/RegistroAcceso';
import InformeTecnico from './pages/InformeTecnico'; // Asegúrate de la ruta correcta

import './App.css'; // Tu archivo CSS global

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} /> {/* 👈 nueva ruta */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Repositorio" element={<Repositorio />} /> {/* <- Aquí se conecta */}
        <Route path="/RegistroaAreasRestringidas" element={<RegistroAcceso />} /> {/* <-- Nueva ruta */}
        <Route path="/InformeTecnico" element={<InformeTecnico />} /> {/* <-- Nueva ruta */}

      </Routes>
    </BrowserRouter>
  );
}
