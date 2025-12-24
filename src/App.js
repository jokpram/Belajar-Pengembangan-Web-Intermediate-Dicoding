//App.js
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import router from './router.js';
import { isLoggedIn } from './utils/auth.js';

export default function App() {
    const headerElement = document.getElementById('app-header');
    const mainElement = document.getElementById('main-content');
    const footerElement = document.getElementById('app-footer');
    
    if (!headerElement || !mainElement || !footerElement) {
        console.error('Semantic elements not found');
        return;
    }

    let currentView = null;
    let isNavigating = false;

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'page-loading hidden';
    loadingIndicator.setAttribute('aria-live', 'polite');
    loadingIndicator.setAttribute('aria-label', 'Loading page');
    loadingIndicator.innerHTML = `
        <div class="loading-spinner" aria-hidden="true"></div>
        <span class="loading-text">Loading page...</span>
    `;
    document.body.appendChild(loadingIndicator);

    function showLoading() {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.setAttribute('aria-busy', 'true');
    }

    function hideLoading() {
        loadingIndicator.classList.add('hidden');
        loadingIndicator.setAttribute('aria-busy', 'false');
    }

    async function navigate(path) {
        if (isNavigating) return;
        
        isNavigating = true;
        const cleanPath = path.split('?')[0];
        
        if (window.location.hash !== `#${path}`) {
            window.history.pushState(null, '', `#${path}`);
        }

        announcePageChange(cleanPath);
        
        if (cleanPath === 'stories' || cleanPath === 'add') {
            showLoading();
        }

        try {
            await performNavigation(cleanPath);
        } catch (error) {
            console.error('Navigation error:', error);
            showErrorPage(error);
        } finally {
            isNavigating = false;
            hideLoading();
        }
    }

    function announcePageChange(page) {
        const pageNames = {
            'home': 'Home Page',
            'stories': 'Stories Page', 
            'add': 'Add Story Page',
            'detail': 'Story Details Page',
            'login': 'Login Page',
            'register': 'Register Page'
        };
        
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.textContent = `Loading ${pageNames[page] || page}`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    async function performNavigation(path) {
        return new Promise((resolve) => {
            if (document.startViewTransition) {
                document.startViewTransition(async () => {
                    await transitionView(path);
                    resolve();
                });
            } else {
                transitionView(path).then(resolve);
            }
        });
    }

    async function transitionView(path) {
        return new Promise((resolve) => {
            // Reset map containers before transition
            resetMapContainers();
            
            mainElement.style.opacity = '0';
            mainElement.style.transform = 'translateY(20px)';
            
            setTimeout(async () => {
                await renderView(path);
                resolve();
            }, 300);
        });
    }

    function resetMapContainers() {
        // Clear any existing map containers to prevent conflicts
        const mapContainers = document.querySelectorAll('#stories-map, #add-story-map, #detail-map');
        mapContainers.forEach(container => {
            if (container && container._leaflet_map) {
                console.log('🗑️ Removing map instance from:', container.id);
                try {
                    container._leaflet_map.remove();
                } catch (error) {
                    console.warn('Error removing map:', error);
                }
                container._leaflet_map = null;
            }
            if (container) {
                container.innerHTML = '<div class="map-loading">Loading map...</div>';
            }
        });
    }

    async function renderView(path) {
        return new Promise((resolve) => {
            try {
                const view = router(path);
                currentView = path;

                renderToSemanticStructure(view, path);

                mainElement.offsetHeight;
                
                mainElement.style.opacity = '1';
                mainElement.style.transform = 'translateY(0)';

                setTimeout(() => {
                    mainElement.setAttribute('tabindex', '-1');
                    mainElement.focus();
                }, 350);

                attachEventListeners();
                initializePageScripts();
                
                resolve();
            } catch (error) {
                console.error('Error rendering view:', error);
                showErrorPage(error);
                resolve();
            }
        });
    }

    function renderToSemanticStructure(htmlContent, path) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        const viewHeader = tempDiv.querySelector('header');
        if (viewHeader) {
            headerElement.innerHTML = viewHeader.innerHTML;
        } else {
            headerElement.innerHTML = Header();
        }
        
        const viewMain = tempDiv.querySelector('main');
        if (viewMain) {
            mainElement.innerHTML = viewMain.innerHTML;
        } else {
            const contentWithoutHeaderFooter = htmlContent
                .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
            mainElement.innerHTML = contentWithoutHeaderFooter;
        }
        
        const viewFooter = tempDiv.querySelector('footer');
        if (viewFooter) {
            footerElement.innerHTML = viewFooter.innerHTML;
        } else {
            footerElement.innerHTML = Footer();
        }

        setTimeout(() => {
            headerElement.classList.add('loaded');
            mainElement.classList.add('loaded');
            footerElement.classList.add('loaded');
        }, 100);
    }

    function showErrorPage(error) {
        headerElement.innerHTML = Header();
        footerElement.innerHTML = Footer();
        mainElement.innerHTML = `
            <section class="error-section">
                <div class="container">
                    <h1>Page Load Error</h1>
                    <p>There was an error loading the requested page. Please try again.</p>
                    <p class="error-detail">Error: ${error.message}</p>
                    <div class="error-actions">
                        <a href="#home" data-nav="home" class="btn btn-primary">Go to Home</a>
                        <button onclick="window.location.reload()" class="btn btn-secondary">Reload Page</button>
                    </div>
                </div>
            </section>
        `;
        attachEventListeners();
    }

    function attachEventListeners() {
        const links = document.querySelectorAll('[data-nav]');
        links.forEach(link => {
            link.replaceWith(link.cloneNode(true));
        });

        const newLinks = document.querySelectorAll('[data-nav]');
        newLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-nav');
                const href = link.getAttribute('href');
                
                const announcement = document.createElement('div');
                announcement.className = 'sr-only';
                announcement.setAttribute('aria-live', 'polite');
                announcement.textContent = `Navigating to ${link.textContent}`;
                document.body.appendChild(announcement);
                
                setTimeout(() => {
                    document.body.removeChild(announcement);
                }, 1000);
                
                navigate(path || href?.replace('#', ''));
            });

            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                }
            });
        });

        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                mainElement.setAttribute('tabindex', '-1');
                mainElement.focus();
                
                const announcement = document.createElement('div');
                announcement.className = 'sr-only';
                announcement.setAttribute('aria-live', 'polite');
                announcement.textContent = 'Skipped to main content';
                document.body.appendChild(announcement);
                
                setTimeout(() => {
                    document.body.removeChild(announcement);
                }, 1000);
            });
        }

        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isExpanded = navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
                navToggle.setAttribute('aria-expanded', isExpanded);
                
                const announcement = document.createElement('div');
                announcement.className = 'sr-only';
                announcement.setAttribute('aria-live', 'polite');
                announcement.textContent = `Navigation menu ${isExpanded ? 'opened' : 'closed'}`;
                document.body.appendChild(announcement);
                
                setTimeout(() => {
                    document.body.removeChild(announcement);
                }, 1000);
            });

            document.addEventListener('click', (e) => {
                if (navMenu.classList.contains('active') && 
                    !e.target.closest('.nav-menu') && 
                    !e.target.closest('.nav-toggle')) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach((element) => {
            element.addEventListener('focus', () => {
                element.classList.add('focused');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('focused');
            });
        });
    }

    function initializePageScripts() {
        const initFunctions = {
            'stories': 'initStoriesPage',
            'add': 'initAddStoryPage', 
            'detail': 'loadStoryDetail',
            'login': 'initLoginPage',
            'register': 'initRegisterPage'
        };

        const initFunction = initFunctions[currentView];
        if (initFunction && typeof window[initFunction] === 'function') {
            // Enhanced delay for Add Story page to ensure DOM is fully ready
            const delay = currentView === 'add' ? 500 : 300;
            
            console.log(`⏳ Initializing ${initFunction} for page: ${currentView} in ${delay}ms`);
            
            setTimeout(() => {
                console.log(`🚀 Executing ${initFunction}...`);
                window[initFunction]();
            }, delay);
        }

        updateDocumentTitle(currentView);
    }

    function updateDocumentTitle(page) {
        const titles = {
            'home': 'Dinosaur Stories - Home',
            'stories': 'Dinosaur Stories - Gallery',
            'add': 'Dinosaur Stories - Add Story',
            'detail': 'Dinosaur Stories - Story Details',
            'login': 'Dinosaur Stories - Login',
            'register': 'Dinosaur Stories - Register'
        };
        
        document.title = titles[page] || 'Dinosaur Stories';
    }

    window.addEventListener('hashchange', () => {
        const path = window.location.hash.slice(1) || 'home';
        if (path !== currentView) {
            navigate(path);
        }
    });

    window.addEventListener('popstate', () => {
        const path = window.location.hash.slice(1) || 'home';
        if (path !== currentView) {
            navigate(path);
        }
    });

    function initializeApp() {
        const initialPath = window.location.hash.slice(1) || 'home';
        navigate(initialPath);
    }

    // Enhanced wait for Leaflet with timeout
    function waitForLeaflet(callback, maxAttempts = 50) {
        let attempts = 0;
        
        const checkLeaflet = () => {
            attempts++;
            
            if (typeof L !== 'undefined' && typeof L.Map !== 'undefined' && typeof L.tileLayer !== 'undefined') {
                console.log('✅ Leaflet fully loaded after', attempts, 'attempts');
                callback();
            } else if (attempts < maxAttempts) {
                setTimeout(checkLeaflet, 100);
            } else {
                console.error('❌ Leaflet failed to load after maximum attempts');
                // Continue anyway, map components will handle the error
                callback();
            }
        };
        
        checkLeaflet();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            waitForLeaflet(initializeApp);
        });
    } else {
        waitForLeaflet(initializeApp);
    }

    window.appNavigate = navigate;
}