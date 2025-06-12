// backend/server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Módulo para interactuar con el sistema de archivos

const app = express();
const PORT = process.env.PORT || 3001; // Render asignará un puerto, o usará 3001 localmente

// Middleware
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Permite parsear JSON en el cuerpo de las peticiones

// Configuración de Multer para el almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads'); // Directorio donde se guardarán los archivos
    // Crea el directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Guarda el archivo con su nombre original y un timestamp para evitar colisiones
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Ruta para subir archivos
app.post('/upload', upload.array('documents', 10), (req, res) => {
  // 'documents' es el nombre del campo en el formulario de subida
  // 10 es el número máximo de archivos permitidos
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No se seleccionaron archivos para subir.' });
  }

  const fileNames = req.files.map(file => file.filename);
  res.status(200).json({
    message: 'Archivos subidos exitosamente',
    files: fileNames,
    paths: req.files.map(file => `/uploads/${file.filename}`) // Rutas de los archivos subidos
  });
});

// Ruta para servir archivos estáticos (los archivos subidos)
// Esto es importante para que el frontend pueda acceder a los archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para listar archivos subidos (opcional, para visualización)
app.get('/files', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            console.error('Error al leer el directorio de subidas:', err);
            return res.status(500).json({ message: 'Error interno del servidor al listar archivos.' });
        }
        // Filtra para solo devolver archivos (ignora subdirectorios si los hubiera)
        const fileList = files.filter(file => fs.lstatSync(path.join(uploadDir, file)).isFile());
        res.status(200).json({
            message: 'Lista de archivos',
            files: fileList.map(file => ({
                name: file,
                url: `${req.protocol}://${req.get('host')}/uploads/${file}` // URL completa del archivo
            }))
        });
    });
});


// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend de subida de archivos funcionando!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});