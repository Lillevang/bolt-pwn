const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bytes = require('bytes');
const mime = require('mime-types');
const { format } = require('date-fns');

const app = express();
const port = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Preserve original filename but ensure uniqueness
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const originalExt = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, originalExt);
    cb(null, `${originalName}-${uniqueSuffix}${originalExt}`);
  }
});

// Configure multer upload
const upload = multer({ 
  storage,
  limits: {
    // No practical limit (set to 5GB as a failsafe)
    fileSize: 5 * 1024 * 1024 * 1024
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Get all uploaded files
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve files' });
    }

    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
      return {
        name: filename,
        originalName: filename.split('-').slice(0, -1).join('-') || filename,
        path: `/uploads/${filename}`,
        size: stats.size,
        formattedSize: bytes(stats.size),
        type: mimeType,
        uploadDate: stats.mtime,
        formattedDate: format(stats.mtime, 'MMM dd, yyyy HH:mm')
      };
    });
    
    res.json(fileDetails);
  });
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  
  const fileInfo = {
    name: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size,
    formattedSize: bytes(req.file.size),
    type: req.file.mimetype,
    uploadDate: new Date(),
    formattedDate: format(new Date(), 'MMM dd, yyyy HH:mm')
  };
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    file: fileInfo
  });
});

// Handle multiple file uploads
app.post('/upload-multiple', upload.array('files', 100), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }
  
  const fileInfos = req.files.map(file => ({
    name: file.filename,
    originalName: file.originalname,
    path: `/uploads/${file.filename}`,
    size: file.size,
    formattedSize: bytes(file.size),
    type: file.mimetype,
    uploadDate: new Date(),
    formattedDate: format(new Date(), 'MMM dd, yyyy HH:mm')
  }));
  
  res.json({
    success: true,
    message: `${req.files.length} files uploaded successfully`,
    files: fileInfos
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});