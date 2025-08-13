const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load env variables BEFORE requiring db

const app = express();
const db = require('./db'); // MongoDB connection

// ✅ CORS setup for Netlify
app.use(cors({
    origin: 'https://hackrx-delulu-guys.netlify.app', // ✅ No trailing slash
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight requests
app.options('*', cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Root test route
app.get('/', (req, res) => {
    console.log('🌟 REAL BACKEND REACHED');
    res.send('WELCOME TO BAJAJ FINANCE ✅');
});

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/user', userRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// ✅ Upload, Delete, Get docs routes (so axios calls match)
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// Upload doc
app.post('/upload-doc', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ success: true, file: req.file.filename });
});

// Delete doc
app.delete('/delete-doc/:name', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.name);
    fs.unlink(filePath, (err) => {
        if (err) return res.status(404).json({ error: 'File not found' });
        res.json({ success: true });
    });
});

// Get all docs
app.get('/get-docs', (req, res) => {
    const dirPath = path.join(__dirname, 'uploads');
    fs.readdir(dirPath, (err, files) => {
        if (err) return res.status(500).json({ error: 'Error reading files' });
        res.json({ documents: files });
    });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
