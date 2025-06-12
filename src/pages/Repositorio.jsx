// src/pages/Repositorio.jsx
import React, { useState, useEffect } from "react";
import "../App.css";

export default function Repositorio() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFileList, setUploadedFileList] = useState([]); // Estado para listar archivos subidos

  // Definición de la URL base del backend
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://prefectura-backend.onrender.com' // ¡CAMBIA ESTO POR LA URL REAL DE TU BACKEND EN RENDER!
    : 'http://localhost:3001'; // URL de tu backend local

  const handleFileChange = (e) => {
    // Limpiar el mensaje de subida al seleccionar nuevos archivos
    setUploadMessage("");
    // Actualizar los archivos seleccionados
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadMessage("Por favor, selecciona al menos un archivo.");
      return;
    }

    setUploading(true);
    setUploadMessage("Subiendo archivos...");

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('documents', file); // 'documents' debe coincidir con el nombre del campo en Multer
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData, // FormData envía los archivos correctamente
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir archivos');
      }

      const data = await response.json();
      setUploadMessage(data.message);
      setSelectedFiles([]); // Limpiar archivos seleccionados
      fetchUploadedFiles(); // Actualizar la lista de archivos subidos
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      setUploadMessage(`Error al subir archivos: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Función para obtener la lista de archivos subidos
  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      if (!response.ok) {
        throw new Error('Error al obtener la lista de archivos');
      }
      const data = await response.json();
      // Asegurarse de que data.files es un array antes de establecerlo
      if (Array.isArray(data.files)) {
        setUploadedFileList(data.files);
      } else {
        console.warn("La respuesta del backend no es un array de archivos:", data);
        setUploadedFileList([]);
      }
    } catch (error) {
      console.error("Error al obtener la lista de archivos:", error);
      setUploadMessage(`Error al cargar archivos: ${error.message}`);
    }
  };

  // Cargar la lista de archivos al montar el componente
  useEffect(() => {
    fetchUploadedFiles();
  }, []); // Se ejecuta una vez al montar el componente

  // Función para determinar el icono del archivo (básica, puedes expandirla)
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return '📄'; // Icono de PDF
      case 'doc':
      case 'docx': return '📝'; // Icono de documento Word
      case 'xls':
      case 'xlsx': return '📊'; // Icono de hoja de cálculo Excel
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return '🖼️'; // Icono de imagen
      case 'zip':
      case 'rar': return '📁'; // Icono de carpeta/comprimido
      default: return '📎'; // Icono genérico de clip
    }
  };

  return (
    <div className="repositorio-container">
      <div className="repositorio-content-wrapper">
        {/* Sección para mostrar los archivos subidos como cards (Izquierda, grande) */}
        <div className="uploaded-files-section">
          <h3>Documentos en el Repositorio:</h3>
          {uploadedFileList.length > 0 ? (
            <div className="uploaded-files-grid">
              {uploadedFileList.map((file, index) => (
                <div key={index} className="document-card">
                  <span className="file-icon">{getFileIcon(file.name)}</span>
                  {/* El atributo title permite ver el nombre completo al pasar el ratón */}
                  <h4 title={file.name}>{file.name}</h4>
                  <a
                    href={`${API_BASE_URL}/uploads/${file.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay documentos subidos aún.</p>
          )}
        </div>

        {/* Sección de subida de archivos (Derecha, pequeña) */}
        <div className="upload-section">
          <h3>Subir Archivos</h3>
          <input type="file" multiple onChange={handleFileChange} disabled={uploading} />
          {selectedFiles.length > 0 && (
            <div className="file-list">
              <h4>Archivos a subir ({selectedFiles.length}):</h4>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={handleUpload} className="upload-btn" disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir Archivos"}
          </button>
          {uploadMessage && (
            <p className={`upload-message ${uploadMessage.includes("Error") ? "error" : "success"}`}>
              {uploadMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}