//Login.js
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import { login, isOnline } from '../utils/api.js'; // Import isOnline dari api.js
import { setAuthToken, setUser, isLoggedIn } from '../utils/auth.js';

export default function Login() {
  if (isLoggedIn()) {
    setTimeout(() => {
      window.location.hash = 'stories';
    }, 100);
  }

  return `
    ${Header()}
    <main id="main-content">
      <section class="auth-page" aria-labelledby="login-title">
        <div class="container">
          <div class="auth-container">
            <div class="auth-header">
              <h1 id="login-title">Login to Dino Stories</h1>
              <p>Access your account to share dinosaur discoveries</p>
              ${!isOnline() ? `
                <div class="network-status offline">
                  <span>📱 You are offline</span>
                  <small>You can login with your offline account</small>
                </div>
              ` : ''}
            </div>
            
            <form id="login-form" class="auth-form">
              <fieldset>
                <legend class="sr-only">Login Information</legend>
                
                <div class="form-group">
                  <label for="login-email">Email *</label>
                  <input 
                    type="email" 
                    id="login-email" 
                    name="email" 
                    required 
                    aria-required="true"
                    placeholder="Enter your email"
                    autocomplete="email"
                  />
                  <span class="error-message" id="login-email-error"></span>
                </div>
                
                <div class="form-group">
                  <label for="login-password">Password *</label>
                  <input 
                    type="password" 
                    id="login-password" 
                    name="password" 
                    required 
                    aria-required="true"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    minlength="6"
                  />
                  <span class="error-message" id="login-password-error"></span>
                </div>
              </fieldset>
              
              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-full">
                  ${isOnline() ? 'Login' : 'Login Offline'}
                </button>
              </div>
              
              <div class="auth-links">
                <p>Don't have an account? <a href="#register" data-nav="register">Register here</a></p>
              </div>
              
              <div id="login-message" class="form-message hidden" role="alert"></div>
            </form>
          </div>
        </div>
      </section>
    </main>
    ${Footer()}
  `;
}

// Initialize login page
window.initLoginPage = function() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => clearError(`${input.name}-error`));
    });
  }
};

async function handleLogin(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const messageDiv = document.getElementById('login-message');
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  
  let isValid = true;
  
  if (!email) {
    showError('login-email-error', 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError('login-email-error', 'Please enter a valid email');
    isValid = false;
  }
  
  if (!password) {
    showError('login-password-error', 'Password is required');
    isValid = false;
  } else if (password.length < 6) {
    showError('login-password-error', 'Password must be at least 6 characters');
    isValid = false;
  }
  
  if (!isValid) return;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    clearMessage();
    
    const result = await login({ email, password });
    
    // Save token and user data
    if (result.loginResult.token) {
      setAuthToken(result.loginResult.token);
    }
    setUser(result.loginResult);
    
    showMessage('success', result.message || 'Login successful! Redirecting to stories...');
    
    // Show notification if permissions granted
    if (window.notifyLoginSuccess) {
      window.notifyLoginSuccess(result.loginResult);
    }
    
    // Redirect to stories page
    setTimeout(() => {
      window.location.hash = 'stories';
    }, 1500);
    
  } catch (error) {
    console.error('Login error:', error);
    showMessage('error', error.message || 'Login failed. Please check your credentials and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isOnline() ? 'Login' : 'Login Offline';
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

function showMessage(type, message) {
  const messageDiv = document.getElementById('login-message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.classList.remove('hidden');
  }
}

function clearMessage() {
  const messageDiv = document.getElementById('login-message');
  if (messageDiv) {
    messageDiv.classList.add('hidden');
  }
}