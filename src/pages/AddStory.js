//AddStory.js
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import MapComponent from '../components/MapComponent.js';
import CameraCapture from '../components/CameraCapture.js';
import { initMap } from '../components/MapComponent.js';
import { initCameraCapture } from '../components/CameraCapture.js';
import { addStory, isOnline } from '../utils/api.js'; // Import isOnline dari api.js
import { isLoggedIn } from '../utils/auth.js';
import database from '../utils/database.js';

export default function AddStory() {
  if (!isLoggedIn()) {
    return `
      <header class="app-header" role="banner">
        ${Header()}
      </header>
      <main id="main-content" class="app-main" role="main">
        <section class="auth-required-page" aria-labelledby="auth-required-title">
          <div class="container">
            <div class="auth-required-message">
              <h1 id="auth-required-title" class="page-main-title">Authentication Required</h1>
              <p class="page-subtitle">You need to be logged in to add a new dinosaur story.</p>
              <div class="auth-actions">
                <a href="#login" data-nav="login" class="btn btn-primary">Login</a>
                <a href="#register" data-nav="register" class="btn btn-secondary">Register</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer class="app-footer" role="contentinfo">
        ${Footer()}
      </footer>
    `;
  }

  return `
    <header class="app-header" role="banner">
      ${Header()}
    </header>
    <main id="main-content" class="app-main" role="main">
      <section class="add-story-page" aria-labelledby="add-story-main-title">
        <div class="container">
          <header class="add-story-header">
            <h1 id="add-story-main-title" class="page-main-title">Share Your Dinosaur Story</h1>
            <p class="page-subtitle">Contribute your own dinosaur discovery or story to our collection.</p>
            ${!isOnline() ? `
              <div class="network-status offline">
                <span>📱 You are offline</span>
                <small>Your story will be saved locally and submitted when you're back online</small>
              </div>
            ` : ''}
          </header>
          
          <form id="add-story-form" class="story-form" enctype="multipart/form-data">
            <section class="form-section" aria-labelledby="description-section-title">
              <h2 id="description-section-title" class="section-title">Story Details</h2>
              
              <div class="form-group">
                <label for="story-description" class="form-label">Description *</label>
                <textarea 
                  id="story-description" 
                  name="description" 
                  required 
                  aria-required="true"
                  aria-describedby="description-help"
                  rows="4"
                  placeholder="Describe your dinosaur discovery in detail"
                  class="form-input"
                ></textarea>
                <small id="description-help" class="form-help">Describe your dinosaur discovery or story in detail (minimum 10 characters)</small>
                <span class="error-message" id="description-error"></span>
              </div>
            </section>
            
            <section class="form-section" aria-labelledby="photo-section-title">
              <h2 id="photo-section-title" class="section-title">Add Photo</h2>
              
              <div class="form-group">
                <label for="story-photo" class="form-label">Upload Photo</label>
                <input 
                  type="file" 
                  id="story-photo" 
                  name="photo" 
                  accept="image/*" 
                  aria-describedby="photo-help"
                  class="form-input"
                />
                <small id="photo-help" class="form-help">Upload a photo of your discovery (JPEG, PNG, GIF, max 1MB) - Optional if using camera</small>
                <span class="error-message" id="photo-error"></span>
              </div>
              
              <div class="camera-section">
                <h3 id="camera-section-title" class="subsection-title">Or Capture from Camera</h3>
                ${CameraCapture()}
              </div>
            </section>
            
            <section class="form-section" aria-labelledby="location-section-title">
              <h2 id="location-section-title" class="section-title">Select Location</h2>
              
              <div class="form-group">
                <label class="form-label">Click on the map to set location *</label>
                <div class="map-instructions">
                  <p class="map-status" id="map-status">Preparing map...</p>
                </div>
                <div class="map-container small" id="add-story-map-container">
                  ${MapComponent('add-story-map')}
                </div>
                <div class="coordinates-display">
                  <p><strong>Selected Coordinates:</strong></p>
                  <div class="coordinates">
                    <span>Latitude: <span id="selected-lat" class="coordinate-value">Not selected</span></span>
                    <span>Longitude: <span id="selected-lon" class="coordinate-value">Not selected</span></span>
                  </div>
                </div>
                <input type="hidden" id="story-lat" name="lat" />
                <input type="hidden" id="story-lon" name="lon" />
                <span class="error-message" id="location-error"></span>
              </div>
            </section>
            
            <section class="form-actions-section">
              <h2 class="sr-only">Form Actions</h2>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                  ${isOnline() ? 'Submit Story' : 'Save Story Offline'}
                </button>
                <button type="reset" class="btn btn-secondary">Reset Form</button>
                <button type="button" id="refresh-map-btn" class="btn btn-tertiary">Refresh Map</button>
              </div>
            </section>
            
            <div id="form-message" class="form-message hidden" role="alert"></div>
          </form>
        </div>
      </section>
    </main>
    <footer class="app-footer" role="contentinfo">
      ${Footer()}
    </footer>
  `;
}

