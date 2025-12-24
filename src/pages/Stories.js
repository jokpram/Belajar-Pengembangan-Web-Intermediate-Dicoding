//Stories.js
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import StoryCard from '../components/StoryCard.js';
import MapComponent from '../components/MapComponent.js';
import { initMap } from '../components/MapComponent.js';
import { getStories, isOnline } from '../utils/api.js';
import { isLoggedIn } from '../utils/auth.js';
import database from '../utils/database.js';

export default function Stories() {
  const isAuthenticated = isLoggedIn();

  return `
    <header class="app-header" role="banner">
      ${Header()}
    </header>
    <main id="main-content" class="app-main" role="main">
      <section class="stories-page" aria-labelledby="stories-main-title">
        <div class="container">
          <header class="stories-header">
            <h1 id="stories-main-title" class="page-main-title">Dinosaur Stories Collection</h1>
            ${!isAuthenticated ? `
              <div class="auth-notice" role="note">
                <p>🔐 <strong>Viewing public stories only.</strong> <a href="#login" data-nav="login">Login</a> to see all stories and add your own discoveries!</p>
              </div>
            ` : `
              <div class="auth-notice success" role="note">
                <p>✅ <strong>You are logged in.</strong> You can view all stories and add your own discoveries!</p>
              </div>
            `}
            ${!isOnline() ? `
              <div class="network-status offline">
                <span>📱 You are offline</span>
                <small>Showing cached stories. Some features may be limited.</small>
              </div>
            ` : ''}
            <p class="page-subtitle">Explore amazing dinosaur discoveries and stories from around the world.</p>
          </header>
          
          <div class="stories-controls-tabs">
            <div class="tabs" role="tablist">
              <button class="tab-button active" data-tab="all-stories" role="tab" aria-selected="true">
                All Stories
              </button>
              <button class="tab-button" data-tab="bookmarks" role="tab" aria-selected="false">
                <span class="bookmark-icon">🔖</span>
                Bookmarks
                <span id="bookmark-count" class="badge hidden"></span>
              </button>
              ${!isOnline() ? `
                <button class="tab-button" data-tab="offline-stories" role="tab" aria-selected="false">
                  <span class="offline-icon">📱</span>
                  Offline Stories
                  <span id="offline-count" class="badge hidden"></span>
                </button>
              ` : ''}
            </div>
          </div>
          
          <div class="stories-layout">
            <section class="stories-list-section" aria-labelledby="stories-list-title">
              <header class="stories-list-header">
                <h2 id="stories-list-title" class="section-title">Stories List</h2>
                <div class="stories-controls">
                  <label for="search-stories" class="sr-only">Search stories</label>
                  <input 
                    type="text" 
                    id="search-stories" 
                    placeholder="Search stories by title or description..." 
                    aria-label="Search stories"
                  />
                  <div class="stories-stats">
                    <span id="stories-count" aria-live="polite">Loading stories...</span>
                  </div>
                </div>
              </header>
              <div id="stories-list" class="stories-list" role="list" aria-label="List of dinosaur stories">
                <div class="loading" aria-live="polite" aria-busy="true">
                  <div class="loading-spinner"></div>
                  <p>Loading stories...</p>
                  ${!isOnline() ? '<p><small>📱 Loading from offline cache...</small></p>' : ''}
                </div>
              </div>
            </section>
            
            <section class="stories-map-section" aria-labelledby="stories-map-title">
              <h2 id="stories-map-title" class="section-title">Stories Map</h2>
              ${MapComponent('stories-map')}
            </section>
          </div>
        </div>
      </section>
    </main>
    <footer class="app-footer" role="contentinfo">
      ${Footer()}
    </footer>
  `;
}

// Initialize stories page
window.initStoriesPage = async function() {
  console.log('Initializing Stories page...');
  
  await database.init();
  
  const storiesList = document.getElementById('stories-list');
  const statsElement = document.getElementById('stories-count');
  
  if (storiesList) {
    storiesList.innerHTML = `
      <div class="loading" aria-live="polite" aria-busy="true">
        <div class="loading-spinner"></div>
        <p>Loading stories...</p>
        ${!isOnline() ? '<p><small>📱 Loading from offline cache...</small></p>' : ''}
      </div>
    `;
  }
  
  if (statsElement) {
    statsElement.textContent = 'Loading stories...';
  }
  
  try {
    const stories = await getStories();
    await displayStories(stories);
    
    // Initialize map with delay to ensure DOM is ready
    setTimeout(() => {
      initializeMapWithStories(stories);
    }, 500);
    
    setupSearchFilter(stories);
    updateStoriesStats(stories);
    setupTabNavigation(stories);
    
  } catch (error) {
    console.error('Error initializing stories page:', error);
    
    // Try to load offline stories
    try {
      const offlineStories = await database.getAllStories();
      if (offlineStories.length > 0) {
        console.log('Loading stories from offline storage');
        await displayStories(offlineStories);
        updateStoriesStats(offlineStories, true);
        showOfflineMessage();
      } else {
        throw new Error('No offline stories available');
      }
    } catch (offlineError) {
      console.error('Error loading offline stories:', offlineError);
      const storiesList = document.getElementById('stories-list');
      if (storiesList) {
        storiesList.innerHTML = `
          <div class="error" role="alert">
            <h2>Error Loading Stories</h2>
            <p>Failed to load stories: ${error.message}</p>
            ${!isOnline() ? `
              <div class="offline-help">
                <p>📱 <strong>You are offline</strong></p>
                <p>No cached stories available. Please go online to load stories first.</p>
              </div>
            ` : ''}
            <button onclick="window.initStoriesPage()" class="btn btn-primary">Retry</button>
          </div>
        `;
      }
      
      if (statsElement) {
        statsElement.textContent = 'Error loading stories';
      }
    }
  }
};

