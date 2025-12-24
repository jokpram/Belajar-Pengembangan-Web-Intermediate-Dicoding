// main.js
import './styles/main.css';
import './styles/components.css';
import './styles/responsive.css';
import './styles/transitions.css';
import './styles/critical.css';
import App from './App.js';

// VAPID Public Key
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

// Service Worker Registration - DIPERBAIKI
async function registerServiceWorker() {
  // During development, use limited service worker functionality
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Service Worker: Development mode - limited functionality');
    
    // Unregister any existing service workers for clean development
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('Service Worker unregistered for development');
      }
    }
    return null;
  }

  if ('serviceWorker' in navigator) {
    try {
      // PERBAIKAN: Pastikan path service worker benar
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found!');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content is available; please refresh.');
            showUpdateNotification();
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('Service Workers are not supported in this browser');
    return null;
  }
}

function showUpdateNotification() {
  const updateNotification = document.createElement('div');
  updateNotification.className = 'update-notification';
  updateNotification.innerHTML = `
    <div class="update-banner">
      <p>New version available! </p>
      <button onclick="window.location.reload()" class="btn btn-primary">Refresh</button>
    </div>
  `;
  document.body.appendChild(updateNotification);
}

// Enhanced Push Notification Manager dengan Permission Button yang Diperbaiki
class PushNotificationManager {
  constructor() {
    this.isSupported = 'PushManager' in window && 'serviceWorker' in navigator;
    this.permission = Notification.permission;
    this.subscription = null;
    this.vapidPublicKey = VAPID_PUBLIC_KEY;
    this.permissionButton = null;
    this.API_BASE_URL = 'https://story-api.dicoding.dev/v1';
    this.isInitialized = false;
  }

  async init() {
    if (!this.isSupported) {
      console.log('Push notifications are not supported');
      this.showUnsupportedMessage();
      return;
    }

    // PERBAIKAN: Register service worker terlebih dahulu
    await this.registerServiceWorker();
    await this.checkSubscription();
    this.setupNotificationPermissionUI();
    this.setupPermissionButton();
    
    // Setup manual notification trigger for testing
    this.setupTestNotification();
    
    this.isInitialized = true;
    console.log('PushNotificationManager initialized successfully');
  }

