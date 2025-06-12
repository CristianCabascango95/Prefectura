import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  return (
    <div className="container">
    <img
  src="https://cotopaxi.gob.ec/test.cotopaxi.gob.ec/wp-content/uploads/2024/09/Captura-de-pantalla-2024-09-14-a-las-13.59.13.png"
  alt="Logo"
  style={{
    width: '150px',
    height: 'auto',
    display: 'block',
    margin: '0 auto 1rem',
  }}
/>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Correo o Número" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Iniciar sesión</button>
      </form>
    
      <p>
        ¿No tienes cuenta? <a href="/register">Regístrate</a>
      </p>
      <p>
       ¿Olvidaste tu contraseña? <a href="/reset-password">Recupérala aquí</a>
      </p>

    </div>
  );


}



