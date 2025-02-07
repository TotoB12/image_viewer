// index.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const exifParser = require('exif-parser'); // Make sure to install this dependency

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

// API endpoint to list image files with their descriptions from metadata.
app.get('/api/images', (req, res) => {
  fs.readdir(imagesFolder, async (err, files) => {
    if (err) {
      console.error("Error reading images folder:", err);
      return res.status(500).json({ error: "Could not read images folder." });
    }
    // Filter for image files with common extensions.
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
              // Attempt to parse EXIF data only for JPEG files.
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
