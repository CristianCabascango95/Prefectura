import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/logo.png';

const INFORMES_TECNICOS_COLLECTION = "informes_tecnicos_pref";

export default function InformeTecnico() {
  // ESTADOS EXISTENTES
  const [nombreResponsable, setNombreResponsable] = useState('');
  const [cargo, setCargo] = useState('');
  const [sistemaAplicacion, setSistemaAplicacion] = useState('');
  const [tipoAccion, setTipoAccion] = useState({
    altaUsuario: false,
    bajaUsuario: false,
    modificacionPermisos: false,
    auditoria: false,
    revisionAccesos: false,
    otro: false,
  });
  const [unidad, setUnidad] = useState('');
  
  // NUEVO ESTADO para la FECHA PRINCIPAL (usando input type="date")
  const [fechaPrincipal, setFechaPrincipal] = useState(''); // Formato 'YYYY-MM-DD'

  const [detalleAccion, setDetalleAccion] = useState('');
  const [motivoJustificacion, setMotivoJustificacion] = useState('');
  const [usuariosAfectados, setUsuariosAfectados] = useState('');

  const [resultadosObservaciones, setResultadosObservaciones] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');

  const [evidencias, setEvidencias] = useState({
    capturaPantalla: false,
    registroSistema: false,
    autorizacionJefatura: false,
    logTecnico: false,
    otraEvidencia: '',
  });

  const [firmaResponsableTecnico, setFirmaResponsableTecnico] = useState('');
  const [revisadoPor, setRevisadoPor] = useState('');

  // ESTADO para la fecha de validación
  const [fechaValidacion, setFechaValidacion] = useState(''); // Formato 'YYYY-MM-DD'

  // Refs para el PDF y el Logo
  const informeRef = useRef();
  const logoRef = useRef();

  // Función para restablecer todos los campos del formulario
  const resetForm = () => {
    setNombreResponsable('');
    setCargo('');
    setSistemaAplicacion('');
    setTipoAccion({
      altaUsuario: false,
      bajaUsuario: false,
      modificacionPermisos: false,
      auditoria: false,
      revisionAccesos: false,
      otro: false,
    });
    setUnidad('');
    setFechaPrincipal('');
    setDetalleAccion('');
    setMotivoJustificacion('');
    setUsuariosAfectados('');
    setResultadosObservaciones('');
    setRecomendaciones('');
    setEvidencias({
      capturaPantalla: false,
      registroSistema: false,
      autorizacionJefatura: false,
      logTecnico: false,
      otraEvidencia: '',
    });
    setFirmaResponsableTecnico('');
    setRevisadoPor('');
    setFechaValidacion('');
  };

  // Handlers para cambios en checkboxes
  const handleTipoAccionChange = (e) => {
    const { name, checked } = e.target;
    setTipoAccion((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleEvidenciasChange = (e) => {
    const { name, checked } = e.target;
    setEvidencias((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Lógica para cargar el último informe guardado desde Firebase al iniciar
  useEffect(() => {
    // ELIMINA O COMENTA ESTA LÍNEA SI QUIERES QUE SIEMPRE ESTÉ LIMPIO AL RECARGAR
    // loadLastInforme(); 
    // Si no tienes otra lógica aquí, puedes incluso eliminar todo el useEffect si solo lo usabas para cargar el último informe.
  }, []); // Se ejecuta una vez al montar el componente

  // La función loadLastInforme sigue estando definida, solo no se llama al inicio.
  // Podrías llamarla con un botón "Cargar Último Informe" si lo deseas en el futuro.
  const loadLastInforme = async () => {
      try {
        const q = query(
          collection(db, INFORMES_TECNICOS_COLLECTION),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          setUnidad(lastDoc.unidad || '');
          
          // MODIFICACIÓN: Cargar la fecha principal para el input type="date"
          if (lastDoc.fecha) {
            const [mainDay, mainMonth, mainYear] = lastDoc.fecha.split('/');
            const mainFullYear = mainYear.length === 2 ? `20${mainYear}` : mainYear;
            setFechaPrincipal(`${mainFullYear}-${mainMonth.padStart(2, '0')}-${mainDay.padStart(2, '0')}`);
          } else {
            setFechaPrincipal('');
          }

          setNombreResponsable(lastDoc.nombreResponsable || '');
          setCargo(lastDoc.cargo || '');
          setSistemaAplicacion(lastDoc.sistemaAplicacion || '');
          setTipoAccion(lastDoc.tipoAccion || { altaUsuario: false, bajaUsuario: false, modificacionPermisos: false, auditoria: false, revisionAccesos: false, otro: false });
          setDetalleAccion(lastDoc.detalleAccion || '');
          setMotivoJustificacion(lastDoc.motivoJustificacion || '');
          setUsuariosAfectados(lastDoc.usuariosAfectados || '');
          setResultadosObservaciones(lastDoc.resultadosObservaciones || '');
          setRecomendaciones(lastDoc.recomendaciones || '');
          setEvidencias(lastDoc.evidencias || { capturaPantalla: false, registroSistema: false, autorizacionJefatura: false, logTecnico: false, otraEvidencia: '' });
          setFirmaResponsableTecnico(lastDoc.firmaResponsableTecnico || '');
          setRevisadoPor(lastDoc.revisadoPor || '');

          // Cargar la fecha de validación para el input type="date"
          if (lastDoc.fechaValidacion) {
            const [valDay, valMonth, valYear] = lastDoc.fechaValidacion.split('/');
            const fullYear = valYear.length === 2 ? `20${valYear}` : valYear;
            setFechaValidacion(`${fullYear}-${valMonth.padStart(2, '0')}-${valDay.padStart(2, '0')}`);
          } else {
            setFechaValidacion('');
          }
        }
      } catch (error) {
        console.error("Error al cargar el último informe desde Firebase: ", error);
      }
    };


  // Función para manejar el guardado de datos en Firebase
  const saveToFirebase = async () => {
    // Preparar la fecha principal para Firebase en el formato deseado (ej: DD/MM/YYYY)
    let fechaPrincipalParaFirebase = '';
    if (fechaPrincipal) {
      const [year, month, day] = fechaPrincipal.split('-');
      fechaPrincipalParaFirebase = `${day}/${month}/${year}`;
    }

    // Preparar la fecha de validación para Firebase en el formato deseado (ej: DD/MM/YYYY)
    let fechaValidacionParaFirebase = '';
    if (fechaValidacion) {
      const [year, month, day] = fechaValidacion.split('-');
      fechaValidacionParaFirebase = `${day}/${month}/${year}`;
    }

    const formData = {
      unidad,
      fecha: fechaPrincipalParaFirebase, // Usar la fecha principal formateada
      nombreResponsable,
      cargo,
      sistemaAplicacion,
      tipoAccion,
      detalleAccion,
      motivoJustificacion,
      usuariosAfectados,
      resultadosObservaciones,
      recomendaciones,
      evidencias,
      firmaResponsableTecnico,
      revisadoPor,
      fechaValidacion: fechaValidacionParaFirebase,
      timestamp: new Date()
    };

    try {
      await addDoc(collection(db, INFORMES_TECNICOS_COLLECTION), formData);
      alert("Informe técnico guardado en Firebase exitosamente.");
    } catch (error) {
      console.error("Error al guardar el informe técnico en Firebase: ", error);
      alert("Error al guardar el informe técnico. Por favor, inténtalo de nuevo.");
    }
  };

  // Función para descargar el informe como PDF (con manejo de múltiples páginas)
  const exportarPDF = () => {
    const logoImage = logoRef.current;

    if (!logoImage || !logoImage.complete) {
      const handleLoad = () => {
        logoImage.removeEventListener('load', handleLoad);
        exportarPDF();
      };
      if (logoImage) {
          logoImage.addEventListener('load', handleLoad);
      }
      return;
    }

    const input = informeRef.current;
    if (!input) {
      console.error("No se encontró el elemento para generar el PDF.");
      return;
    }

    // --- Preparar el DOM para la captura (ocultar y transformar) ---
    const buttons = input.querySelectorAll('.submit-button, .download-button');
    buttons.forEach(button => button.style.display = 'none');

    // Selecciona todos los inputs y textareas que pueden tener texto largo
    // AHORA INCLUYE input[type="date"] para ambas fechas
    const interactiveElements = input.querySelectorAll('.input-line, .textarea-line, input[type="date"]');
    interactiveElements.forEach(el => {
      // Aplicar estilos directamente para la captura, que emulan los de @media print
      el.style.border = 'none';
      el.style.borderBottom = '1px solid #000'; // Asegurar borde visible
      el.style.padding = '2px 0'; // Ajustar padding
      el.style.boxShadow = 'none';
      el.style.outline = 'none';
      el.style.backgroundColor = 'transparent'; // Asegurar fondo transparente
      el.style.color = '#000'; // Asegurar color de texto negro

      // ESTOS SON CRUCIALES PARA EL AJUSTE DE TEXTO Y PARA html2canvas
      el.style.whiteSpace = 'normal'; // Permite que el texto se ajuste
      el.style.wordBreak = 'break-word'; // Rompe palabras largas
      el.style.overflow = 'visible'; // Asegura que no se oculte contenido
      el.style.minWidth = '0'; // Permite que el elemento se encoja si es necesario
      el.style.flexShrink = '1'; // Permite que el elemento se encoja dentro de un flex container
    });

    const checkboxLabels = input.querySelectorAll('.checkbox-group label');
    const tempSpans = [];
    checkboxLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox) {
            const textContent = checkbox.checked ? '(X)' : '( )';
            const newSpan = document.createElement('span');
            newSpan.textContent = textContent;
            newSpan.style.display = 'inline-block';
            newSpan.style.verticalAlign = 'middle';
            newSpan.style.marginRight = '5px';
            newSpan.style.color = '#000';
            newSpan.style.fontWeight = 'bold';
            label.insertBefore(newSpan, checkbox);
            checkbox.style.display = 'none';
            tempSpans.push({ label, span: newSpan, checkbox });
        }
    });
    // --- Fin de preparación del DOM ---

    html2canvas(input, {
      scale: 2, // Aumenta la escala para mejor resolución en el PDF
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.scrollHeight,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // Ancho A4
      const pageHeight = 297; // Alto A4
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("informe_tecnico.pdf");
      
      // Una vez que el PDF se guarda, limpiar el formulario
      resetForm();

    }).catch(error => {
        console.error("Error al generar el PDF:", error);
    }).finally(() => { // Siempre restaurar el DOM, incluso si hay errores
        // --- Restaurar el DOM después de la generación del PDF ---
        buttons.forEach(button => button.style.display = '');

        interactiveElements.forEach(el => {
          el.style.border = ''; // Limpiar los estilos inline
          el.style.borderBottom = '1px solid #000'; // Restaurar el borde inferior CSS (si aplica)
          el.style.padding = '';
          el.style.boxShadow = '';
          el.style.outline = '';
          el.style.backgroundColor = '';
          el.style.color = '';
          el.style.whiteSpace = ''; // Restaurar
          el.style.wordBreak = ''; // Restaurar
          el.style.overflow = ''; // Restaurar
          el.style.minWidth = ''; // Restaurar
          el.style.flexShrink = ''; // Restaurar
        });

        tempSpans.forEach(({ label, span, checkbox }) => {
            if (checkbox) {
                checkbox.style.display = '';
                if (span) {
                    label.removeChild(span);
                }
            }
        });
        // --- Fin de restauración del DOM ---
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveToFirebase();
  };

  return (
    <div className="app-container-wrapper">
      <div className="informe-container" ref={informeRef}>
        <form onSubmit={handleSubmit} className="informe-form">
          {/* Encabezado del Formulario */}
          <div className="informe-header">
            <img ref={logoRef} src={logo} alt="Logo Prefectura Cotopaxi" className="logo-informe" />
            <div className="header-text">
              <p><strong>PREFECTURA DE COTOPAXI</strong></p>
              <p><strong>INFORME TÉCNICO EN EL ÁMBITO DE SU COMPETENCIA</strong></p>
              <p>Gestión de Accesos a Sistemas y Aplicaciones</p>
            </div>
          </div>

          <div className="header-details">
            <label>
              Unidad:
              <input type="text" value={unidad} onChange={(e) => setUnidad(e.target.value)} className="input-line" />
            </label>
            {/* AQUÍ ESTÁ EL CAMBIO PARA LA FECHA DEL PRINCIPIO */}
            <label className="fecha-input-group">
              Fecha:
              <input
                type="date" // <--- CAMBIO CLAVE AQUÍ
                value={fechaPrincipal} // <--- USA EL NUEVO ESTADO
                onChange={(e) => setFechaPrincipal(e.target.value)} // <--- ACTUALIZA EL NUEVO ESTADO
                className="input-line" // Mantén esta clase para estilos básicos
              />
            </label>
          </div>
          

          {/* Sección 1: Datos Generales */}
          <div className="section">
            <h3>• 1. Datos Generales</h3>
            <ul>
              <li>
                <label>
                  Nombre del responsable:
                  <input type="text" value={nombreResponsable} onChange={(e) => setNombreResponsable(e.target.value)} className="input-line large" />
                </label>
              </li>
              <li>
                <label>
                  Cargo:
                  <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className="input-line large" />
                </label>
              </li>
              <li>
                <label>
                  Sistema o aplicación intervenida:
                  <input type="text" value={sistemaAplicacion} onChange={(e) => setSistemaAplicacion(e.target.value)} className="input-line large" />
                </label>
              </li>
              <li>
                <label>
                  Tipo de acción realizada:
                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" name="altaUsuario" checked={tipoAccion.altaUsuario} onChange={handleTipoAccionChange} />
                      ( ) Alta de usuario
                    </label>
                    <label>
                      <input type="checkbox" name="bajaUsuario" checked={tipoAccion.bajaUsuario} onChange={handleTipoAccionChange} />
                      ( ) Baja de usuario
                    </label>
                    <label>
                      <input type="checkbox" name="modificacionPermisos" checked={tipoAccion.modificacionPermisos} onChange={handleTipoAccionChange} />
                      ( ) Modificación de permisos
                    </label>
                    <label>
                      <input type="checkbox" name="auditoria" checked={tipoAccion.auditoria} onChange={handleTipoAccionChange} />
                      ( ) Auditoría
                    </label>
                    <label>
                      <input type="checkbox" name="revisionAccesos" checked={tipoAccion.revisionAccesos} onChange={handleTipoAccionChange} />
                      ( ) Revisión de accesos
                    </label>
                    <label>
                      <input type="checkbox" name="otro" checked={tipoAccion.otro} onChange={handleTipoAccionChange} />
                      ( ) Otro
                    </label>
                  </div>
                </label>
              </li>
            </ul>
          </div>
          

          {/* Sección 2: Descripción de la Actividad Técnica */}
          <div className="section">
            <h3>• 2. Descripción de la Actividad Técnica</h3>
            <p className="description-text">
              (Describir de forma clara la acción técnica ejecutada: a qué usuario se dio de alta, baja,
              cambios realizados, perfil aplicado, módulos habilitados, entre otros.)
            </p>
            <textarea
              className="textarea-line"
              value={detalleAccion}
              onChange={(e) => setDetalleAccion(e.target.value)}
              rows="3"
            ></textarea>

            <p>Motivo o justificación:</p>
            <p className="description-text">
              (Indicar si fue por ingreso de nuevo personal, rotación de funciones, requerimiento
              institucional, auditoría, incidente, etc.)
            </p>
            <textarea
              className="textarea-line"
              value={motivoJustificacion}
              onChange={(e) => setMotivoJustificacion(e.target.value)}
              rows="2"
            ></textarea>
          </div>
          

          {/* Sección de Usuarios Afectados */}
          <div className="section">
            <label>
              Usuarios afectados (si aplica):
              <textarea
                className="textarea-line"
                value={usuariosAfectados}
                onChange={(e) => setUsuariosAfectados(e.target.value)}
                rows="0"
              ></textarea>
            </label>
          </div>
          

          {/* Sección 3: Resultados / Observaciones */}
          <div className="section">
            <h3>• 3. Resultados / Observaciones</h3>
            <p className="description-text">
              (Registrar resultados obtenidos, condiciones encontradas, alertas técnicas, limitaciones del
              sistema o riesgos identificados.)
            </p>
            <textarea
              className="textarea-line"
              value={resultadosObservaciones}
              onChange={(e) => setResultadosObservaciones(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          {/* Sección 4: Recomendaciones */}
          <div className="section">
            <h3>• 4. Recomendaciones (si aplica)</h3>
            <p className="description-text">
              (Sugerencias técnicas, medidas preventivas, mejoras o solicitudes adicionales.)
            </p>
            <textarea
              className="textarea-line"
              value={recomendaciones}
              onChange={(e) => setRecomendaciones(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          {/* Sección 5: Evidencias adjuntas */}
          <div className="section">
            <h3>• 5. Evidencias adjuntas</h3>
            <p className="description-text">
              (Marcar lo que se adjunta y especificar si corresponde)
            </p>
            <div className="checkbox-group evidences-group">
              <label>
                <input type="checkbox" name="capturaPantalla" checked={evidencias.capturaPantalla} onChange={handleEvidenciasChange} />
                [ ] Captura de pantalla
              </label>
              <label>
                <input type="checkbox" name="registroSistema" checked={evidencias.registroSistema} onChange={handleEvidenciasChange} />
                [ ] Registro del sistema
              </label>
              <label>
                <input type="checkbox" name="autorizacionJefatura" checked={evidencias.autorizacionJefatura} onChange={handleEvidenciasChange} />
                [ ] Autorización de jefatura
              </label>
              <label>
                <input type="checkbox" name="logTecnico" checked={evidencias.logTecnico} onChange={handleEvidenciasChange} />
                [ ] Log técnico
              </label>
              <label>
                [ ] Otro:
                <input type="text" name="otraEvidencia" value={evidencias.otraEvidencia} onChange={(e) => setEvidencias({...evidencias, otraEvidencia: e.target.value})} className="input-line small" />
              </label>
            </div>
          </div>
          

          {/* Sección 6: Validación */}
          <div className="section">
            <h3>• 6. Validación</h3>
            <ul>
              <li>
                <label>
                  Firma del responsable técnico:
                  <input type="text" value={firmaResponsableTecnico} onChange={(e) => setFirmaResponsableTecnico(e.target.value)} className="input-line large" />
                </label>
              </li>
              <li>
                <label>
                  Revisado por (jefatura inmediata):
                  <input type="text" value={revisadoPor} onChange={(e) => setRevisadoPor(e.target.value)} className="input-line large" />
                </label>
              </li>
              <li>
                <label className="fecha-input-group">
                  Fecha de validación:
                  <input
                    type="date"
                    value={fechaValidacion}
                    onChange={(e) => setFechaValidacion(e.target.value)}
                    className="input-line"
                  />
                </label>
              </li>
            </ul>
          </div>
          

          {/* Contenedor de botones */}
          <div className="button-group">
            <button type="submit" className="submit-button">Guardar Informe</button>
            <button type="button" onClick={exportarPDF} className="download-button">Descargar Informe</button>
          </div>
        </form>
      </div>
    </div>
  );
}