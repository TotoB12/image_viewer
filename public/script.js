// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/images')
      .then(response => response.json())
      .then(images => {
        // Shuffle images array to display in random order
        shuffleArray(images);
        
        const grid = document.querySelector('.grid');
        images.forEach(image => {
          // Create a grid item container
          const gridItem = document.createElement('div');
          gridItem.classList.add('grid-item');
          
          // Create the image element
          const imgElement = document.createElement('img');
          imgElement.src = `/images/${encodeURIComponent(image)}`;
          imgElement.alt = image;
          
          gridItem.appendChild(imgElement);
          grid.appendChild(gridItem);
        });
        
        // Wait for all images to load before initializing Masonry
        imagesLoaded(grid, function() {
          new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: '.grid-sizer',
            percentPosition: true,
            gutter: 10
          });
        });
      })
      .catch(error => {
        console.error('Error fetching images:', error);
      });
  });
  
  // Fisher–Yates shuffle algorithm to randomize the array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  