// Initialize add story page
window.initAddStoryPage = function() {
  console.log('🚀 Initializing Add Story page...');
  
  if (!isLoggedIn()) {
    console.warn('❌ User not authenticated, redirecting to login');
    window.location.hash = 'login';
    return;
  }
  
  initializeAddStoryComponents();
};

function initializeAddStoryComponents() {
  console.log('🔧 Initializing Add Story components...');
  
  // Update map status
  updateMapStatus('Initializing components...');
  
  // Initialize camera first
  const cleanupCamera = initCameraCapture();
  
  // Setup form validation
  setupFormValidation();
  
  // Initialize map with enhanced timing
  initializeLocationMap();
  
  // Add refresh map button handler
  const refreshMapBtn = document.getElementById('refresh-map-btn');
  if (refreshMapBtn) {
    refreshMapBtn.addEventListener('click', () => {
      console.log('🔄 Manually refreshing map...');
      updateMapStatus('Refreshing map...');
      initializeLocationMap();
    });
  }
  
  // Cleanup when leaving page
  window.addEventListener('hashchange', () => {
    console.log('🧹 Cleaning up Add Story page resources...');
    if (cleanupCamera) cleanupCamera();
    
    const mapElement = document.getElementById('add-story-map');
    if (mapElement && mapElement._leaflet_map) {
      mapElement._leaflet_map.remove();
      mapElement._leaflet_map = null;
    }
  });
}

function updateMapStatus(message) {
  const statusElement = document.getElementById('map-status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function initializeLocationMap() {
  console.log('🗺️ Initializing location map for Add Story...');
  updateMapStatus('Loading map...');
  
  const initializeMapWithRetry = (attempt = 1, maxAttempts = 3) => {
    console.log(`📍 Map initialization attempt ${attempt} of ${maxAttempts}`);
    updateMapStatus(`Loading map... (Attempt ${attempt}/${maxAttempts})`);
    
    // Check Leaflet availability
    if (!window.checkLeafletAvailability || !window.checkLeafletAvailability()) {
      console.warn('❌ Leaflet not available, waiting...');
      if (attempt < maxAttempts) {
        setTimeout(() => initializeMapWithRetry(attempt + 1, maxAttempts), 500);
      } else {
        console.error('❌ Failed to load Leaflet after maximum attempts');
        updateMapStatus('Map library failed to load. Please refresh the page.');
        showMapError('add-story-map', 'Map library failed to load. Please refresh the page.');
      }
      return;
    }
    
    // Initialize map with Promise
    initMap([], null, 'add-story-map')
      .then(map => {
        if (map) {
          console.log('✅ Add Story map initialized successfully');
          updateMapStatus('Map ready - click to select location');
          
          // Force final resize
          setTimeout(() => {
            if (map && typeof map.invalidateSize === 'function') {
              map.invalidateSize(true);
            }
          }, 500);
        } else {
          console.error('❌ Map initialization returned null');
          updateMapStatus('Map failed to load. Click Refresh Map to try again.');
        }
      })
      .catch(error => {
        console.error('❌ Error during map initialization:', error);
        updateMapStatus('Map loading error. Click Refresh Map to try again.');
        showMapError('add-story-map', `Map error: ${error.message}`);
      });
  };
  
  // Start the initialization process
  initializeMapWithRetry();
}

function showMapError(containerId, message) {
  const mapElement = document.getElementById(containerId);
  if (mapElement) {
    mapElement.innerHTML = `
      <div class="map-error" role="alert">
        <p>${message}</p>
        <button onclick="window.retryAddStoryMap()" class="btn btn-primary" aria-label="Retry loading map">
          Retry Map
        </button>
      </div>
    `;
  }
}

// Global retry function for Add Story map
window.retryAddStoryMap = function() {
  console.log('🔄 Retrying Add Story map initialization...');
  initializeLocationMap();
};

function setupFormValidation() {
  const form = document.getElementById('add-story-form');
  
  if (!form) {
    console.error('❌ Form not found');
    return;
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      await submitForm();
    }
  });
  
  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });
  
  form.addEventListener('reset', () => {
    const errorElements = form.querySelectorAll('.error-message');
    errorElements.forEach(error => {
      error.textContent = '';
    });
    
    const latElement = document.getElementById('selected-lat');
    const lonElement = document.getElementById('selected-lon');
    const latHidden = document.getElementById('story-lat');
    const lonHidden = document.getElementById('story-lon');
    
    if (latElement && lonElement) {
      latElement.textContent = 'Not selected';
      lonElement.textContent = 'Not selected';
      latElement.classList.remove('coordinate-selected');
      lonElement.classList.remove('coordinate-selected');
    }
    if (latHidden && lonHidden) {
      latHidden.value = '';
      lonHidden.value = '';
    }
    
    const preview = document.getElementById('camera-preview');
    const capturedImage = document.getElementById('captured-image');
    if (preview) preview.classList.add('hidden');
    if (capturedImage) {
      capturedImage.src = '';
      delete capturedImage.dataset.imageData;
    }
    
    const formMessage = document.getElementById('form-message');
    if (formMessage) {
      formMessage.classList.add('hidden');
    }
  });
}

