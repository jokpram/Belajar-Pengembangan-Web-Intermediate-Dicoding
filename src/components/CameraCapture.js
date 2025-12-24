//CameraCapture.js
export default function CameraCapture() {
    return `
        <div class="camera-capture" aria-labelledby="camera-capture-title">
            <h2 id="camera-capture-title" class="camera-title">Camera Capture</h2>
            
            <div class="camera-toggle-section">
                <input type="checkbox" id="camera-toggle" class="camera-toggle" aria-describedby="camera-toggle-help" />
                <label for="camera-toggle" class="camera-label">
                    <span class="camera-toggle-text">Enable Camera</span>
                </label>
                <small id="camera-toggle-help" class="camera-help">Toggle to activate your camera for photo capture</small>
            </div>
            
            <div class="camera-container hidden" id="camera-container">
                <div class="camera-viewfinder">
                    <video id="camera-video" 
                           autoplay 
                           playsinline 
                           aria-label="Camera live view"
                           class="camera-video"></video>
                    <canvas id="camera-canvas" class="hidden" aria-hidden="true"></canvas>
                </div>
                
                <div class="camera-controls">
                    <button type="button" id="capture-btn" class="btn-capture" aria-label="Capture photo">
                        <span class="btn-icon">📸</span>
                        Capture Photo
                    </button>
                    <button type="button" id="close-camera-btn" class="btn-close-camera" aria-label="Close camera">
                        <span class="btn-icon">❌</span>
                        Close Camera
                    </button>
                </div>
            </div>
            
            <div id="camera-preview" class="camera-preview hidden" aria-labelledby="camera-preview-title">
                <h3 id="camera-preview-title" class="camera-preview-title">Captured Photo Preview</h3>
                <img id="captured-image" alt="Captured photo preview" class="camera-preview-image" />
                <div class="camera-preview-controls">
                    <button type="button" id="retake-btn" class="btn-retake" aria-label="Retake photo">
                        <span class="btn-icon">🔄</span>
                        Retake Photo
                    </button>
                    <button type="button" id="use-camera-again-btn" class="btn-capture" aria-label="Use camera again">
                        <span class="btn-icon">📸</span>
                        Use Camera Again
                    </button>
                </div>
                <p class="camera-preview-help">This photo will be used for your story submission</p>
            </div>
        </div>
    `;
}

// Export named function untuk initCameraCapture
export function initCameraCapture() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const closeCameraBtn = document.getElementById('close-camera-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const useCameraAgainBtn = document.getElementById('use-camera-again-btn');
    const toggle = document.getElementById('camera-toggle');
    const cameraContainer = document.getElementById('camera-container');
    const preview = document.getElementById('camera-preview');
    const capturedImage = document.getElementById('captured-image');
    
    let stream = null;
    let isCameraActive = false;

    async function startCamera() {
        try {
            if (stream) {
                stopCamera();
            }

            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                },
                audio: false
            });
            
            video.srcObject = stream;
            cameraContainer.classList.remove('hidden');
            isCameraActive = true;
            
            video.addEventListener('loadeddata', () => {
                if (captureBtn) {
                    captureBtn.disabled = false;
                }
            }, { once: true });

        } catch (error) {
            console.error('Error accessing camera:', error);
            showCameraError('Unable to access camera. Please check permissions and ensure no other app is using the camera.');
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
            stream = null;
        }
        isCameraActive = false;
        
        if (captureBtn) {
            captureBtn.disabled = true;
        }
    }

    function closeCamera() {
        stopCamera();
        cameraContainer.classList.add('hidden');
        if (toggle) {
            toggle.checked = false;
        }
        
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = 'Camera closed';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }

    function showCameraError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'camera-error';
        errorElement.innerHTML = `
            <p>❌ ${message}</p>
            <button onclick="this.parentElement.remove()" class="btn btn-secondary">Dismiss</button>
        `;
        
        const cameraCapture = document.querySelector('.camera-capture');
        if (cameraCapture) {
            cameraCapture.appendChild(errorElement);
        }
        
        if (toggle) {
            toggle.checked = false;
        }
    }

    function capturePhoto() {
        if (!isCameraActive || !video.videoWidth) {
            showCameraError('Camera not ready. Please wait for camera to initialize.');
            return;
        }

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        capturedImage.src = imageData;
        
        capturedImage.dataset.imageData = imageData;
        
        preview.classList.remove('hidden');
        retakeBtn.classList.remove('hidden');
        captureBtn.classList.add('hidden');
        
        stopCamera();
        cameraContainer.classList.add('hidden');
        
        const fileInput = document.getElementById('story-photo');
        if (fileInput) {
            fileInput.value = '';
        }
        
        const photoError = document.getElementById('photo-error');
        if (photoError) {
            photoError.textContent = '';
        }
        
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = 'Photo captured successfully';
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    }

    function retakePhoto() {
        preview.classList.add('hidden');
        retakeBtn.classList.add('hidden');
        captureBtn.classList.remove('hidden');
        
        capturedImage.src = '';
        delete capturedImage.dataset.imageData;
        
        startCamera();
    }

    // Event listeners
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                startCamera();
            } else {
                closeCamera();
            }
        });
    }

    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
        captureBtn.disabled = true;
    }

    if (closeCameraBtn) {
        closeCameraBtn.addEventListener('click', closeCamera);
    }

    if (retakeBtn) {
        retakeBtn.addEventListener('click', retakePhoto);
    }

    if (useCameraAgainBtn) {
        useCameraAgainBtn.addEventListener('click', () => {
            preview.classList.add('hidden');
            startCamera();
        });
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isCameraActive) {
            closeCamera();
        }
    });

    // Cleanup function
    return () => {
        closeCamera();
    };
}

// Global function untuk handle inline script CSP issue
window.initCameraCaptureGlobal = function() {
    return initCameraCapture();
};