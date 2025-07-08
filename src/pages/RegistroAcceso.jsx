import React, { useRef, useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
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
  const [registros, setRegistros] = useState([initialEntry()]);
  const [searchNombre, setSearchNombre] = useState("");
  const [searchFecha, setSearchFecha] = useState("");
  const pdfRef = useRef();
  const logoRef = useRef();

  useEffect(() => {
    const loadLastEntry = async () => {
      try {
        const q = query(
          collection(db, "registro_accesos"),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          setRegistros(lastDoc.registros || [initialEntry()]);
        } else {
          setRegistros([initialEntry()]);
        }
      } catch (error) {
        console.error("Error al cargar datos desde Firebase: ", error);
        setRegistros([initialEntry()]);
      }
    };

    loadLastEntry();
  }, []);

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
    const datos = { area, responsable, fecha, registros, timestamp: new Date() };
    try {
      await addDoc(collection(db, "registro_accesos"), datos);
      alert("Datos guardados en Firebase.");
      setArea('');
      setResponsable('');
      setFecha('');
      setRegistros([initialEntry()]);
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

  // FILTRO: Por nombre y fecha
  const registrosFiltrados = registros.filter((r) =>
    r.nombre.toLowerCase().includes(searchNombre.toLowerCase()) &&
    (searchFecha === "" || fecha === searchFecha)
  );

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

      {/* 🔍 BÚSQUEDA */}
      <div className="search-filters" style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={searchNombre}
          onChange={(e) => setSearchNombre(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />
        <input
          type="date"
          value={searchFecha}
          onChange={(e) => setSearchFecha(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
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
          {registrosFiltrados.map((r) => (
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

      {/* PDF */}
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
              {registrosFiltrados.map((r) => (
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
