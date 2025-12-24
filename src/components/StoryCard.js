//StoryCard.js
import { isLoggedIn } from '../utils/auth.js';
import { isOnline } from '../utils/api.js';

export default function StoryCard(story) {
  // Safe data extraction dengan fallback values
  const storyName = story.name || 'Untitled Story';
  const storyDescription = story.description || 'No description available.';
  
  // Use offline-safe placeholder image
  const photoUrl = getSafeImageUrl(story.photoUrl);
  
  const createdAt = story.createdAt || new Date().toISOString();
  const isAuthenticated = isLoggedIn();
  const isBookmarked = story.isBookmarked || false;
  
  // Safe date formatting
  let formattedDate;
  try {
    formattedDate = new Date(createdAt).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    formattedDate = 'Unknown date';
  }
  
  // Safe coordinate handling
  const hasValidCoordinates = story.lat && story.lon && 
                             !isNaN(parseFloat(story.lat)) && 
                             !isNaN(parseFloat(story.lon));
  
  const locationText = hasValidCoordinates ? 
    `${parseFloat(story.lat).toFixed(4)}, ${parseFloat(story.lon).toFixed(4)}` : 
    'Location not specified';
  
  return `
    <article class="story-card ${story.isOffline ? 'offline' : ''}" data-id="${story.id}" tabindex="0" role="article" aria-labelledby="story-title-${story.id}" aria-describedby="story-desc-${story.id}">
      <div class="story-image">
        <img 
          src="${photoUrl}" 
          alt="${escapeHtml(storyName)} - ${escapeHtml(storyDescription.substring(0, 100))}${storyDescription.length > 100 ? '...' : ''}" 
          loading="lazy" 
          decoding="async"
          onerror="this.src='${getPlaceholderImage()}'"
        />
        ${isAuthenticated ? `
          <button 
            class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" 
            data-id="${story.id}"
            aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark this story'}"
          >
            ${isBookmarked ? '✅' : '🔖'}
            <span class="sr-only">${isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        ` : ''}
      </div>
      <div class="story-content">
        <h3 class="story-title" id="story-title-${story.id}">
          ${escapeHtml(storyName)}
        </h3>
        <p class="story-description" id="story-desc-${story.id}">
          ${escapeHtml(storyDescription)}
        </p>
        <div class="story-meta">
          <div class="story-location">
            <span aria-hidden="true">📍</span>
            <strong>Location:</strong> 
            <span class="location-coordinates">${locationText}</span>
          </div>
          <div class="story-date">
            <span aria-hidden="true">📅</span>
            <strong>Date:</strong> 
            <time datetime="${createdAt}">${formattedDate}</time>
          </div>
        </div>
        <button 
          class="btn-view-detail" 
          data-id="${story.id}" 
          aria-label="View details about ${escapeHtml(storyName)}"
          aria-describedby="story-title-${story.id}"
        >
          View Details
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  `;
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