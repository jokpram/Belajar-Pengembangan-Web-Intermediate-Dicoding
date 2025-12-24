//MapComponent.js
export default function MapComponent(containerId = 'map') {
    return `
        <div class="map-container">
            <div id="${containerId}" class="map" role="application" aria-label="Interactive map">
                <div class="map-loading" aria-live="polite">Loading map...</div>
            </div>
            <div class="map-controls">
                <button id="layer-control" class="btn-layer-control" aria-label="Change map layer">
                    Change Map Style
                </button>
            </div>
        </div>
    `;
}

// Enhanced visibility check function
function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    // Check basic visibility properties
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0' ||
        element.offsetParent === null) {
        return false;
    }
    
    // Check if element has dimensions and is in viewport
    const hasDimensions = rect.width > 0 && rect.height > 0;
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
    
    return hasDimensions && inViewport;
}

// Enhanced container check with multiple strategies
function waitForContainerReady(containerId, callback, maxAttempts = 15) {
    let attempts = 0;
    
    const checkContainer = () => {
        attempts++;
        const mapElement = document.getElementById(containerId);
        
        if (mapElement && isElementVisible(mapElement)) {
            console.log(`✅ Container ${containerId} ready after ${attempts} attempts`);
            callback(mapElement);
            return;
        }
        
        if (attempts < maxAttempts) {
            // Increase delay gradually
            const delay = Math.min(100 + (attempts * 50), 500);
            console.log(`⏳ Waiting for container ${containerId}... (${attempts}/${maxAttempts})`);
            setTimeout(checkContainer, delay);
        } else {
            console.warn(`❌ Container ${containerId} not ready after ${maxAttempts} attempts, proceeding anyway`);
            const mapElement = document.getElementById(containerId);
            if (mapElement) {
                callback(mapElement);
            } else {
                console.error(`❌ Container ${containerId} not found`);
                callback(null);
            }
        }
    };
    
    // Start with a small delay to allow DOM to settle
    setTimeout(checkContainer, 100);
}

// Map initialization function
export function initMap(stories = [], onStoryClick = null, containerId = 'map') {
    console.log('🔍 Initializing map with container:', containerId);
    
    return new Promise((resolve) => {
        waitForContainerReady(containerId, (mapElement) => {
            if (!mapElement) {
                console.error('❌ Map element not found:', containerId);
                resolve(null);
                return;
            }

            // Update loading message
            const loadingElement = mapElement.querySelector('.map-loading');
            if (loadingElement) {
                loadingElement.textContent = 'Initializing map...';
            }

            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                console.error('❌ Leaflet library not loaded');
                showMapError(containerId, 'Map library not loaded. Please refresh the page.');
                resolve(null);
                return;
            }

            try {
                // Clear existing map if it exists
                if (mapElement._leaflet_map) {
                    console.log('🗑️ Removing existing map instance');
                    mapElement._leaflet_map.remove();
                }

                // Clear container
                mapElement.innerHTML = '<div class="map-loading">Creating map...</div>';

                // Initialize map with robust options
                const map = L.map(containerId, {
                    zoomControl: false,
                    scrollWheelZoom: true,
                    dragging: true,
                    tap: false,
                    fadeAnimation: true,
                    markerZoomAnimation: true,
                    transform3DLimit: 8388608,
                    worldCopyJump: false,
                    // Prevent tile loading issues
                    maxZoom: 18,
                    minZoom: 1
                });

                // Store reference to map
                mapElement._leaflet_map = map;

                // Set initial view based on container type
                let initialView = [20, 0];
                let initialZoom = 2;

                if (containerId === 'add-story-map') {
                    console.log('📍 Setting Add Story map view');
                    map.setView(initialView, initialZoom);
                } else if (stories && stories.length > 0) {
                    const validStories = stories.filter(story => 
                        story.lat && story.lon && 
                        !isNaN(parseFloat(story.lat)) && !isNaN(parseFloat(story.lon))
                    );
                    
                    if (validStories.length > 0) {
                        const bounds = validStories.map(story => [parseFloat(story.lat), parseFloat(story.lon)]);
                        map.fitBounds(bounds, { padding: [20, 20] });
                    } else {
                        map.setView(initialView, initialZoom);
                    }
                } else {
                    map.setView(initialView, initialZoom);
                }

                // Define tile layers with fallback
                const baseLayers = {
                    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 19,
                        retryLimit: 3,
                        detectRetina: true
                    }),
                    "Satellite": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                        attribution: '&copy; Google',
                        maxZoom: 20,
                        subdomains: ['mt0','mt1','mt2','mt3'],
                        retryLimit: 3,
                        detectRetina: true
                    })
                };

                // Add default layer
                const defaultLayer = baseLayers.OpenStreetMap.addTo(map);

                // Handle tile events
                defaultLayer.on('tileerror', function(error) {
                    console.warn('🖼️ Tile loading error:', error);
                });

                defaultLayer.on('load', function() {
                    console.log('✅ Base map tiles loaded successfully');
                    if (loadingElement) {
                        loadingElement.style.display = 'none';
                    }
                });

                // Add layer control
                L.control.layers(baseLayers).addTo(map);

                // Add zoom control
                L.control.zoom({
                    position: 'topright'
                }).addTo(map);

                // Add markers for stories if provided
                if (stories && Array.isArray(stories) && stories.length > 0) {
                    addStoryMarkers(map, stories, onStoryClick);
                }

                // Handle map click for location selection
                if (containerId === 'add-story-map') {
                    setupLocationSelection(map);
                }

                // Force resize and validate with multiple attempts
                const resizeMap = (attempt = 1) => {
                    try {
                        map.invalidateSize(true);
                        console.log('🔄 Map size invalidated successfully');
                    } catch (error) {
                        console.warn(`⚠️ Error during map invalidateSize (attempt ${attempt}):`, error);
                        if (attempt < 3) {
                            setTimeout(() => resizeMap(attempt + 1), 200);
                        }
                    }
                };

                // Initial resize
                setTimeout(() => resizeMap(), 100);
                
                // Additional resize after a bit longer for good measure
                setTimeout(() => resizeMap(), 500);

                console.log('✅ Map initialized successfully for container:', containerId);
                resolve(map);

            } catch (error) {
                console.error('❌ Error initializing map:', error);
                showMapError(containerId, `Map initialization failed: ${error.message}`);
                resolve(null);
            }
        });
    });
}

