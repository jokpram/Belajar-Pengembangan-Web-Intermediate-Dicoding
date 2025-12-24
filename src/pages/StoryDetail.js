//StoryDetail.js
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import { getStory, isOnline } from '../utils/api.js';
import { isLoggedIn } from '../utils/auth.js';
import database from '../utils/database.js';

export default function StoryDetail() {
  return `
    ${Header()}
    <main id="main-content">
      <section class="story-detail-page">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumb">
            <a href="#stories" data-nav="stories" class="back-link">← Back to Stories</a>
          </nav>
          <div id="story-detail-content">
            <div class="loading" aria-live="polite" aria-busy="true">
              <div class="loading-spinner"></div>
              <p>Loading story details...</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${Footer()}
  `;
}

// Initialize story detail page
window.loadStoryDetail = async function() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const storyId = urlParams.get('id');
  
  const contentElement = document.getElementById('story-detail-content');
  if (!contentElement) {
    console.error('Story detail content element not found');
    return;
  }
  
  if (!storyId) {
    contentElement.innerHTML = `
      <div class="error" role="alert">
        <h1 class="page-main-title">Story Not Found</h1>
        <p class="page-subtitle">The requested story could not be found.</p>
        <a href="#stories" data-nav="stories" class="btn btn-primary">Back to Stories</a>
      </div>
    `;
    return;
  }
  
  try {
    // Show loading state
    contentElement.innerHTML = `
      <div class="loading" aria-live="polite" aria-busy="true">
        <div class="loading-spinner"></div>
        <p>Loading story details...</p>
        ${!isOnline() ? '<p><small>📱 Loading from offline cache...</small></p>' : ''}
      </div>
    `;

    const story = await getStory(storyId);
    
    // Validate story data
    if (!story || typeof story !== 'object') {
      throw new Error('Invalid story data received');
    }
    
    displayStoryDetail(story);
  } catch (error) {
    console.error('Error loading story detail:', error);
    
    // Try to load from all cached stories as fallback
    try {
      const allStories = await database.getAllStories();
      const cachedStory = allStories.find(s => s.id === storyId);
      
      if (cachedStory) {
        console.log('Found story in cached stories, displaying...');
        displayStoryDetail(cachedStory);
        return;
      }
    } catch (cacheError) {
      console.error('Error searching in cached stories:', cacheError);
    }
    
    contentElement.innerHTML = `
      <div class="error" role="alert">
        <h1 class="page-main-title">Error Loading Story</h1>
        <p class="page-subtitle">Failed to load story details: ${error.message}</p>
        ${!isOnline() ? `
          <div class="offline-help">
            <p>📱 <strong>You are offline</strong></p>
            <p>This story is not available in your offline cache.</p>
            <p>Please go online to view this story, or browse other available stories.</p>
          </div>
        ` : ''}
        <div class="error-actions">
          <a href="#stories" data-nav="stories" class="btn btn-primary">Back to Stories</a>
          <button class="btn btn-secondary" id="retry-detail-btn">Try Again</button>
        </div>
      </div>
    `;
    
    // Add retry event listener
    const retryBtn = document.getElementById('retry-detail-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', window.loadStoryDetail);
    }
  }
};

