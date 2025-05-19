import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert("Error al registrarse: " + error.message);
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
      <h2>Registrarse</h2>
      <form onSubmit={handleRegister}>
        <input type="email" placeholder="Correo" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Registrarse</button>
      </form>
      <p>
        ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
      </p>
    </div>
  );
}