function validateForm() {
  let isValid = true;
  
  const descInput = document.getElementById('story-description');
  const description = descInput ? descInput.value.trim() : '';
  if (!description) {
    showError('description-error', 'Description is required');
    isValid = false;
  } else if (description.length < 10) {
    showError('description-error', 'Description must be at least 10 characters long');
    isValid = false;
  }
  
  const photoFile = document.getElementById('story-photo')?.files[0];
  const capturedImageData = document.getElementById('captured-image')?.dataset.imageData;
  
  if (!photoFile && !capturedImageData) {
    showError('photo-error', 'Please upload a photo or capture one with your camera');
    isValid = false;
  } else if (photoFile) {
    const photoError = validateImageFile(photoFile);
    if (photoError) {
      showError('photo-error', photoError);
      isValid = false;
    }
  }
  
  const latElement = document.getElementById('selected-lat');
  const lonElement = document.getElementById('selected-lon');
  const lat = latElement ? latElement.textContent : '';
  const lon = lonElement ? lonElement.textContent : '';
  
  if (lat === 'Not selected' || lon === 'Not selected') {
    showError('location-error', 'Please select a location on the map');
    isValid = false;
  }
  
  return isValid;
}

function validateField(e) {
  const field = e.target;
  const errorId = `${field.name}-error`;
  
  if (field.required && !field.value.trim()) {
    showError(errorId, 'This field is required');
  } else if (field.name === 'description' && field.value.trim().length < 10) {
    showError(errorId, 'Description must be at least 10 characters long');
  }
}

function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const maxSize = 1 * 1024 * 1024;
  
  if (!validTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF)';
  }
  
  if (file.size > maxSize) {
    return 'Image size must be less than 1MB';
  }
  
  return null;
}

function clearFieldError(e) {
  const field = e.target;
  const errorId = `${field.name}-error`;
  clearError(errorId);
}

function showError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearError(errorId) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = '';
  }
}

async function submitForm() {
  const form = document.getElementById('add-story-form');
  const formMessage = document.getElementById('form-message');
  const submitBtn = form.querySelector('button[type="submit"]');
  
  if (!form || !submitBtn) {
    console.error('❌ Form or submit button not found');
    return;
  }
  
  // Update button text based on online status
  submitBtn.textContent = isOnline() ? 'Submitting...' : 'Saving Offline...';
  
  const formData = new FormData();
  
  formData.append('description', document.getElementById('story-description').value.trim());
  
  const lat = document.getElementById('selected-lat').textContent;
  const lon = document.getElementById('selected-lon').textContent;
  
  if (lat !== 'Not selected' && lon !== 'Not selected') {
    formData.append('lat', parseFloat(lat));
    formData.append('lon', parseFloat(lon));
  }
  
  const photoFile = document.getElementById('story-photo').files[0];
  const capturedImageData = document.getElementById('captured-image')?.dataset.imageData;
  
  if (capturedImageData) {
    try {
      const response = await fetch(capturedImageData);
      const blob = await response.blob();
      formData.append('photo', blob, 'camera-capture.jpg');
    } catch (error) {
      console.error('❌ Error converting camera capture:', error);
      showFormMessage('error', 'Failed to process camera photo. Please try again.');
      return;
    }
  } else if (photoFile) {
    formData.append('photo', photoFile);
  }
  
  console.log('📤 Submitting FormData with following entries:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = isOnline() ? 'Submitting...' : 'Saving Offline...';
    
    const result = await addStory(formData);
    
    showFormMessage('success', isOnline() 
      ? 'Story submitted successfully! Redirecting...' 
      : 'Story saved offline! It will be submitted when you are back online.');
    
    form.reset();
    
    document.getElementById('selected-lat').textContent = 'Not selected';
    document.getElementById('selected-lon').textContent = 'Not selected';
    document.getElementById('story-lat').value = '';
    document.getElementById('story-lon').value = '';
    
    const preview = document.getElementById('camera-preview');
    const capturedImage = document.getElementById('captured-image');
    if (preview) preview.classList.add('hidden');
    if (capturedImage) {
      capturedImage.src = '';
      delete capturedImage.dataset.imageData;
    }
    
    setTimeout(() => {
      window.location.hash = 'stories';
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error submitting story:', error);
    const errorMessage = error.message || 'Failed to submit story. Please try again.';
    showFormMessage('error', errorMessage);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isOnline() ? 'Submit Story' : 'Save Story Offline';
  }
}

function showFormMessage(type, message) {
  const formMessage = document.getElementById('form-message');
  if (formMessage) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.classList.remove('hidden');
    
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    if (type === 'success') {
      setTimeout(() => {
        formMessage.classList.add('hidden');
      }, 5000);
    }
  }
}