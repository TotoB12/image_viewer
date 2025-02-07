// index.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const exifParser = require('exif-parser'); // Ensure this dependency is installed
const session = require('express-session');

const app = express();
const port = 3000;

// Read the images folder and PIN from environment variables.
const imagesFolder = process.env.IMAGES_FOLDER;
const pinCode = process.env.PIN; // Your 4-digit PIN

if (!imagesFolder) {
  console.error("Error: IMAGES_FOLDER environment variable is not set.");
  process.exit(1);
}
if (!pinCode) {
  console.error("Error: PIN environment variable is not set.");
  process.exit(1);
}

// Set up session middleware.
app.use(session({
  secret: 'someSecret', // In production, use an environment variable for the secret.
  resave: false,
  saveUninitialized: false,
}));

// Middleware to parse JSON bodies.
app.use(express.json());

// Serve static files from the "public" folder.
app.use(express.static('public'));

// Authentication middleware – only allow access if the user is authenticated.
function isAuthenticated(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// API endpoint to check the PIN.
app.post('/api/authenticate', (req, res) => {
  const { pin } = req.body;
  if (pin === pinCode) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid PIN" });
  }
});

// Serve images only if authenticated.
app.use('/images', isAuthenticated, express.static(imagesFolder));

// API endpoint to list image files with metadata (protected).
app.get('/api/images', isAuthenticated, (req, res) => {
  fs.readdir(imagesFolder, async (err, files) => {
    if (err) {
      console.error("Error reading images folder:", err);
      return res.status(500).json({ error: "Could not read images folder." });
    }
    // Filter for common image file extensions.
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
    });

    // Process each image file to extract metadata.
    const imageDataPromises = imageFiles.map(file => {
      return new Promise(resolve => {
        const filePath = path.join(imagesFolder, file);
        fs.readFile(filePath, (err, data) => {
          let description = "";
          if (!err && data) {
            try {
              const ext = path.extname(file).toLowerCase();
              // Parse EXIF data for JPEG files.
              if (ext === '.jpg' || ext === '.jpeg') {
                const parser = exifParser.create(data);
                const result = parser.parse();
                if (result.tags && result.tags.ImageDescription) {
                  description = result.tags.ImageDescription;
                }
              }
            } catch (e) {
              console.error(`Error parsing EXIF for ${file}:`, e);
            }
          }
          // Fallback: derive a description from the file name.
          if (!description) {
            description = file.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
          }
          resolve({ file, description });
        });
      });
    });

    try {
      const imageData = await Promise.all(imageDataPromises);
      res.json(imageData);
    } catch (e) {
      console.error("Error processing image metadata", e);
      res.status(500).json({ error: "Error processing image metadata." });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
