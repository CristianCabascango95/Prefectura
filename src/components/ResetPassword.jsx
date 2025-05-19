// src/pages/ResetPassword.js
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    } catch (error) {
      alert("Error al enviar correo de recuperación: " + error.message);
    }
  };

  return (
    <div className="container">
      <img
        src="https://cotopaxi.gob.ec/test.cotopaxi.gob.ec/wp-content/uploads/2024/09/Captura-de-pantalla-2024-09-14-a-las-13.59.13.png"
        alt="Logo"
        style={{
          width: "150px",
          height: "auto",
          display: "block",
          margin: "0 auto 1rem",
        }}
      />
      <h2>Recuperar contraseña</h2>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Ingresa tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar correo de recuperación</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      <p>
        ¿Ya la recordaste? <a href="/">Volver a iniciar sesión</a>
      </p>
    </div>
  );
}