// ... (rest of the Stories.js functions remain the same)

async function displayStories(stories, isBookmarks = false) {
  const storiesList = document.getElementById('stories-list');
  
  if (!storiesList) {
    console.error('Stories list element not found');
    return;
  }
  
  if (!stories || stories.length === 0) {
    const message = isBookmarks ? 
      'No bookmarked stories yet. Click the bookmark icon on any story to save it here!' : 
      (isLoggedIn() ? 
        'No stories available. Be the first to share a dinosaur story!' : 
        'No public stories available. Login to see all stories and add your own!'
      );
    
    storiesList.innerHTML = `
      <div class="no-stories" role="status">
        <h3>${isBookmarks ? 'No Bookmarks' : 'No Stories Found'}</h3>
        <p>${message}</p>
        ${!isLoggedIn() && !isBookmarks ? `
          <div class="auth-actions">
            <a href="#login" data-nav="login" class="btn btn-primary">Login</a>
            <a href="#register" data-nav="register" class="btn btn-secondary">Register</a>
          </div>
        ` : ''}
      </div>
    `;
    return;
  }

  // Get bookmarks status for each story
  const storiesWithBookmarks = await Promise.all(
    stories.map(async (story) => {
      const isBookmarked = await database.isBookmarked(story.id);
      return { ...story, isBookmarked };
    })
  );

  storiesList.innerHTML = storiesWithBookmarks.map(story => StoryCard(story)).join('');
  
  // Add event listeners
  addStoryEventListeners(storiesWithBookmarks);
}

function addStoryEventListeners(stories) {
  const storiesList = document.getElementById('stories-list');
  if (!storiesList) return;

  // Detail buttons
  const detailButtons = storiesList.querySelectorAll('.btn-view-detail');
  detailButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const storyId = e.target.closest('.btn-view-detail').dataset.id;
      if (storyId) {
        window.location.hash = `detail?id=${storyId}`;
      }
    });
    
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });

  // Bookmark buttons
  const bookmarkButtons = storiesList.querySelectorAll('.btn-bookmark');
  bookmarkButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const storyId = button.dataset.id;
      const story = stories.find(s => s.id === storyId);
      
      if (!story) return;
      
      try {
        if (button.classList.contains('bookmarked')) {
          await database.removeBookmark(storyId);
          button.classList.remove('bookmarked');
          button.setAttribute('aria-label', 'Bookmark this story');
          button.innerHTML = '🔖 <span class="sr-only">Bookmark</span>';
          
          // Update bookmark count
          updateBookmarkCount();
          
          // If we're on bookmarks tab, remove the story
          const activeTab = document.querySelector('.tab-button.active');
          if (activeTab && activeTab.dataset.tab === 'bookmarks') {
            const storyElement = button.closest('.story-card');
            if (storyElement) {
              storyElement.style.opacity = '0';
              setTimeout(() => {
                storyElement.remove();
                // Check if no stories left
                const remainingStories = storiesList.querySelectorAll('.story-card');
                if (remainingStories.length === 0) {
                  displayStories([], true);
                }
              }, 300);
            }
          }
        } else {
          await database.addBookmark(story);
          button.classList.add('bookmarked');
          button.setAttribute('aria-label', 'Remove bookmark');
          button.innerHTML = '✅ <span class="sr-only">Bookmarked</span>';
          
          // Update bookmark count
          updateBookmarkCount();
        }
      } catch (error) {
        console.error('Error updating bookmark:', error);
        showMessage('error', 'Failed to update bookmark');
      }
    });
  });
}

