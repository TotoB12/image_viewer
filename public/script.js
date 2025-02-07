// public/script.js
document.addEventListener('DOMContentLoaded', () => {
  // Check if a PIN was previously stored in localStorage.
  const storedPin = localStorage.getItem('pin');
  if (storedPin) {
    authenticatePin(storedPin).then(success => {
      if (success) {
        hidePinModal();
        loadImages();
      } else {
        showPinModal();
      }
    }).catch(() => {
      showPinModal();
    });
  } else {
    showPinModal();
  }
  
  // Initialize the PIN pad UI.
  setupPinPad();
});

function setupPinPad() {
  const pinDisplay = document.getElementById('pinDisplay');
  const pinError = document.getElementById('pinError');
  let currentPin = "";

  // Update the display with the current PIN entry (masked with underscores).
  function updateDisplay() {
    let display = currentPin.padEnd(4, '_');
    pinDisplay.textContent = display.split('').join(' ');
  }

  // Add click event listeners for each digit button.
  document.querySelectorAll('.pin-button').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-value');
      if (value) {
        if (currentPin.length < 4) {
          currentPin += value;
          updateDisplay();
        }
      }
    });
  });

  // Clear button resets the PIN entry.
  const clearButton = document.getElementById('clearButton');
  clearButton.addEventListener('click', () => {
    currentPin = "";
    updateDisplay();
    pinError.textContent = "";
  });

  // Backspace button removes the last entered digit.
  const backspaceButton = document.getElementById('backspaceButton');
  backspaceButton.addEventListener('click', () => {
    currentPin = currentPin.slice(0, -1);
    updateDisplay();
    pinError.textContent = "";
  });

  // When the user clicks "Submit", verify the PIN.
  const submitButton = document.getElementById('submitPin');
  submitButton.addEventListener('click', () => {
    if (currentPin.length !== 4) {
      pinError.textContent = "Please enter a 4-digit PIN.";
      return;
    }
    authenticatePin(currentPin).then(success => {
      if (success) {
        localStorage.setItem('pin', currentPin);
        hidePinModal();
        loadImages();
      } else {
        pinError.textContent = "Invalid PIN. Try again.";
        currentPin = "";
        updateDisplay();
      }
    }).catch(() => {
      pinError.textContent = "Error verifying PIN.";
    });
  });
}

// Sends the entered PIN to the server for authentication.
function authenticatePin(pin) {
  return fetch('/api/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: pin })
  })
  .then(response => response.ok)
  .catch(error => {
    console.error('Error authenticating PIN:', error);
    return false;
  });
}

// Hides the PIN modal.
function hidePinModal() {
  const modal = document.getElementById('pinModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Displays the PIN modal.
function showPinModal() {
  const modal = document.getElementById('pinModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Loads the images and sets up the Masonry grid as before.
function loadImages() {
  fetch('/api/images')
    .then(response => response.json())
    .then(images => {
      console.log(images);
      // Shuffle images to display them in random order.
      shuffleArray(images);
      
      const grid = document.querySelector('.grid');
      images.forEach(imageObj => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        // Save the description (from metadata or fallback) as a data attribute.
        gridItem.dataset.description = imageObj.description;
        
        const imgElement = document.createElement('img');
        imgElement.src = `/images/${encodeURIComponent(imageObj.file)}`;
        imgElement.alt = imageObj.description;
        
        gridItem.appendChild(imgElement);
        grid.appendChild(gridItem);
      });
      
      // Wait for images to load before initializing Masonry.
      imagesLoaded(grid, function() {
        const msnry = new Masonry(grid, {
          itemSelector: '.grid-item',
          columnWidth: '.grid-sizer',
          percentPosition: true,
          // fitWidth: true,
          gutter: 10
        });
        
        // Filter images based on search input.
        const searchInput = document.querySelector('.footer-blur input[type="text"]');
        searchInput.addEventListener('input', function(e) {
          const term = e.target.value.toLowerCase();
          document.querySelectorAll('.grid-item').forEach(item => {
            const desc = item.dataset.description.toLowerCase();
            item.style.display = desc.includes(term) ? "" : "none";
          });
          msnry.layout();
        });
      });
    })
    .catch(error => {
      console.error('Error fetching images:', error);
    });
}

// Fisher–Yates shuffle algorithm.
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