function displayStoryDetail(story) {
  // Safe data extraction dengan fallback values
  const storyName = story.name || 'Untitled Story';
  const storyDescription = story.description || 'No description available.';
  
  // Use offline-safe image URL
  const photoUrl = getSafeImageUrl(story.photoUrl);
  
  const createdAt = story.createdAt || new Date().toISOString();
  
  // Safe date formatting
  let formattedDate;
  try {
    formattedDate = new Date(createdAt).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    formattedDate = 'Unknown date';
  }
  
  // Safe coordinate handling
  const hasValidCoordinates = story.lat && story.lon && 
                             !isNaN(parseFloat(story.lat)) && 
                             !isNaN(parseFloat(story.lon)) &&
                             Math.abs(parseFloat(story.lat)) <= 90 &&
                             Math.abs(parseFloat(story.lon)) <= 180;
  
  const locationText = hasValidCoordinates ? 
    `${parseFloat(story.lat).toFixed(4)}, ${parseFloat(story.lon).toFixed(4)}` : 
    'Location not specified';
  
  const contentElement = document.getElementById('story-detail-content');
  contentElement.innerHTML = `
    <article class="story-detail" itemscope itemtype="https://schema.org/CreativeWork">
      ${story.isOffline ? `
        <div class="offline-banner">
          <span>📱 Offline Story</span>
          <small>This story is saved locally and will be submitted when you're back online</small>
        </div>
      ` : ''}
      
      <header class="story-detail-header">
        <h1 class="page-main-title" itemprop="name">${escapeHtml(storyName)}</h1>
        <div class="story-detail-meta">
          <time datetime="${createdAt}" itemprop="dateCreated" class="story-date">Posted on ${formattedDate}</time>
          <span class="story-location" itemprop="location" itemscope itemtype="https://schema.org/Place">
            <span itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates">
              📍 Location: ${locationText}
              ${hasValidCoordinates ? `
                <meta itemprop="latitude" content="${story.lat}">
                <meta itemprop="longitude" content="${story.lon}">
              ` : ''}
            </span>
          </span>
          ${!isOnline() && !story.isOffline ? `
            <div class="offline-indicator-small">
              <small>📱 Showing cached version</small>
            </div>
          ` : ''}
        </div>
      </header>
      
      <div class="story-detail-content">
        <section class="story-image-section" aria-labelledby="story-image-title">
          <h2 id="story-image-title" class="sr-only">Story Image</h2>
          <div class="story-image-large">
            <img 
              src="${photoUrl}" 
              alt="${escapeHtml(storyName)} - ${escapeHtml(storyDescription.substring(0, 100))}${storyDescription.length > 100 ? '...' : ''}" 
              itemprop="image"
              loading="lazy"
              decoding="async"
              onerror="this.src='${getPlaceholderImage()}'"
            />
          </div>
        </section>
        
        <section class="story-description-section" aria-labelledby="story-description-title">
          <h2 id="story-description-title" class="section-title">Story Description</h2>
          <div class="story-description" itemprop="description">
            <p>${escapeHtml(storyDescription)}</p>
          </div>
        </section>
        
        ${hasValidCoordinates ? `
          <section class="story-map-section" aria-labelledby="story-map-title">
            <h2 id="story-map-title" class="section-title">Story Location</h2>
            <div id="detail-map" class="map detail-map" 
                 role="application" 
                 aria-label="Map showing story location at ${locationText}"
                 tabindex="0">
              <div class="map-loading">Loading map...</div>
            </div>
            <p class="map-instruction">This map shows the location where this story took place.</p>
          </section>
        ` : `
          <section class="no-location-section" aria-labelledby="no-location-title">
            <h2 id="no-location-title" class="section-title">Location Information</h2>
            <div class="no-location">
              <p>📍 No location information available for this story.</p>
            </div>
          </section>
        `}
      </div>
    </article>
  `;
  
  // Initialize map if coordinates exist
  if (hasValidCoordinates) {
    initializeDetailMap(story);
  }
}

// Get safe image URL that works offline
function getSafeImageUrl(photoUrl) {
  if (!photoUrl) {
    return getPlaceholderImage();
  }
  
  // If it's already a data URL, use it directly
  if (photoUrl.startsWith('data:')) {
    return photoUrl;
  }
  
  // If it's a relative path and we're offline, use placeholder
  if (!isOnline() && (photoUrl.startsWith('/') || photoUrl.includes('placeholder-image.jpg'))) {
    return getPlaceholderImage();
  }
  
  return photoUrl;
}

