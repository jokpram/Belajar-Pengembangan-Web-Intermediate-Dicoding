// Home.js
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import { isLoggedIn } from '../utils/auth.js';

export default function Home() {
    const isAuthenticated = isLoggedIn();
    
    return `
        ${Header()}
        <main id="main-content">
            <section class="hero" aria-labelledby="hero-title">
                <div class="hero-content">
                    <h1 id="hero-title" class="hero-main-title">Welcome to Dinosaur Story App</h1>
                    <p class="hero-subtitle">Discover amazing stories about dinosaurs from around the world. Share your own findings and explore prehistoric wonders.</p>
                    <div class="hero-actions">
                        <a href="#stories" data-nav="stories" class="btn btn-primary">Explore Stories</a>
                        ${isAuthenticated ? 
                            '<a href="#add" data-nav="add" class="btn btn-secondary">Share Your Story</a>' :
                            '<a href="#register" data-nav="register" class="btn btn-secondary">Get Started</a>'
                        }
                    </div>
                    ${!isAuthenticated ? `
                        <div class="hero-subtext">
                            <p><small>Already have an account? <a href="#login" data-nav="login">Login here</a></small></p>
                        </div>
                    ` : ''}
                </div>
            </section>

            <section class="features" aria-labelledby="features-title">
                <div class="container">
                    <h2 id="features-title" class="section-title">How It Works</h2>
                    <div class="features-grid">
                        <article class="feature-card" aria-labelledby="feature-1-title">
                            <div class="feature-step" aria-hidden="true">1</div>
                            <h3 id="feature-1-title" class="feature-title">Create Account</h3>
                            <p class="feature-description">Register for free to unlock all features of our dinosaur discovery platform.</p>
                        </article>
                        <article class="feature-card" aria-labelledby="feature-2-title">
                            <div class="feature-step" aria-hidden="true">2</div>
                            <h3 id="feature-2-title" class="feature-title">Login to Your Account</h3>
                            <p class="feature-description">Access your personal account to manage your stories and discoveries.</p>
                        </article>
                        <article class="feature-card" aria-labelledby="feature-3-title">
                            <div class="feature-step" aria-hidden="true">3</div>
                            <h3 id="feature-3-title" class="feature-title">Share Your Discoveries</h3>
                            <p class="feature-description">Add your dinosaur findings with photos, descriptions, and locations on the map.</p>
                        </article>
                    </div>
                </div>
            </section>
        </main>
        ${Footer()}
    `;
}