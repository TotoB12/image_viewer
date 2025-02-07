// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/images')
      .then(response => response.json())
      .then(images => {
        console.log(images);
        // Shuffle the images array to display them in random order.
        shuffleArray(images);
        
        const grid = document.querySelector('.grid');
        
        // Create a grid item for each image object.
        images.forEach(imageObj => {
          const gridItem = document.createElement('div');
          gridItem.classList.add('grid-item');
          // Store the description (from metadata or fallback) in a data attribute.
          gridItem.dataset.description = imageObj.description;
          
          const imgElement = document.createElement('img');
          imgElement.src = `/images/${encodeURIComponent(imageObj.file)}`;
          imgElement.alt = imageObj.description;
          
          gridItem.appendChild(imgElement);
          grid.appendChild(gridItem);
        });
        
        // Wait for all images to load before initializing Masonry.
        imagesLoaded(grid, function() {
          const msnry = new Masonry(grid, {
            itemSelector: '.grid-item',
            columnWidth: '.grid-sizer',
            percentPosition: true,
            gutter: 10
          });
          
          // Listen for changes on the search bar to filter images.
          const searchInput = document.querySelector('.footer-blur input[type="text"]');
          searchInput.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            // Show or hide each grid item based on its description.
            document.querySelectorAll('.grid-item').forEach(item => {
              const desc = item.dataset.description.toLowerCase();
              item.style.display = desc.includes(term) ? "" : "none";
            });
            // Re-layout Masonry after filtering.
            msnry.layout();
          });
        });
      })
      .catch(error => {
        console.error('Error fetching images:', error);
      });
  });
  
  // Fisher–Yates shuffle algorithm to randomize the array.
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  