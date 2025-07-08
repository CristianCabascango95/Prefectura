const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Módulo para interactuar con el sistema de archivos

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Guarda con el nombre original
  }
});

const upload = multer({ storage: storage });

// Ruta para subir archivos
app.post('/upload', upload.array('documents', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No se seleccionaron archivos para subir.' });
  }

  const fileNames = req.files.map(file => file.filename);
  res.status(200).json({
    message: 'Archivos subidos exitosamente',
    files: fileNames,
    paths: req.files.map(file => `/uploads/${file.filename}`)
  });
});

// Ruta para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para listar archivos subidos
app.get('/files', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error al leer el directorio de subidas:', err);
      return res.status(500).json({ message: 'Error interno del servidor al listar archivos.' });
    }
    const fileList = files.filter(file => fs.lstatSync(path.join(uploadDir, file)).isFile());
    res.status(200).json({
      message: 'Lista de archivos',
      files: fileList.map(file => ({
        name: file,
        url: `${req.protocol}://${req.get('host')}/uploads/${file}`
      }))
    });
  });
});

// ✅ NUEVA RUTA: Eliminar archivo específico
app.delete('/files/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error al eliminar el archivo ${fileName}:`, err);
      return res.status(500).json({ message: 'No se pudo eliminar el archivo.' });
    }
    res.status(200).json({ message: `Archivo "${fileName}" eliminado correctamente.` });
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