// Get offline-safe placeholder image
function getPlaceholderImage() {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOGY4Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzIyMy44MTQgMTUwIDI0MyAxMzAuODE0IDI0MyAxMDdDMjQzIDgzLjE4NTggMjIzLjgxNCA2NCAyMDAgNjRDMTc2LjE4NiA2NCAxNTcgODMuMTg1OCAxNTcgMTA3QzE1NyAxMzAuODE0IDE3Ni4xODYgMTUwIDIwMCAxNTBaIiBmaWxsPSIjZGRkIi8+CjxwYXRoIGQ9Ik0xMDAgMjAwSDMwMFYyMzBIMTAwVjIwMFoiIGZpbGw9IiNkZGQiLz4KPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+llSBEaW5vc2F1ciBJbWFnZTwvdGV4dD4KPC9zdmc+';
}

function initializeDetailMap(story) {
  const mapElement = document.getElementById('detail-map');
  if (!mapElement) {
    console.error('Detail map element not found');
    return;
  }
  
  // Check if Leaflet is available
  if (typeof L === 'undefined') {
    console.warn('Leaflet not available, waiting...');
    mapElement.innerHTML = `
      <div class="map-error">
        <p>Map library is still loading...</p>
        <button class="btn btn-primary" id="retry-detail-map">Retry Map</button>
      </div>
    `;
    
    // Add retry event listener
    const retryBtn = document.getElementById('retry-detail-map');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => initializeDetailMap(story));
    }
    
    // Retry after delay
    setTimeout(() => {
      if (typeof L !== 'undefined') {
        initializeDetailMap(story);
      }
    }, 1000);
    return;
  }
  
  // Safe coordinate parsing
  const lat = parseFloat(story.lat);
  const lon = parseFloat(story.lon);
  
  if (isNaN(lat) || isNaN(lon)) {
    console.error('Invalid coordinates:', story.lat, story.lon);
    mapElement.innerHTML = `
      <div class="map-error">
        <p>Invalid location coordinates</p>
      </div>
    `;
    return;
  }
  
  try {
    // Clear loading message
    mapElement.innerHTML = '';
    
    // Initialize map
    const map = L.map('detail-map', {
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      tap: false
    }).setView([lat, lon], 13);
    
    // Add tile layer with error handling
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXAgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+'
    }).addTo(map);
    
    // Handle tile errors - especially important for offline
    tileLayer.on('tileerror', function(error) {
      console.warn('Tile loading error:', error);
      if (!isOnline()) {
        mapElement.innerHTML += `
          <div class="map-offline-warning">
            <p>🗺️ Map tiles unavailable offline</p>
            <small>Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}</small>
          </div>
        `;
      }
    });
    
    // Safe story data for popup
    const storyName = story.name || 'Story Location';
    const storyDescription = story.description || '';
    
    // Add marker with popup
    const marker = L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`
        <div class="map-popup">
          <h4>${escapeHtml(storyName)}</h4>
          <p>${escapeHtml(storyDescription.substring(0, 100))}${storyDescription.length > 100 ? '...' : ''}</p>
        </div>
      `)
      .openPopup();
    
    // Add zoom control
    L.control.zoom({
      position: 'topright'
    }).addTo(map);
    
    console.log('Detail map initialized successfully');
    
  } catch (error) {
    console.error('Error initializing detail map:', error);
    mapElement.innerHTML = `
      <div class="map-error">
        <p>Failed to load map: ${error.message}</p>
        <div class="coordinates-fallback">
          <p><strong>Location Coordinates:</strong></p>
          <p>Latitude: ${lat.toFixed(6)}</p>
          <p>Longitude: ${lon.toFixed(6)}</p>
        </div>
        <button class="btn btn-primary" id="retry-detail-map-final">Retry Map</button>
      </div>
    `;
    
    // Add retry event listener
    const retryBtn = document.getElementById('retry-detail-map-final');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => initializeDetailMap(story));
    }
  }
}

// Utility function untuk escape HTML
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global retry function for detail map
window.retryDetailMap = function(storyId) {
  console.log('Retrying detail map for story:', storyId);
  if (typeof window.loadStoryDetail === 'function') {
    window.loadStoryDetail();
  }
};