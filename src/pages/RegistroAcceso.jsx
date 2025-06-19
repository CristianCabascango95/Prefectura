import React, { useRef, useState, useEffect } from "react"; // Importa useEffect
import { db } from "../firebase/config";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore"; // Importa getDocs, query, orderBy, limit
import { v4 as uuidv4 } from "uuid";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import logo from "../assets/logo.png";

const initialEntry = () => ({
  id: uuidv4(),
  ingreso: "",
  salida: "",
  nombre: "",
  identificacion: "",
  cargo: "",
  motivo: "",
  firma: ""
});

export default function RegistroAcceso() {
  const [area, setArea] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [registros, setRegistros] = useState([initialEntry()]); // Se inicializa con una entrada vacía por si no hay datos guardados
  const pdfRef = useRef();
  const logoRef = useRef();

  // --- NUEVA LÓGICA: Cargar datos desde Firebase al iniciar el componente ---
  useEffect(() => {
    const loadLastEntry = async () => {
      try {
        // Consulta los documentos en la colección 'registro_accesos'
        // Ordena por la marca de tiempo de creación (si la tuvieras, sería ideal)
        // o simplemente intenta obtener el último documento si no hay campo de tiempo.
        // NOTA: Firebase no tiene un "último" documento intrínseco. Lo mejor es
        // añadir un campo `timestamp` al guardar los datos para ordenar por él.
        // Por simplicidad, aquí buscaremos los datos, pero lo ideal es un timestamp.

        // Para este ejemplo, vamos a cargar el más reciente si se añadió un timestamp.
        // Si no tienes un timestamp al guardar, esta parte necesitaría una ligera modificación
        // en tu función saveToFirebase para añadir uno, por ejemplo:
        // const datos = { area, responsable, fecha, registros, timestamp: new Date() };

        const q = query(
          collection(db, "registro_accesos"),
          orderBy("timestamp", "desc"), // Asegúrate de que 'timestamp' exista en tus documentos
          limit(1) // Obtiene solo el documento más reciente
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          setArea(lastDoc.area || "");
          setResponsable(lastDoc.responsable || "");
          setFecha(lastDoc.fecha || "");
          // Asegúrate de que 'registros' en Firebase sea un array, si no, usa un array vacío por defecto
          setRegistros(lastDoc.registros || [initialEntry()]);
        } else {
          // Si no hay datos guardados, asegúrate de que la tabla tenga al menos una fila vacía
          setRegistros([initialEntry()]);
        }
      } catch (error) {
        console.error("Error al cargar datos desde Firebase: ", error);
        // Si hay un error al cargar, asegúrate de que el estado esté limpio o con una entrada inicial
        setRegistros([initialEntry()]);
      }
    };

    loadLastEntry();
  }, []); // El array vacío [] asegura que este efecto se ejecute solo una vez al montar el componente

  // --- FIN DE NUEVA LÓGICA ---

  const handleChange = (id, field, value) => {
    setRegistros((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addRegistro = () => {
    setRegistros([...registros, initialEntry()]);
  };

  const removeRegistro = (id) => {
    setRegistros(registros.filter((r) => r.id !== id));
  };

  const saveToFirebase = async () => {
    // Es buena práctica añadir una marca de tiempo al guardar para poder ordenar
    const datos = { area, responsable, fecha, registros, timestamp: new Date() }; // Añade timestamp
    try {
      await addDoc(collection(db, "registro_accesos"), datos);
      alert("Datos guardados en Firebase.");
      // Opcional: Si después de guardar quieres limpiar el formulario
      // setArea('');
      // setResponsable('');
      // setFecha('');
      // setRegistros([initialEntry()]);
    } catch (error) {
      console.error("Error al guardar en Firebase: ", error);
      alert("Error al guardar los datos.");
    }
  };

  const exportarPDF = () => {
    const logoImage = logoRef.current;

    if (!logoImage.complete) {
      logoImage.onload = () => exportarPDF();
      return;
    }

    const input = pdfRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("registro_accesos.pdf");
    });
  };

  return (
    <div className="registro-container">
      <h2 className="form-title">Formulario de Registro de Accesos</h2>

      <div className="form-grid">
        <input
          type="text"
          placeholder="Área Restringida"
          className="form-input"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
        <input
          type="text"
          placeholder="Responsable del Área"
          className="form-input"
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
        />
        <input
          type="date"
          className="form-input"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <table className="form-table">
        <thead>
          <tr>
            {["Ingreso", "Salida", "Nombre", "ID", "Cargo", "Motivo", "Firma", "Eliminar"].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr key={r.id}>
              {["ingreso", "salida", "nombre", "identificacion", "cargo", "motivo", "firma"].map((field) => (
                <td key={field}>
                  <input
                    className="table-input"
                    value={r[field]}
                    onChange={(e) => handleChange(r.id, field, e.target.value)}
                  />
                </td>
              ))}
              <td>
                <button className="delete-button" onClick={() => removeRegistro(r.id)}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="button-group">
        <button onClick={addRegistro} className="form-button blue">Añadir</button>
        <button onClick={saveToFirebase} className="form-button green">Guardar</button>
        <button onClick={exportarPDF} className="form-button purple">Descargar</button>
      </div>

      {/* PLANTILLA PARA EXPORTAR */}
      <div ref={pdfRef} className="pdf-template">
        <div className="pdf-content">
          <img ref={logoRef} src={logo} alt="Logo" className="logo-img" />
          <h2 className="pdf-title">REGISTRO DE ACCESOS A ÁREAS RESTRINGIDAS</h2>
          <p><strong>Institución:</strong> Prefectura de Cotopaxi</p>
          <p><strong>Área Restringida:</strong> {area}</p>
          <p><strong>Responsable del Área:</strong> {responsable}</p>
          <p><strong>Fecha:</strong> {fecha}</p>

          <table className="pdf-table" border="1">
            <thead>
              <tr>
                <th>Hora Ingreso</th>
                <th>Hora Salida</th>
                <th>Nombre</th>
                <th>Identificación</th>
                <th>Cargo</th>
                <th>Motivo</th>
                <th>Firma</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td>{r.ingreso}</td>
                  <td>{r.salida}</td>
                  <td>{r.nombre}</td>
                  <td>{r.identificacion}</td>
                  <td>{r.cargo}</td>
                  <td>{r.motivo}</td>
                  <td>{r.firma}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}