  // PERBAIKAN: Tambah method registerServiceWorker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      return null;
    }

    try {
      // PERBAIKAN: Register service worker dengan path yang benar
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered for push notifications:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
      console.log('Current push subscription:', this.subscription);
      
      // PERBAIKAN: Update UI berdasarkan subscription status
      this.updatePermissionButton();
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  }

  setupNotificationPermissionUI() {
    const permissionElement = document.getElementById('notification-permission');
    const enableBtn = document.getElementById('enable-notifications');
    const dismissBtn = document.getElementById('dismiss-notifications');

    // Only show permission banner if permission is default and not previously dismissed
    if (this.permission === 'default' && permissionElement && !localStorage.getItem('notificationDismissed')) {
      permissionElement.classList.remove('hidden');
    }

    if (enableBtn) {
      enableBtn.addEventListener('click', () => this.requestPermission());
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        if (permissionElement) {
          permissionElement.classList.add('hidden');
        }
        localStorage.setItem('notificationDismissed', 'true');
      });
    }

    // Check if user previously dismissed
    if (localStorage.getItem('notificationDismissed') === 'true') {
      permissionElement?.classList.add('hidden');
    }
  }

  // Setup permission button in header - DIPERBAIKI
  setupPermissionButton() {
    // Create permission button
    this.permissionButton = document.createElement('button');
    this.permissionButton.className = 'btn-permission-notification';
    this.permissionButton.addEventListener('click', () => this.handlePermissionButtonClick());
    
    // Update button based on current permission
    this.updatePermissionButton();
    
    // Add to header after app loads
    setTimeout(() => {
      const header = document.querySelector('.app-header');
      if (header) {
        const navMenu = header.querySelector('.nav-menu');
        if (navMenu) {
          const li = document.createElement('li');
          li.className = 'notification-permission-item';
          li.appendChild(this.permissionButton);
          navMenu.appendChild(li);
        } else {
          // Fallback: add directly to header if nav-menu not found
          header.appendChild(this.permissionButton);
        }
      }
    }, 2000);
  }

  // PERBAIKAN: Handle permission button click dengan logika yang benar
  async handlePermissionButtonClick() {
    console.log('Permission button clicked. Current state:', {
      permission: this.permission,
      subscription: !!this.subscription,
      isLoggedIn: this.isUserLoggedIn()
    });

    switch(this.permission) {
      case 'granted':
        // Jika sudah granted, berikan opsi untuk unsubscribe
        if (this.subscription) {
          if (confirm('Do you want to unsubscribe from push notifications?')) {
            await this.unsubscribeFromPush();
          } else {
            // User cancelled unsubscribe, show current status
            this.showNotification(
              'Notifications Active', 
              'You are currently subscribed to push notifications.'
            );
          }
        } else {
          // Permission granted tapi tidak ada subscription, coba subscribe
          console.log('Permission granted but no subscription, attempting to subscribe...');
          await this.subscribeToPush();
        }
        break;
      case 'denied':
        // Jika denied, berikan instruksi cara mengubah setting
        alert('Notifications are blocked. Please enable them in your browser settings to receive notifications.\n\nOn Chrome: Settings > Privacy and Security > Site Settings > Notifications');
        break;
      default:
        // Jika default, request permission
        await this.requestPermission();
    }
  }

  // PERBAIKAN: Update permission button dengan logika yang benar
  updatePermissionButton() {
    if (!this.permissionButton) return;

    let buttonText = '🔔 Enable Notifications';
    let buttonColor = '#007bff';
    let isDisabled = false;

    switch(this.permission) {
      case 'granted':
        if (this.subscription) {
          buttonText = '🔔 Notifications Enabled';
          buttonColor = '#28a745';
        } else {
          buttonText = '🔔 Enable Notifications';
          buttonColor = '#007bff';
        }
        isDisabled = false;
        break;
      case 'denied':
        buttonText = '🔕 Notifications Blocked';
        buttonColor = '#dc3545';
        isDisabled = false;
        break;
      default:
        buttonText = '🔔 Enable Notifications';
        buttonColor = '#007bff';
        isDisabled = false;
    }

    this.permissionButton.innerHTML = buttonText;
    this.permissionButton.style.background = buttonColor;
    this.permissionButton.disabled = isDisabled;

    console.log('Permission button updated:', {
      text: buttonText,
      color: buttonColor,
      disabled: isDisabled
    });
  }

  // PERBAIKAN: Check if user is logged in
  isUserLoggedIn() {
    const token = localStorage.getItem('story_app_token');
    const user = localStorage.getItem('story_app_user');
    return !!(token || user);
  }

  showUnsupportedMessage() {
    console.log('Push notifications are not supported in this browser');
    // Show user-friendly message
    if (this.permissionButton) {
      this.permissionButton.innerHTML = '🔔 Notifications Unsupported';
      this.permissionButton.style.background = '#6c757d';
      this.permissionButton.disabled = true;
    }
  }

  setupTestNotification() {
    // Add test notification button to header for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const testNotifyBtn = document.createElement('button');
      testNotifyBtn.textContent = '🔔 Test Notify';
      testNotifyBtn.className = 'btn-test-notification';
      testNotifyBtn.addEventListener('click', () => {
        this.showTestNotification();
      });
      
      setTimeout(() => {
        const header = document.querySelector('.app-header');
        if (header) {
          header.appendChild(testNotifyBtn);
        } else {
          document.body.appendChild(testNotifyBtn);
        }
      }, 1000);
    }
  }

  async requestPermission() {
    try {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      console.log('Notification permission result:', permission);
      
      // Update UI
      this.updatePermissionButton();
      
      const permissionElement = document.getElementById('notification-permission');
      if (permissionElement) {
        permissionElement.classList.add('hidden');
      }

      if (permission === 'granted') {
        await this.subscribeToPush();
        this.showNotification(
          'Notifications Enabled ✅', 
          'You will now receive notifications about new dinosaur discoveries!'
        );
        
        // Save preference
        localStorage.setItem('notificationsEnabled', 'true');
        
        // Trigger notifications for important events
        this.triggerWelcomeNotification();
      } else {
        console.log('Notification permission denied');
        localStorage.setItem('notificationsEnabled', 'false');
        
        // Show message to user
        if (permission === 'denied') {
          this.showNotification(
            'Notifications Blocked',
            'You have blocked notifications. You can enable them in your browser settings.'
          );
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.showNotification(
        'Permission Error',
        'Failed to request notification permission. Please try again.'
      );
    }
  }

  // PERBAIKAN: Method subscribeToPush yang sudah dikoreksi
  async subscribeToPush() {
    try {
      // PERBAIKAN: Pastikan service worker sudah ready
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready for push:', registration);
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Already subscribed to push notifications');
        this.subscription = subscription;
        this.updatePermissionButton();
        
        // PERBAIKAN: Tetap kirim ke server meski sudah subscribed (untuk sync)
        await this.sendSubscriptionToServer(subscription);
        return;
      }

      console.log('Subscribing to push notifications...');
      
      // Subscribe with VAPID public key
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.subscription = subscription;
      console.log('Push subscription successful:', subscription);

      // Send subscription to your backend server
      await this.sendSubscriptionToServer(subscription);
      
      // Update UI
      this.updatePermissionButton();
      
      console.log('Push notification subscription completed successfully');
      
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      
      // Show error message to user
      this.showNotification(
        'Subscription Failed', 
        'Unable to set up push notifications. Please try again later.'
      );
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const authToken = localStorage.getItem('story_app_token');
      
      if (!authToken) {
        console.log('User not logged in, skipping subscription server sync');
        // PERBAIKAN: Tidak throw error, hanya log dan continue
        // User masih bisa menggunakan push notifications secara lokal
        return { success: false, message: 'User not logged in' };
      }

      console.log('Sending subscription to server...');
      
      // PERBAIKAN: Menggunakan endpoint yang benar sesuai dokumentasi
      const response = await fetch(`${this.API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: this.arrayBufferToBase64(subscription.getKey('auth'))
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Subscription sent to server successfully:', result);
        return { success: true, data: result };
      } else {
        console.error('Failed to send subscription to server:', response.status);
        // PERBAIKAN: Tidak throw error, hanya log warning
        // Subscription tetap berhasil secara lokal
        return { 
          success: false, 
          message: `Server responded with status: ${response.status}` 
        };
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      // PERBAIKAN: Tidak throw error, hanya log warning
      return { success: false, message: error.message };
    }
  }

  // Helper function to convert array buffer to base64
  arrayBufferToBase64(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  showNotification(title, body, options = {}) {
    // PERBAIKAN: Gunakan placeholder icons untuk menghindari 404 errors
    const defaultIcon = this.getDefaultIcon();
    const defaultBadge = this.getDefaultBadge();

    if (this.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: options.icon || defaultIcon,
          badge: options.badge || defaultBadge,
          vibrate: [100, 50, 100],
          data: {
            url: options.url || '/#stories',
            timestamp: new Date().toISOString()
          },
          actions: [
            {
              action: 'view',
              title: 'View'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ],
          ...options
        }).catch(error => {
          console.error('Error showing notification:', error);
          // Fallback to regular notification
          if ('Notification' in window) {
            new Notification(title, { 
              body, 
              icon: defaultIcon 
            });
          }
        });
      }).catch(error => {
        console.error('Service Worker not ready for notification:', error);
        // Fallback to regular notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { 
            body, 
            icon: defaultIcon 
          });
        }
      });
    } else {
      // Fallback to regular notification if service worker not available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { 
          body, 
          icon: defaultIcon 
        });
      }
    }
  }

  // PERBAIKAN: Default icons untuk menghindari 404 errors
  getDefaultIcon() {
    // Return data URL atau path yang lebih aman
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjMmM1NTMwIi8+Cjx0ZXh0IHg9Ijk2IiB5PSIxMDQiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI2NCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfpZU8L3RleHQ+Cjwvc3ZnPg==';
  }

  getDefaultBadge() {
    // Return data URL atau path yang lebih aman
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiBmaWxsPSIjMmM1NTMwIi8+Cjx0ZXh0IHg9IjM2IiB5PSIzOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+llTwvdGV4dD4KPC9zdmc+';
  }

  showTestNotification() {
    if (this.permission === 'granted') {
      this.showNotification(
        'Test Notification 🦕', 
        'This is a test notification from Dinosaur Stories!', 
        {
          url: '/#stories',
          tag: 'test-notification'
        }
      );
    } else {
      alert('Please enable notifications first using the notification permission button.');
    }
  }

  // Trigger welcome notification after permission granted
  triggerWelcomeNotification() {
    this.showNotification(
      'Welcome to Dinosaur Stories! 🎉',
      'Thank you for enabling notifications. You will now receive updates about new dinosaur discoveries.',
      { url: '/#stories' }
    );
  }

  // Notification methods for app events
  async notifyRegistrationSuccess(user) {
    if (this.permission === 'granted') {
      this.showNotification(
        'Welcome to Dinosaur Stories! 🦖',
        `Hi ${user.name}! Your account has been created successfully. Start exploring dinosaur stories now!`,
        { url: '/#stories' }
      );
    }
  }

  async notifyLoginSuccess(user) {
    if (this.permission === 'granted') {
      this.showNotification(
        'Welcome Back! 👋',
        `Hi ${user.name}! Good to see you again. Continue your dinosaur discovery journey!`,
        { url: '/#stories' }
      );
    }
  }

  async notifyNewStory(story) {
    if (this.permission === 'granted') {
      this.showNotification(
        'New Dinosaur Story Added! 🦕',
        `A new story "${story.name}" has been added to the collection.`,
        {
          url: `/#detail?id=${story.id}`,
          tag: `story-${story.id}`
        }
      );
    }
  }

  async notifyOfflineStorySaved() {
    if (this.permission === 'granted') {
      this.showNotification(
        'Story Saved Offline 📱',
        'Your story has been saved offline. It will be submitted when you are back online.',
        { url: '/#stories' }
      );
    }
  }

  async notifyStoryLiked(story, userName) {
    if (this.permission === 'granted') {
      this.showNotification(
        'Your Story Got a Like! ❤️',
        `${userName} liked your story "${story.name}"`,
        {
          url: `/#detail?id=${story.id}`,
          tag: `like-${story.id}`
        }
      );
    }
  }

  // PERBAIKAN: Method unsubscribe dengan handling yang lebih baik
  async unsubscribeFromPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Unsubscribing from push notifications...');
        const success = await subscription.unsubscribe();
        
        if (success) {
          console.log('Unsubscribed from push notifications successfully');
          
          // Juga hapus dari server jika user login
          await this.removeSubscriptionFromServer(subscription);
          
          this.subscription = null;
          this.updatePermissionButton();
          
          this.showNotification(
            'Notifications Disabled',
            'You have been unsubscribed from push notifications.'
          );
        } else {
          console.error('Failed to unsubscribe from push notifications');
          this.showNotification(
            'Unsubscribe Failed',
            'Failed to unsubscribe from push notifications. Please try again.'
          );
        }
      } else {
        console.log('No active subscription to unsubscribe from');
        this.subscription = null;
        this.updatePermissionButton();
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      this.showNotification(
        'Unsubscribe Error',
        'An error occurred while unsubscribing. Please try again.'
      );
    }
  }

  async removeSubscriptionFromServer(subscription) {
    try {
      const authToken = localStorage.getItem('story_app_token');
      
      if (!authToken) {
        console.log('User not logged in, skipping server unsubscribe');
        return;
      }

      console.log('Removing subscription from server...');
      
      const response = await fetch(`${this.API_BASE_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (response.ok) {
        console.log('Subscription removed from server successfully');
      } else {
        console.error('Failed to remove subscription from server:', response.status);
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  // PERBAIKAN: Method untuk refresh state
  async refreshState() {
    console.log('Refreshing push notification state...');
    await this.checkSubscription();
    this.updatePermissionButton();
  }
}

// Install Prompt Manager
class InstallPromptManager {
  constructor() {
    this.deferredPrompt = null;
    this.setupInstallPrompt();
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.hideInstallPrompt();
      this.deferredPrompt = null;
      localStorage.setItem('appInstalled', 'true');
      
      if (window.pushManager) {
        window.pushManager.showNotification(
          'Welcome to Dinosaur Stories! 🎉',
          'The app has been successfully installed on your device.',
          { url: '/#home' }
        );
      }
    });

    const installBtn = document.getElementById('install-app');
    const dismissBtn = document.getElementById('dismiss-install');

    if (installBtn) {
      installBtn.addEventListener('click', () => this.installApp());
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.hideInstallPrompt());
    }
  }

  showInstallPrompt() {
    if (this.isAppInstalled() || localStorage.getItem('installDismissed')) {
      return;
    }

    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) {
      installPrompt.classList.remove('hidden');
    }
  }

  hideInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) {
      installPrompt.classList.add('hidden');
    }
    localStorage.setItem('installDismissed', 'true');
    
    setTimeout(() => {
      localStorage.removeItem('installDismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  }

  async installApp() {
    if (!this.deferredPrompt) {
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    this.deferredPrompt = null;
    this.hideInstallPrompt();
  }

  isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone ||
           document.referrer.includes('android-app://') ||
           localStorage.getItem('appInstalled') === 'true';
  }
}

// Global accessibility features
class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupReducedMotion();
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.focus();
        }
      }

      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-stories');
        if (searchInput) {
          searchInput.focus();
        }
      }

      if (e.ctrlKey && e.key === 'n' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        e.preventDefault();
        if (window.pushManager) {
          window.pushManager.showTestNotification();
        }
      }
    });
  }

  setupFocusManagement() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              this.enhanceAccessibility(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  enhanceAccessibility(element) {
    const images = element.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        img.setAttribute('alt', 'Story image');
      }
    });

    const buttons = element.querySelectorAll('button:not([aria-label])');
    buttons.forEach(button => {
      if (!button.textContent.trim() && !button.hasAttribute('aria-label')) {
        button.setAttribute('aria-label', 'Button');
      }
    });
  }

  setupReducedMotion() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (reducedMotion.matches) {
      document.documentElement.classList.add('reduced-motion');
    }

    reducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    });
  }
}

// Global error handler
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
  
  const announcement = document.createElement('div');
  announcement.className = 'sr-only';
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('role', 'alert');
  announcement.textContent = 'An error occurred on the page';
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 5000);
});

// Initialize app when DOM is ready - DIPERBAIKI
document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('app-loaded');
  
  new AccessibilityManager();

  // PERBAIKAN: Inisialisasi service worker dan push manager dengan urutan yang benar
  try {
    const swRegistration = await registerServiceWorker();
    
    // Inisialisasi PushNotificationManager terlepas dari status service worker
    const pushManager = new PushNotificationManager();
    await pushManager.init();
    window.pushManager = pushManager;
    
  } catch (error) {
    console.error('Error initializing service worker or push manager:', error);
    
    // Fallback: tetap inisialisasi push manager meski service worker gagal
    const pushManager = new PushNotificationManager();
    await pushManager.init();
    window.pushManager = pushManager;
  }

  const installManager = new InstallPromptManager();
  window.installManager = installManager;

  App();
  
  const announcement = document.createElement('div');
  announcement.className = 'sr-only';
  announcement.setAttribute('aria-live', 'polite');
  announcement.textContent = 'Dinosaur Stories application loaded successfully';
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 3000);
});

window.AccessibilityManager = AccessibilityManager;

// Global function to trigger notifications from other components
window.showNotification = function(title, body, options = {}) {
  if (window.pushManager) {
    window.pushManager.showNotification(title, body, options);
  } else {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }
};

// Export notification functions for use in other modules
window.notifyRegistrationSuccess = function(user) {
  if (window.pushManager) {
    window.pushManager.notifyRegistrationSuccess(user);
  }
};

window.notifyLoginSuccess = function(user) {
  if (window.pushManager) {
    window.pushManager.notifyLoginSuccess(user);
  }
};

window.notifyNewStory = function(story) {
  if (window.pushManager) {
    window.pushManager.notifyNewStory(story);
  }
};

window.notifyOfflineStorySaved = function() {
  if (window.pushManager) {
    window.pushManager.notifyOfflineStorySaved();
  }
};

// Export unsubscribe function
window.unsubscribeFromPush = function() {
  if (window.pushManager) {
    window.pushManager.unsubscribeFromPush();
  }
};

// PERBAIKAN: Export refresh function untuk manual refresh state
window.refreshPushState = function() {
  if (window.pushManager && window.pushManager.refreshState) {
    window.pushManager.refreshState();
  }
};

// PERBAIKAN: Auto-refresh push state ketika user login/logout
window.addEventListener('storage', function(e) {
  if (e.key === 'story_app_token' || e.key === 'story_app_user') {
    setTimeout(() => {
      if (window.refreshPushState) {
        window.refreshPushState();
      }
    }, 1000);
  }
});