async function updateBookmarkCount() {
  try {
    const bookmarks = await database.getBookmarks();
    const bookmarkCount = document.getElementById('bookmark-count');
    
    if (bookmarkCount) {
      if (bookmarks.length > 0) {
        bookmarkCount.textContent = bookmarks.length;
        bookmarkCount.classList.remove('hidden');
      } else {
        bookmarkCount.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Error updating bookmark count:', error);
  }
}

function setupTabNavigation(allStories) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const storiesList = document.getElementById('stories-list');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', async () => {
      // Update active tab
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      
      const tab = button.dataset.tab;
      
      if (tab === 'all-stories') {
        await displayStories(allStories);
        updateStoriesStats(allStories);
      } else if (tab === 'bookmarks') {
        try {
          const bookmarks = await database.getBookmarks();
          await displayStories(bookmarks, true);
          updateStoriesStats(bookmarks, false, true);
        } catch (error) {
          console.error('Error loading bookmarks:', error);
          storiesList.innerHTML = `
            <div class="error" role="alert">
              <h2>Error Loading Bookmarks</h2>
              <p>Failed to load bookmarked stories: ${error.message}</p>
            </div>
          `;
        }
      } else if (tab === 'offline-stories' && !isOnline()) {
        try {
          const offlineStories = await database.getOfflineStories();
          await displayStories(offlineStories, false);
          updateStoriesStats(offlineStories, true, false);
        } catch (error) {
          console.error('Error loading offline stories:', error);
          storiesList.innerHTML = `
            <div class="error" role="alert">
              <h2>Error Loading Offline Stories</h2>
              <p>Failed to load offline stories: ${error.message}</p>
            </div>
          `;
        }
      }
    });
  });
  
  // Initialize bookmark count
  updateBookmarkCount();
}

function initializeMapWithStories(stories) {
    console.log('Initializing stories map with', stories.length, 'stories');
    
    // Give the DOM more time to settle before initializing map
    setTimeout(() => {
        function attemptMapInit() {
            if (window.checkLeafletAvailability && window.checkLeafletAvailability()) {
                initMap(stories, (storyId) => {
                    window.location.hash = `detail?id=${storyId}`;
                }, 'stories-map')
                .then(map => {
                    if (map) {
                        console.log('✅ Stories map initialized successfully');
                    } else {
                        console.error('❌ Failed to initialize stories map');
                        // Retry once after longer delay
                        setTimeout(attemptMapInit, 1000);
                    }
                })
                .catch(error => {
                    console.error('❌ Error initializing stories map:', error);
                });
            } else {
                console.warn('⏳ Leaflet not available yet, waiting...');
                setTimeout(attemptMapInit, 100);
            }
        }
        
        // Start map initialization
        attemptMapInit();
    }, 800); // Increased delay to ensure DOM is ready
}

function updateStoriesStats(stories, isOffline = false, isBookmarks = false) {
  const statsElement = document.getElementById('stories-count');
  if (statsElement) {
    if (!stories || stories.length === 0) {
      statsElement.textContent = isBookmarks ? 'No bookmarked stories' : 'No stories found';
    } else {
      const storyCount = stories.length;
      const withLocation = stories.filter(story => story.lat && story.lon).length;
      
      let statsText = `${storyCount} ${isBookmarks ? 'bookmarked' : ''} story${storyCount !== 1 ? 'ies' : ''} (${withLocation} with location)`;
      
      if (isOffline) {
        statsText += ' • Offline Mode';
      }
      
      statsElement.textContent = statsText;
    }
  }
}

function setupSearchFilter(allStories) {
  const searchInput = document.getElementById('search-stories');
  
  if (!searchInput) {
    console.error('Search input not found');
    return;
  }
  
  let currentStories = allStories;
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      displayStories(allStories);
      updateStoriesStats(allStories);
      return;
    }
    
    const filteredStories = allStories.filter(story => 
      (story.name && story.name.toLowerCase().includes(searchTerm)) ||
      (story.description && story.description.toLowerCase().includes(searchTerm))
    );
    
    currentStories = filteredStories;
    displayStories(filteredStories);
    updateStoriesStats(filteredStories);
  });
  
  // Add clear search functionality
  const searchContainer = searchInput.parentElement;
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'search-clear hidden';
  clearButton.innerHTML = '&times;';
  clearButton.setAttribute('aria-label', 'Clear search');
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    displayStories(allStories);
    updateStoriesStats(allStories);
    searchInput.focus();
    clearButton.classList.add('hidden');
  });
  
  searchContainer.appendChild(clearButton);
  
  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim() !== '') {
      clearButton.classList.remove('hidden');
    } else {
      clearButton.classList.add('hidden');
    }
  });
}

function showOfflineMessage() {
  const message = document.createElement('div');
  message.className = 'offline-notice';
  message.innerHTML = `
    <p>📶 You are currently viewing offline content. Some features may be limited.</p>
  `;
  
  const storiesHeader = document.querySelector('.stories-header');
  if (storiesHeader) {
    storiesHeader.appendChild(message);
  }
}

function showMessage(type, message) {
  const existingMessage = document.querySelector('.global-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `global-message ${type}`;
  messageDiv.textContent = message;
  messageDiv.setAttribute('role', 'alert');
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}