function addStoryMarkers(map, stories, onStoryClick) {
    const markers = L.layerGroup().addTo(map);
    let validStoriesCount = 0;

    stories.forEach(story => {
        if (story.lat && story.lon) {
            const lat = parseFloat(story.lat);
            const lon = parseFloat(story.lon);
            
            if (!isNaN(lat) && !isNaN(lon)) {
                const marker = L.marker([lat, lon])
                    .bindPopup(`
                        <div class="map-popup">
                            <h3>${escapeHtml(story.name || 'Untitled Story')}</h3>
                            ${story.photoUrl ? `<img src="${story.photoUrl}" alt="${story.name || 'Story'} image" style="max-width: 200px; height: auto; border-radius: 4px;" />` : ''}
                            <p><strong>Description:</strong> ${escapeHtml(story.description || 'No description')}</p>
                            <p><strong>Location:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
                            ${onStoryClick ? `<button onclick="window.viewStoryDetail('${story.id}')" class="btn-popup-detail">View Details</button>` : ''}
                        </div>
                    `);
                
                markers.addLayer(marker);
                validStoriesCount++;

                if (onStoryClick) {
                    marker.on('click', () => {
                        onStoryClick(story.id);
                    });
                }
            }
        }
    });

    console.log(`📍 Added ${validStoriesCount} markers out of ${stories.length} stories`);
}

function setupLocationSelection(map) {
    let marker = null;
    
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        
        console.log('🎯 Map clicked at:', lat, lng);
        
        updateCoordinatesDisplay(lat, lng);
        
        if (marker) {
            map.removeLayer(marker);
        }
        
        marker = L.marker([lat, lng]).addTo(map);
        
        const locationError = document.getElementById('location-error');
        if (locationError) {
            locationError.textContent = '';
        }
        
        // Announce selection for accessibility
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = `Location selected at latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)}`;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    });
}

function updateCoordinatesDisplay(lat, lng) {
    const latElement = document.getElementById('selected-lat');
    const lonElement = document.getElementById('selected-lon');
    const latHidden = document.getElementById('story-lat');
    const lonHidden = document.getElementById('story-lon');
    
    if (latElement && lonElement) {
        latElement.textContent = lat.toFixed(6);
        lonElement.textContent = lng.toFixed(6);
        latElement.classList.add('coordinate-selected');
        lonElement.classList.add('coordinate-selected');
    }
    
    if (latHidden && lonHidden) {
        latHidden.value = lat.toFixed(6);
        lonHidden.value = lng.toFixed(6);
    }
}

function showMapError(containerId, message) {
    const mapElement = document.getElementById(containerId);
    if (mapElement) {
        mapElement.innerHTML = `
            <div class="map-error" role="alert">
                <p>${message}</p>
                <button onclick="window.retryMapInit('${containerId}')" class="btn btn-primary" aria-label="Retry loading map">
                    Retry Map
                </button>
            </div>
        `;
    }
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global retry function
window.retryMapInit = function(containerId) {
    console.log('🔄 Retrying map initialization for:', containerId);
    
    const currentHash = window.location.hash.slice(1);
    
    if (currentHash === 'stories' && typeof window.initStoriesPage === 'function') {
        window.initStoriesPage();
    } else if (currentHash === 'add' && typeof window.initAddStoryPage === 'function') {
        window.initAddStoryPage();
    } else if (currentHash.startsWith('detail') && typeof window.loadStoryDetail === 'function') {
        window.loadStoryDetail();
    }
};

window.viewStoryDetail = function(storyId) {
    window.location.hash = `detail?id=${storyId}`;
};

// Enhanced Leaflet availability check
window.checkLeafletAvailability = function() {
    if (typeof L === 'undefined') {
        console.warn('❌ Leaflet not loaded');
        return false;
    }
    
    if (typeof L.Map === 'undefined' || typeof L.tileLayer === 'undefined') {
        console.warn('❌ Leaflet components not fully loaded');
        return false;
    }
    
    console.log('✅ Leaflet is fully loaded and ready');
    return true;
};