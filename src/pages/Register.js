//Register.js
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import { register, isOnline } from '../utils/api.js'; // Import isOnline dari api.js
import { isLoggedIn } from '../utils/auth.js';

export default function Register() {
  if (isLoggedIn()) {
    setTimeout(() => {
      window.location.hash = 'stories';
    }, 100);
  }

  return `
    ${Header()}
    <main id="main-content">
      <section class="auth-page" aria-labelledby="register-title">
        <div class="container">
          <div class="auth-container">
            <div class="auth-header">
              <h1 id="register-title">Join Dino Stories</h1>
              <p>Create an account to share your dinosaur discoveries</p>
              ${!isOnline() ? `
                <div class="network-status offline">
                  <span>📱 You are offline</span>
                  <small>You can register and use the app offline</small>
                </div>
              ` : ''}
            </div>
            
            <form id="register-form" class="auth-form">
              <fieldset>
                <legend class="sr-only">Registration Information</legend>
                
                <div class="form-group">
                  <label for="register-name">Full Name *</label>
                  <input 
                    type="text" 
                    id="register-name" 
                    name="name" 
                    required 
                    aria-required="true"
                    placeholder="Enter your full name"
                    autocomplete="name"
                    minlength="2"
                  />
                  <span class="error-message" id="register-name-error"></span>
                </div>
                
                <div class="form-group">
                  <label for="register-email">Email *</label>
                  <input 
                    type="email" 
                    id="register-email" 
                    name="email" 
                    required 
                    aria-required="true"
                    placeholder="Enter your email"
                    autocomplete="email"
                  />
                  <span class="error-message" id="register-email-error"></span>
                </div>
                
                <div class="form-group">
                  <label for="register-password">Password *</label>
                  <input 
                    type="password" 
                    id="register-password" 
                    name="password" 
                    required 
                    aria-required="true"
                    placeholder="Create a password"
                    autocomplete="new-password"
                    minlength="6"
                  />
                  <small>Password must be at least 6 characters long</small>
                  <span class="error-message" id="register-password-error"></span>
                </div>
              </fieldset>
              
              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-full">
                  ${isOnline() ? 'Create Account' : 'Create Offline Account'}
                </button>
              </div>
              
              <div class="auth-links">
                <p>Already have an account? <a href="#login" data-nav="login">Login here</a></p>
              </div>
              
              <div id="register-message" class="form-message hidden" role="alert"></div>
            </form>
          </div>
        </div>
      </section>
    </main>
    ${Footer()}
  `;
}

// Initialize register page
window.initRegisterPage = function() {
  const registerForm = document.getElementById('register-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    
    const inputs = registerForm.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => clearError(`register-${input.name}-error`));
    });
  }
};

async function handleRegister(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const messageDiv = document.getElementById('register-message');
  
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  
  let isValid = true;
  
  if (!name) {
    showError('register-name-error', 'Full name is required');
    isValid = false;
  } else if (name.length < 2) {
    showError('register-name-error', 'Name must be at least 2 characters');
    isValid = false;
  }
  
  if (!email) {
    showError('register-email-error', 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError('register-email-error', 'Please enter a valid email');
    isValid = false;
  }
  
  if (!password) {
    showError('register-password-error', 'Password is required');
    isValid = false;
  } else if (password.length < 6) {
    showError('register-password-error', 'Password must be at least 6 characters');
    isValid = false;
  }
  
  if (!isValid) return;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    clearMessage();
    
    const result = await register({ name, email, password });
    
    showMessage('success', result.message || 'Account created successfully!');
    
    // Show notification if permissions granted
    if (window.notifyRegistrationSuccess) {
      window.notifyRegistrationSuccess({ name, email });
    }
    
    // Redirect to login page after successful registration
    setTimeout(() => {
      window.location.hash = 'login';
    }, 2000);
    
  } catch (error) {
    console.error('Registration error:', error);
    showMessage('error', error.message || 'Registration failed. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isOnline() ? 'Create Account' : 'Create Offline Account';
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
  const messageDiv = document.getElementById('register-message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.classList.remove('hidden');
  }
}

function clearMessage() {
  const messageDiv = document.getElementById('register-message');
  if (messageDiv) {
    messageDiv.classList.add('hidden');
  }
}