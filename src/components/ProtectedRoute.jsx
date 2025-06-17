import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth(); // Obtenemos el estado y el estado de carga

  // Si aún estamos cargando, no hacemos nada y esperamos
  if (loading) {
    return null; // O un spinner de carga si prefieres
  }

  // Si el usuario está autenticado, renderiza las rutas hijas
  // De lo contrario, redirige a la página de login ("/")
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
