import React, { useState, useEffect } from "react";
import "../App.css";

export default function Repositorio() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFileList, setUploadedFileList] = useState([]);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://prefectura-backend.onrender.com'
    : 'http://localhost:3001';

  const handleFileChange = (e) => {
    setUploadMessage("");
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
      formData.append('documents', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir archivos');
      }

      const data = await response.json();
      setUploadMessage(data.message);
      setSelectedFiles([]);
      fetchUploadedFiles();
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      setUploadMessage(`Error al subir archivos: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      if (!response.ok) {
        throw new Error('Error al obtener la lista de archivos');
      }
      const data = await response.json();
      if (Array.isArray(data.files)) {
        setUploadedFileList(data.files);
      } else {
        setUploadedFileList([]);
      }
    } catch (error) {
      console.error("Error al obtener la lista de archivos:", error);
      setUploadMessage(`Error al cargar archivos: ${error.message}`);
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${fileName}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileName}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el archivo');
      }

      setUploadMessage(`Archivo "${fileName}" eliminado correctamente.`);
      fetchUploadedFiles();
    } catch (error) {
      console.error("Error al eliminar el archivo:", error);
      setUploadMessage(`Error al eliminar archivo: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return '🖼️';
      case 'zip':
      case 'rar': return '📁';
      default: return '📎';
    }
  };

  return (
    <div className="repositorio-container">
      <div className="repositorio-content-wrapper">
        <div className="uploaded-files-section">
          <h3>Documentos en el Repositorio:</h3>
          {uploadedFileList.length > 0 ? (
            <div className="uploaded-files-grid">
              {uploadedFileList.map((file, index) => (
                <div key={index} className="document-card">
                  <span className="file-icon">{getFileIcon(file.name)}</span>
                  <h4 title={file.name}>{file.name}</h4>
                  <div className="document-actions">
                    <a
                      href={`${API_BASE_URL}/uploads/${file.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-link"
                    >
                      Descargar
                    </a>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteFile(file.name)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay documentos subidos aún.</p>
          )}
        </div>

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
