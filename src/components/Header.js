//Header.js

import { isLoggedIn, getUser, logout } from '../utils/auth.js';

export default function Header() {
    const user = getUser();
    const isAuthenticated = isLoggedIn();
    
    return `
        <header class="header" role="banner">
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <nav class="navbar" role="navigation" aria-label="Main navigation">
                <div class="nav-brand">
                    <div class="brand-wrapper">
                        <a href="#home" data-nav="home" class="brand-link" aria-label="Dinosaur Stories - Home">
                            <span aria-hidden="true">🦕</span> Dino Stories
                        </a>
                    </div>
                </div>
                <ul class="nav-menu" role="menubar">
                    <li role="none">
                        <a href="#home" data-nav="home" class="nav-link" role="menuitem" aria-current="${window.location.hash === '#home' ? 'page' : 'false'}">
                            Home
                        </a>
                    </li>
                    <li role="none">
                        <a href="#stories" data-nav="stories" class="nav-link" role="menuitem" aria-current="${window.location.hash === '#stories' ? 'page' : 'false'}">
                            Stories
                        </a>
                    </li>
                    
                    ${isAuthenticated ? `
                        <li role="none">
                            <a href="#add" data-nav="add" class="nav-link" role="menuitem" aria-current="${window.location.hash === '#add' ? 'page' : 'false'}">
                                Add Story
                            </a>
                        </li>
                        <li class="nav-user" role="none">
                            <span class="user-welcome" aria-label="Welcome, ${user.name}">
                                👋 Hello, ${user.name}
                            </span>
                            <button class="btn-logout" onclick="window.handleLogout()" aria-label="Logout from your account">
                                Logout
                            </button>
                        </li>
                    ` : `
                        <li role="none">
                            <a href="#login" data-nav="login" class="nav-link" role="menuitem" aria-current="${window.location.hash === '#login' ? 'page' : 'false'}">
                                Login
                            </a>
                        </li>
                        <li role="none">
                            <a href="#register" data-nav="register" class="nav-link btn-register" role="menuitem" aria-current="${window.location.hash === '#register' ? 'page' : 'false'}">
                                Register
                            </a>
                        </li>
                    `}
                </ul>
                <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-menu">
                    <span class="toggle-bar" aria-hidden="true"></span>
                    <span class="toggle-bar" aria-hidden="true"></span>
                    <span class="toggle-bar" aria-hidden="true"></span>
                </button>
            </nav>
        </header>
    `;
}

// Global logout function dengan konfirmasi aksesibilitas
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout? This action cannot be undone.')) {
        // Announce logout for screen readers
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'assertive');
        announcement.textContent = 'Logging out...';
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            logout();
            document.body.removeChild(announcement);
        }, 1000);
    }
};