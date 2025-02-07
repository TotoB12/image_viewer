// index.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Read the images folder from an environment variable.
const imagesFolder = process.env.IMAGES_FOLDER;
if (!imagesFolder) {
  console.error("Error: IMAGES_FOLDER environment variable is not set.");
  process.exit(1);
}

// Serve static files from the "public" folder.
app.use(express.static('public'));

// Serve images from the folder specified in the environment variable.
app.use('/images', express.static(imagesFolder));

// API endpoint to list image files.
app.get('/api/images', (req, res) => {
  fs.readdir(imagesFolder, (err, files) => {
    if (err) {
      console.error("Error reading images folder:", err);
      return res.status(500).json({ error: "Could not read images folder." });
    }
    // Filter files to include common image types.
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
    });
    res.json(imageFiles);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
