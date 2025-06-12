import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import ResetPassword from "./components/ResetPassword"; 
import Dashboard from "./pages/Dashboard";
import Repositorio from "./pages/Repositorio";
import RegistroAcceso from './pages/RegistroAcceso';
import './App.css'; // Tu archivo CSS global

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} /> {/* 👈 nueva ruta */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ruta1" element={<Repositorio />} /> {/* <- Aquí se conecta */}
        <Route path="/ruta2" element={<RegistroAcceso />} /> {/* <-- Nueva ruta */}

      </Routes>
    </BrowserRouter>
  );
}
