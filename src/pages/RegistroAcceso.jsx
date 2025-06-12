import React, { useState, useEffect, useRef } from "react"; // Importar useRef
import { db, auth } from "../firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import html2canvas from 'html2canvas'; // Importar html2canvas
import jsPDF from 'jspdf'; // Importar jspdf
import "../App.css";

export default function RegistroAcceso() {
  const [formData, setFormData] = useState({
    institucion: "Prefectura de Cotopaxi",
    areaRestringida: "",
    responsableArea: "",
    fecha: "",
    accesos: [],
  });
  const [accessEntry, setAccessEntry] = useState({
    horaIngreso: "",
    horaSalida: "",
    nombreCompleto: "",
    identificacion: "",
    cargo: "",
    motivoIngreso: "",
    firmaVisitante: "",
  });
  const [registros, setRegistros] = useState([]);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = auth.currentUser;

  const registrosCollectionRef = collection(db, "registrosAcceso");

  // Ref para el contenido que queremos imprimir/descargar como PDF
  const printRef = useRef();

  useEffect(() => {
    fetchRegistros();
  }, []);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const q = query(registrosCollectionRef, orderBy("fecha", "desc"));
      const data = await getDocs(q);
      const fetchedRegistros = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        fecha: doc.data().fecha ? new Date(doc.data().fecha).toISOString().split('T')[0] : '',
        createdAt: doc.data().createdAt?.toDate().toLocaleString() || 'N/A',
        updatedAt: doc.data().updatedAt?.toDate().toLocaleString() || 'N/A',
      }));
      setRegistros(fetchedRegistros);
    } catch (err) {
      setError("Error al cargar los registros: " + err.message);
      console.error("Error al cargar registros:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccessEntryChange = (e) => {
    const { name, value } = e.target;
    setAccessEntry((prev) => ({ ...prev, [name]: value }));
  };

  const addAccessRow = () => {
    if (!accessEntry.nombreCompleto && !accessEntry.identificacion && !accessEntry.motivoIngreso) {
      alert("Por favor, rellena al menos 'Nombre Completo', 'Identificación' o 'Motivo de Ingreso' para añadir la fila.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      accesos: [...prev.accesos, accessEntry],
    }));
    setAccessEntry({
      horaIngreso: "",
      horaSalida: "",
      nombreCompleto: "",
      identificacion: "",
      cargo: "",
      motivoIngreso: "",
      firmaVisitante: "",
    });
  };

  const removeAccessRow = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      accesos: prev.accesos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleGuardar = async () => {
    if (!user) {
      alert("Debes iniciar sesión para guardar un registro.");
      return;
    }

    if (!formData.areaRestringida || !formData.responsableArea || !formData.fecha) {
        alert("Por favor, complete los campos principales del formulario (Área Restringida, Responsable del Área, Fecha).");
        return;
    }

    try {
      const registroData = {
        ...formData,
        createdAt: selectedRegistro?.createdAt ? selectedRegistro.createdAt : serverTimestamp(),
        createdBy: selectedRegistro?.createdBy ? selectedRegistro.createdBy : user.email,
        userId: selectedRegistro?.userId ? selectedRegistro.userId : user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
      };

      if (selectedRegistro) {
        const registroDoc = doc(db, "registrosAcceso", selectedRegistro.id);
        await updateDoc(registroDoc, registroData);
        alert("Registro modificado exitosamente.");
      } else {
        await addDoc(registrosCollectionRef, registroData);
        alert("Registro guardado exitosamente.");
      }
      resetForm();
      fetchRegistros();
    } catch (err) {
      setError("Error al guardar el registro: " + err.message);
      console.error("Error al guardar registro:", err);
    }
  };

  const handleModificar = (registro) => {
    setFormData({
      institucion: registro.institucion,
      areaRestringida: registro.areaRestringida,
      responsableArea: registro.responsableArea,
      fecha: registro.fecha,
      accesos: registro.accesos || [],
    });
    setSelectedRegistro(registro);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      try {
        await deleteDoc(doc(db, "registrosAcceso", id));
        alert("Registro eliminado exitosamente.");
        fetchRegistros();
      } catch (err) {
        setError("Error al eliminar el registro: " + err.message);
        console.error("Error al eliminar registro:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      institucion: "Prefectura de Cotopaxi",
      areaRestringida: "",
      responsableArea: "",
      fecha: "",
      accesos: [],
    });
    setAccessEntry({
      horaIngreso: "",
      horaSalida: "",
      nombreCompleto: "",
      identificacion: "",
      cargo: "",
      motivoIngreso: "",
      firmaVisitante: "",
    });
    setSelectedRegistro(null);
  };

  const handleDownloadPDF = async () => {
    if (registros.length === 0) {
        alert("No hay registros para descargar en PDF.");
        return;
    }

    // Temporalmente, crearemos un contenedor oculto para generar el PDF de todos los registros.
    // Esto es necesario porque html2canvas trabaja con elementos visibles en el DOM.
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px'; // Mover fuera de la vista
    tempContainer.style.width = '800px'; // Ancho de renderizado para PDF (ajustar si es necesario)
    document.body.appendChild(tempContainer);

    // Contenido HTML para el PDF
    let pdfHtmlContent = `
        <style>
            h2 { text-align: center; color: #2c3e50; margin-bottom: 20px; font-size: 1.8rem; text-transform: uppercase; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h3 { text-align: center; color: #444; margin-bottom: 15px; font-size: 1.4rem; text-transform: uppercase; padding-top: 10px; border-top: 1px solid #eee; }
            .pdf-section { margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9; }
            .pdf-group { margin-bottom: 10px; }
            .pdf-group label { font-weight: bold; margin-right: 10px; color: #333; }
            .pdf-group span { color: #555; }
            .pdf-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .pdf-table th, .pdf-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9em; }
            .pdf-table th { background-color: #e9e9e9; font-weight: bold; }
            .logo-placeholder { text-align: right; margin-bottom: 20px; }
            .logo-placeholder img { max-width: 150px; opacity: 0.5; } /* Ajusta el tamaño y opacidad del logo en PDF */
            .page-break { page-break-after: always; } /* Para control de saltos de página */
        </style>
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>REGISTRO DE ACCESOS A ÁREAS RESTRINGIDAS</h2>
            <div class="logo-placeholder">
                <img src="${window.location.origin}/coto1.png" alt="Prefectura Cotopaxi Logo" />
            </div>
    `;

    registros.forEach((registro, index) => {
        pdfHtmlContent += `
            <div class="pdf-section">
                <h3>Registro #${index + 1} - ${registro.areaRestringida}</h3>
                <div class="pdf-group"><label>Institución:</label><span>${registro.institucion}</span></div>
                <div class="pdf-group"><label>Área Restringida:</label><span>${registro.areaRestringida}</span></div>
                <div class="pdf-group"><label>Responsable del Área:</label><span>${registro.responsableArea}</span></div>
                <div class="pdf-group"><label>Fecha:</label><span>${registro.fecha}</span></div>
                <div class="pdf-group"><label>Creado Por:</label><span>${registro.createdBy || 'N/A'}</span></div>
                <div class="pdf-group"><label>Fecha Creación:</label><span>${registro.createdAt || 'N/A'}</span></div>
                <div class="pdf-group"><label>Modificado Por:</label><span>${registro.updatedBy || 'N/A'}</span></div>
                <div class="pdf-group"><label>Fecha Modificación:</label><span>${registro.updatedAt || 'N/A'}</span></div>
        `;

        if (registro.accesos && registro.accesos.length > 0) {
            pdfHtmlContent += `
                <h4>Detalles de Acceso:</h4>
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>Hora Ingreso</th>
                            <th>Hora Salida</th>
                            <th>Nombre Completo</th>
                            <th>Identificación</th>
                            <th>Cargo</th>
                            <th>Motivo Ingreso</th>
                            <th>Firma Visitante</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            registro.accesos.forEach(acceso => {
                pdfHtmlContent += `
                    <tr>
                        <td>${acceso.horaIngreso}</td>
                        <td>${acceso.horaSalida}</td>
                        <td>${acceso.nombreCompleto}</td>
                        <td>${acceso.identificacion}</td>
                        <td>${acceso.cargo}</td>
                        <td>${acceso.motivoIngreso}</td>
                        <td>${acceso.firmaVisitante}</td>
                    </tr>
                `;
            });
            pdfHtmlContent += `
                    </tbody>
                </table>
            `;
        } else {
            pdfHtmlContent += `<p>No se registraron accesos para este formulario.</p>`;
        }
        pdfHtmlContent += `</div>`; // Cierra pdf-section

        // Añadir un salto de página después de cada registro si hay más de uno
        if (index < registros.length - 1) {
            pdfHtmlContent += `<div class="page-break"></div>`;
        }
    });

    pdfHtmlContent += `</div>`; // Cierra el contenedor principal
    tempContainer.innerHTML = pdfHtmlContent;

    // Usar html2canvas para renderizar el contenido HTML
    try {
        const canvas = await html2canvas(tempContainer, {
            scale: 2, // Aumenta la escala para mejor resolución
            useCORS: true, // Importante si tienes imágenes de diferentes orígenes (como el logo)
            logging: true, // Para ver mensajes de depuración en la consola
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' para retrato, 'mm' para milímetros, 'a4' para tamaño de página
        const imgWidth = 210; // Ancho de una página A4 en mm
        const pageHeight = 297; // Alto de una página A4 en mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 0;

        // Si la imagen es más grande que una página, dividirla en varias páginas
        if (imgHeight > pageHeight) {
            while (position < imgHeight) {
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                position -= pageHeight; // Mover a la siguiente sección de la imagen
                if (position > -imgHeight) { // Añadir una nueva página si no es la última sección
                    pdf.addPage();
                }
            }
        } else {
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }

        pdf.save('registros_accesos.pdf');
    } catch (err) {
        console.error("Error al generar el PDF:", err);
        alert("Hubo un error al generar el PDF. Por favor, intente de nuevo.");
    } finally {
        document.body.removeChild(tempContainer); // Limpiar el contenedor temporal
    }
};


  if (loading) return <p className="loading-text">Cargando registros...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;


  return (
    <div className="registro-acceso-container">
      <h2 className="registro-acceso-title">REGISTRO DE ACCESOS A ÁREAS RESTRINGIDAS</h2>

      {/* Sección de Datos Principales del Formulario (visible para interacción) */}
      <div className="form-section main-data">
        <div className="form-group">
          <label>Institución:</label>
          <input
            type="text"
            name="institucion"
            value={formData.institucion}
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Área Restringida:</label>
          <input
            type="text"
            name="areaRestringida"
            value={formData.areaRestringida}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Responsable del Área:</label>
          <input
            type="text"
            name="responsableArea"
            value={formData.responsableArea}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Fecha:</label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-logo">
            <img src="/coto1.png" alt="Prefectura Cotopaxi" />
        </div>
      </div>

      <h3 className="section-title">DATOS DEL ACCESO</h3>
      <div className="form-section access-entry-row">
        <input
          type="time"
          name="horaIngreso"
          placeholder="Hora de Ingreso"
          value={accessEntry.horaIngreso}
          onChange={handleAccessEntryChange}
        />
        <input
          type="time"
          name="horaSalida"
          placeholder="Hora de Salida"
          value={accessEntry.horaSalida}
          onChange={handleAccessEntryChange}
        />
        <input
          type="text"
          name="nombreCompleto"
          placeholder="Nombre Completo"
          value={accessEntry.nombreCompleto}
          onChange={handleAccessEntryChange}
        />
        <input
          type="text"
          name="identificacion"
          placeholder="Identificación"
          value={accessEntry.identificacion}
          onChange={handleAccessEntryChange}
        />
        <input
          type="text"
          name="cargo"
          placeholder="Cargo"
          value={accessEntry.cargo}
          onChange={handleAccessEntryChange}
        />
        <input
          type="text"
          name="motivoIngreso"
          placeholder="Motivo de Ingreso"
          value={accessEntry.motivoIngreso}
          onChange={handleAccessEntryChange}
        />
        <input
          type="text"
          name="firmaVisitante"
          placeholder="Firma del Visitante"
          value={accessEntry.firmaVisitante}
          onChange={handleAccessEntryChange}
        />
        <button type="button" onClick={addAccessRow} className="btn-add-row">
          Añadir Fila
        </button>
      </div>

      <div className="access-table-container">
        <table className="access-table">
          <thead>
            <tr>
              <th>Hora de Ingreso</th>
              <th>Hora de Salida</th>
              <th>Nombre Completo</th>
              <th>Identificación</th>
              <th>Cargo</th>
              <th>Motivo de Ingreso</th>
              <th>Firma del Visitante</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {formData.accesos.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>
                  No hay entradas de acceso añadidas.
                </td>
              </tr>
            ) : (
              formData.accesos.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.horaIngreso}</td>
                  <td>{entry.horaSalida}</td>
                  <td>{entry.nombreCompleto}</td>
                  <td>{entry.identificacion}</td>
                  <td>{entry.cargo}</td>
                  <td>{entry.motivoIngreso}</td>
                  <td>{entry.firmaVisitante}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-delete-row"
                      onClick={() => removeAccessRow(index)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        <button type="button" onClick={handleGuardar} className="btn-save">
          {selectedRegistro ? "Modificar" : "Guardar"}
        </button>
        {selectedRegistro && (
          <button type="button" onClick={resetForm} className="btn-cancel-edit">
            Cancelar Edición
          </button>
        )}
      </div>

      <h3 className="section-title">Registros Guardados</h3>
      <div className="saved-registros-list">
        {registros.length === 0 ? (
          <p className="no-registros-message">No hay registros de acceso guardados aún.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDownloadPDF} // Cambiado a la función de descarga PDF
              className="btn-download"
            >
              Descargar Registros (PDF)
            </button>
            <table className="registros-table">
              <thead>
                <tr>
                  <th>Área Restringida</th>
                  <th>Responsable</th>
                  <th>Fecha</th>
                  <th>Creado Por</th>
                  <th>Modificado Por</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td>{registro.areaRestringida}</td>
                    <td>{registro.responsableArea}</td>
                    <td>{registro.fecha}</td>
                    <td>{registro.createdBy || 'Desconocido'}</td>
                    <td>{registro.updatedBy || 'N/A'}</td>
                    <td>
                      <button
                        className="btn-modify"
                        onClick={() => handleModificar(registro)}
                      >
                        Modificar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleEliminar(registro.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}