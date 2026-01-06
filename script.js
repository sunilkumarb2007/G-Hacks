// ===== GLOBAL VARIABLES =====
let map, miniMap, userMarker, accuracyCircle;
let userLocation = null;
let emergencyData = {
    type: null,
    location: null,
    description: "",
    notifications: {
        sms: true,
        email: true,
        call: true
    }
};
let currentStep = 1;
let liveSharingInterval = null;
let userLoggedIn = false;

// Campus Coordinates
const CAMPUS_CENTER = [13.054167, 80.072477];
const PANIMALAR_BOUNDS = [
    [13.052, 80.070],
    [13.056, 80.075]
];

// Key Locations with exact coordinates
const CAMPUS_LOCATIONS = {
    'EEE & Boys Hostel 5-Block': {
        coords: [13.054278, 80.072444],
        name: 'EEE Department & Boys Hostel 5-Block',
        type: 'hostel',
        googleMaps: 'https://maps.app.goo.gl/T2G7b2EUuQk7J16L8'
    },
    'Playground': {
        coords: [13.053861, 80.074083],
        name: 'Sports Ground',
        type: 'sports',
        googleMaps: 'https://maps.app.goo.gl/XYqoS6SMhYNasxNk9'
    },
    'PIT Mess': {
        coords: [13.053494, 80.074242],
        name: 'Food Mess',
        type: 'dining',
        googleMaps: 'https://goo.gl/maps/example'
    },
    'Administrative Block': {
        coords: [13.049092, 80.075076],
        name: 'Administrative Block',
        type: 'admin',
        googleMaps: 'https://goo.gl/maps/example'
    }
};

// Emergency Types
const EMERGENCY_TYPES = {
    medical: {
        name: 'Medical Emergency',
        icon: 'fas fa-heart-pulse',
        color: '#e63946',
        description: 'Health issues, injuries, medical assistance'
    },
    fire: {
        name: 'Fire Emergency',
        icon: 'fas fa-fire',
        color: '#ff6b35',
        description: 'Dorms, labs, electrical fires, explosions'
    },
    security: {
        name: 'Security Threat',
        icon: 'fas fa-shield-alt',
        color: '#2d6ae3',
        description: 'Assaults, theft, active threats, intruders'
    },
    women: {
        name: 'Women Safety',
        icon: 'fas fa-person-dress',
        color: '#8a2be2',
        description: 'Discreet alert for harassment or threats'
    },
    accident: {
        name: 'Road Accident',
        icon: 'fas fa-car-crash',
        color: '#ffd166',
        description: 'Vehicle collisions, pedestrian accidents'
    },
    natural: {
        name: 'Natural Disaster',
        icon: 'fas fa-mountain',
        color: '#06d6a0',
        description: 'Earthquakes, floods, severe weather'
    },
    chemical: {
        name: 'Chemical Accident',
        icon: 'fas fa-flask',
        color: '#4cc9f0',
        description: 'Lab spills, exposures, hazardous materials'
    },
    other: {
        name: 'Other Emergency',
        icon: 'fas fa-question-circle',
        color: '#64748b',
        description: 'Any other urgent situation'
    }
};

// ===== DOM ELEMENTS =====
const elements = {
    // Main Elements
    sosButton: document.getElementById('sosButton'),
    emergencyModal: document.getElementById('emergencyModal'),
    closeModal: document.getElementById('closeModal'),
    womenSafetyBtn: document.getElementById('womenSafetyBtn'),
    loginBtn: document.getElementById('loginBtn'),
    userAvatar: document.getElementById('userAvatar'),
    dashboardBtn: document.getElementById('dashboardBtn'),
    emergencyLogBtn: document.getElementById('emergencyLogBtn'),
    loginModal: document.getElementById('loginModal'),
    closeLogin: document.getElementById('closeLogin'),
    googleLogin: document.getElementById('googleLogin'),
    signupModal: document.getElementById('signupModal'),
    closeSignup: document.getElementById('closeSignup'),
    dashboardModal: document.getElementById('dashboardModal'),
    closeDashboard: document.getElementById('closeDashboard'),
    
    // Map Elements
    map: document.getElementById('map'),
    miniMap: document.getElementById('miniMap'),
    locateBtn: document.getElementById('locateBtn'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    
    // Emergency Steps
    steps: document.querySelectorAll('.modal-step'),
    nextButtons: {
        step1: document.getElementById('nextStep1'),
        step2: document.getElementById('nextStep2'),
        step3: document.getElementById('nextStep3')
    },
    backButtons: {
        step2: document.getElementById('backStep2'),
        step3: document.getElementById('backStep3'),
        step4: document.getElementById('backStep4')
    },
    submitEmergency: document.getElementById('submitEmergency'),
    closeSuccess: document.getElementById('closeSuccess'),
    
    // Step 1
    emergencyTypeCards: document.querySelectorAll('.emergency-type-card'),
    
    // Step 2
    refreshLocation: document.getElementById('refreshLocation'),
    accuracyText: document.getElementById('accuracyText'),
    lastUpdate: document.getElementById('lastUpdate'),
    
    // Step 3
    emergencyDescription: document.getElementById('emergencyDescription'),
    charCount: document.getElementById('charCount'),
    smsNotify: document.getElementById('smsNotify'),
    emailNotify: document.getElementById('emailNotify'),
    callNotify: document.getElementById('callNotify'),
    
    // Step 4
    reviewType: document.getElementById('reviewType'),
    reviewLocation: document.getElementById('reviewLocation'),
    reviewDescription: document.getElementById('reviewDescription'),
    reviewNotifications: document.getElementById('reviewNotifications'),
    
    // Location Cards
    locationCards: document.querySelectorAll('.location-card'),
    locationActions: document.querySelectorAll('.location-action'),
    
    // Quick Emergency Buttons
    quickEmergencyBtns: document.querySelectorAll('.emergency-quick'),
    
    // Proximity Alert
    proximityAlert: document.getElementById('proximityAlert'),
    distanceAlert: document.getElementById('distanceAlert'),
    
    // Toast Notification
    notificationToast: document.getElementById('notificationToast'),
    toastMessage: document.getElementById('toastMessage'),
    
    // Progress Bar
    progressFill: document.getElementById('progressFill'),
    
    // Draggable Modal
    draggableModal: document.getElementById('draggableModal'),
    draggableHeader: document.querySelector('.draggable-header')
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initApplication();
});

function initApplication() {
    initMaps();
    initEventListeners();
    getUserLocation();
    updateDashboard();
    checkUserLogin();
    
    // Simulate live updates
    setInterval(updateLiveStatus, 5000);
    setInterval(simulateProximityAlert, 15000);
}

// ===== MAP INITIALIZATION =====
function initMaps() {
    // Initialize main map
    map = L.map('map').setView(CAMPUS_CENTER, 17);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 20,
        minZoom: 15
    }).addTo(map);
    
    // Add campus boundary
    L.rectangle(PANIMALAR_BOUNDS, {
        color: '#2d6ae3',
        fillColor: 'rgba(45, 106, 227, 0.1)',
        fillOpacity: 0.2,
        weight: 3,
        dashArray: '5, 5'
    }).addTo(map).bindPopup('<strong>Panimalar Engineering College</strong><br>Campus Boundary');
    
    // Add key locations to map
    addCampusLocationsToMap();
    
    // Add emergency zones
    addEmergencyZones();
    
    // Initialize mini map
    miniMap = L.map('miniMap').setView(CAMPUS_CENTER, 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    }).addTo(miniMap);
    
    miniMap.dragging.disable();
    miniMap.touchZoom.disable();
    miniMap.doubleClickZoom.disable();
    miniMap.scrollWheelZoom.disable();
    miniMap.boxZoom.disable();
    miniMap.keyboard.disable();
}

function addCampusLocationsToMap() {
    Object.entries(CAMPUS_LOCATIONS).forEach(([key, location]) => {
        const icon = L.divIcon({
            html: `
                <div style="
                    width: 36px;
                    height: 36px;
                    background: ${getLocationColor(location.type)};
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    cursor: pointer;
                ">
                    <i class="fas fa-${location.type === 'hostel' ? 'building' : 
                                      location.type === 'sports' ? 'futbol' : 
                                      location.type === 'dining' ? 'utensils' : 'landmark'}"></i>
                </div>
            `,
            className: 'location-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
        
        const marker = L.marker(location.coords, { 
            icon,
            title: location.name
        }).addTo(map);
        
        marker.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; padding: 10px; min-width: 200px;">
                <strong style="color: #2d6ae3;">${location.name}</strong><br>
                <small>${key}</small><br><br>
                <button onclick="openGoogleMaps('${location.googleMaps}', ${userLocation ? userLocation.lat : CAMPUS_CENTER[0]}, ${userLocation ? userLocation.lng : CAMPUS_CENTER[1]}, ${location.coords[0]}, ${location.coords[1]})" 
                        style="
                            background: #2d6ae3;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            width: 100%;
                            justify-content: center;
                        ">
                    <i class="fas fa-external-link-alt"></i> Open in Google Maps
                </button>
            </div>
        `);
    });
}

function openGoogleMaps(googleMapsUrl, startLat, startLng, endLat, endLng) {
    // Open Google Maps with route from current location
    const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
    window.open(url, '_blank');
}

function getLocationColor(type) {
    const colors = {
        hostel: '#2d6ae3',
        sports: '#06d6a0',
        dining: '#ff6b35',
        admin: '#8a2be2'
    };
    return colors[type] || '#64748b';
}

function addEmergencyZones() {
    // Medical Zone
    L.circle([13.0548, 80.0721], {
        color: '#e63946',
        fillColor: 'rgba(230, 57, 70, 0.2)',
        fillOpacity: 0.3,
        radius: 50
    }).addTo(map).bindPopup('<strong>Medical Emergency Zone</strong><br>24/7 Medical Center');
    
    // Security Zone
    L.circle([13.0543, 80.0718], {
        color: '#8a2be2',
        fillColor: 'rgba(138, 43, 226, 0.2)',
        fillOpacity: 0.3,
        radius: 60
    }).addTo(map).bindPopup('<strong>Security Zone</strong><br>Main Security Office');
    
    // Women Safety Zone
    L.circle([13.0539, 80.0732], {
        color: '#8a2be2',
        fillColor: 'rgba(138, 43, 226, 0.2)',
        fillOpacity: 0.3,
        radius: 40
    }).addTo(map).bindPopup('<strong>Women Safety Zone</strong><br>Discreet Emergency Support');
}

// ===== LOCATION FUNCTIONS =====
function getUserLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString()
            };
            
            updateUserMarker();
            updateAccuracyDisplay();
            emergencyData.location = userLocation;
            
            // Update mini map
            miniMap.setView([userLocation.lat, userLocation.lng], 17);
        },
        (error) => {
            console.error('Geolocation error:', error);
            
            // Fallback to campus center
            userLocation = {
                lat: CAMPUS_CENTER[0],
                lng: CAMPUS_CENTER[1],
                accuracy: 100,
                timestamp: new Date().toISOString()
            };
            
            updateUserMarker();
            updateAccuracyDisplay();
            emergencyData.location = userLocation;
            
            let message = 'Using campus location';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Location access denied. Using campus center.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location unavailable. Using campus center.';
                    break;
                case error.TIMEOUT:
                    message = 'Location request timeout. Using campus center.';
                    break;
            }
            
            showToast(message, 'warning');
        },
        options
    );
}

function updateUserMarker() {
    if (!userLocation) return;
    
    // Remove existing marker
    if (userMarker) {
        map.removeLayer(userMarker);
        map.removeLayer(accuracyCircle);
    }
    
    // Create user marker
    userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
            html: `
                <div style="
                    width: 28px;
                    height: 28px;
                    background: radial-gradient(circle, #e63946 40%, transparent 70%);
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 20px #e63946;
                    cursor: pointer;
                ">
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 6px;
                        height: 6px;
                        background: white;
                        border-radius: 50%;
                    "></div>
                </div>
            `,
            className: 'user-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        }),
        zIndexOffset: 1000
    }).addTo(map).bindPopup('<strong>Your Location</strong><br>Tap for details');
    
    // Create accuracy circle
    accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: 'rgba(230, 57, 70, 0.3)',
        fillColor: 'rgba(230, 57, 70, 0.1)',
        fillOpacity: 0.2,
        radius: userLocation.accuracy,
        weight: 2
    }).addTo(map);
    
    // Center map on user
    map.setView([userLocation.lat, userLocation.lng], 17);
}

function updateAccuracyDisplay() {
    if (!userLocation) return;
    
    const accuracy = Math.round(userLocation.accuracy);
    let accuracyLevel = 'High';
    let color = '#06d6a0';
    
    if (accuracy > 25) {
        accuracyLevel = 'Medium';
        color = '#ff6b35';
    }
    if (accuracy > 50) {
        accuracyLevel = 'Low';
        color = '#e63946';
    }
    
    elements.accuracyText.textContent = `${accuracyLevel} (${accuracy}m)`;
    elements.accuracyText.style.color = color;
    
    // Update last update time
    const now = new Date();
    elements.lastUpdate.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ===== EMERGENCY FLOW FUNCTIONS =====
function openEmergencyModal() {
    if (!userLoggedIn) {
        showToast('Please sign in to report an emergency', 'warning');
        openLoginModal();
        return;
    }
    
    elements.emergencyModal.style.display = 'flex';
    resetEmergencyFlow();
    getUserLocation();
    
    // Vibrate on mobile
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

function closeEmergencyModal() {
    elements.emergencyModal.style.display = 'none';
    resetEmergencyFlow();
}

function resetEmergencyFlow() {
    currentStep = 1;
    emergencyData = {
        type: null,
        location: null,
        description: "",
        notifications: {
            sms: true,
            email: true,
            call: true
        }
    };
    
    // Reset UI
    elements.steps.forEach(step => step.classList.remove('active'));
    elements.steps[0].classList.add('active');
    elements.progressFill.style.width = '20%';
    
    // Clear selections
    elements.emergencyTypeCards.forEach(card => card.classList.remove('selected'));
    elements.emergencyDescription.value = '';
    elements.charCount.textContent = '0';
    elements.smsNotify.checked = true;
    elements.emailNotify.checked = true;
    elements.callNotify.checked = true;
    
    // Update step dots
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === 0);
    });
}

function goToNextStep() {
    if (!validateStep(currentStep)) return;
    
    updateReviewData();
    
    // Animate step transition
    const currentStepEl = document.getElementById(`step${currentStep}`);
    currentStepEl.style.opacity = '0';
    currentStepEl.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
        currentStepEl.classList.remove('active');
        currentStep++;
        
        const nextStepEl = document.getElementById(`step${currentStep}`);
        nextStepEl.classList.add('active');
        nextStepEl.style.opacity = '0';
        nextStepEl.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            nextStepEl.style.opacity = '1';
            nextStepEl.style.transform = 'translateX(0)';
        }, 50);
        
        // Update progress
        elements.progressFill.style.width = `${currentStep * 20}%`;
        
        // Update step dots
        document.querySelectorAll('.step-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index < currentStep);
        });
    }, 300);
}

function goToPreviousStep() {
    if (currentStep <= 1) return;
    
    const currentStepEl = document.getElementById(`step${currentStep}`);
    currentStepEl.style.opacity = '0';
    currentStepEl.style.transform = 'translateX(20px)';
    
    setTimeout(() => {
        currentStepEl.classList.remove('active');
        currentStep--;
        
        const prevStepEl = document.getElementById(`step${currentStep}`);
        prevStepEl.classList.add('active');
        prevStepEl.style.opacity = '0';
        prevStepEl.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            prevStepEl.style.opacity = '1';
            prevStepEl.style.transform = 'translateX(0)';
        }, 50);
        
        // Update progress
        elements.progressFill.style.width = `${currentStep * 20}%`;
        
        // Update step dots
        document.querySelectorAll('.step-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index < currentStep);
        });
    }, 300);
}

function validateStep(step) {
    switch(step) {
        case 1:
            if (!emergencyData.type) {
                showToast('Please select an emergency type', 'error');
                return false;
            }
            return true;
        case 2:
            if (!emergencyData.location) {
                showToast('Please wait for location detection', 'warning');
                return false;
            }
            return true;
        case 3:
            const desc = elements.emergencyDescription.value.trim();
            if (!desc && emergencyData.type !== 'women') {
                showToast('Please provide emergency details', 'warning');
                return false;
            }
            emergencyData.description = desc;
            return true;
        default:
            return true;
    }
}

function updateReviewData() {
    // Update type
    if (emergencyData.type && EMERGENCY_TYPES[emergencyData.type]) {
        elements.reviewType.textContent = EMERGENCY_TYPES[emergencyData.type].name;
        elements.reviewType.style.color = EMERGENCY_TYPES[emergencyData.type].color;
    }
    
    // Update location
    if (emergencyData.location) {
        elements.reviewLocation.textContent = 
            `Lat: ${emergencyData.location.lat.toFixed(6)}, Lng: ${emergencyData.location.lng.toFixed(6)}`;
    }
    
    // Update description
    elements.reviewDescription.textContent = emergencyData.description || 'No additional details provided';
    
    // Update notifications
    const notifications = [];
    if (emergencyData.notifications.sms) notifications.push('SMS');
    if (emergencyData.notifications.email) notifications.push('Email');
    if (emergencyData.notifications.call) notifications.push('Auto Call');
    
    elements.reviewNotifications.textContent = notifications.join(', ') || 'None';
}

async function submitEmergency() {
    showLoading(true);
    
    try {
        // Prepare emergency data
        const emergencyReport = {
            type: emergencyData.type,
            typeName: EMERGENCY_TYPES[emergencyData.type]?.name || 'Emergency',
            location: emergencyData.location,
            description: emergencyData.description,
            timestamp: new Date().toISOString(),
            user: {
                name: localStorage.getItem('userName') || 'Anonymous',
                email: localStorage.getItem('userEmail') || 'Unknown'
            },
            status: 'active',
            id: generateEmergencyId()
        };
        
        // Send notifications
        await sendEmergencyNotifications(emergencyReport);
        
        // Start live location sharing
        startLiveLocationSharing(emergencyReport.id);
        
        // Log emergency
        logEmergency(emergencyReport);
        
        // Update dashboard
        updateDashboard();
        
        // Show success step
        goToNextStep();
        
        // Show notification toast
        showEmergencyNotification('Emergency successfully submitted! Help is on the way.');
        
    } catch (error) {
        console.error('Error submitting emergency:', error);
        showToast('Failed to send emergency alert. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function generateEmergencyId() {
    return 'EMG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

async function sendEmergencyNotifications(emergencyReport) {
    const emergencyType = emergencyReport.typeName;
    const locationLink = `https://www.google.com/maps?q=${emergencyReport.location.lat},${emergencyReport.location.lng}`;
    const timestamp = new Date(emergencyReport.timestamp).toLocaleString();
    
    // SMS Notification
    if (emergencyData.notifications.sms) {
        await sendSMSNotification(emergencyType, locationLink);
    }
    
    // Email Notification
    if (emergencyData.notifications.email) {
        await sendEmailNotification(emergencyReport, locationLink, timestamp);
    }
    
    // Auto Call
    if (emergencyData.notifications.call) {
        await initiateEmergencyCall();
    }
}

async function sendSMSNotification(emergencyType, locationLink) {
    const phoneNumbers = ['+917448325875', '+919445200978'];
    
    // Simulate SMS sending
    console.log('SMS sent to:', phoneNumbers);
    console.log('Message:', `🚨 ${emergencyType} - Location: ${locationLink}`);
    
    return new Promise(resolve => setTimeout(resolve, 1000));
}

async function sendEmailNotification(emergencyReport, locationLink, timestamp) {
    const emailData = {
        to: 'raghulvarathan06@gmail.com',
        subject: `🚨 ${emergencyReport.typeName} - SafeGate Emergency Alert`,
        html: createEmailTemplate(emergencyReport, locationLink, timestamp)
    };
    
    // Simulate email sending
    console.log('Email sent:', emailData);
    
    return new Promise(resolve => setTimeout(resolve, 1000));
}

function createEmailTemplate(emergencyReport, locationLink, timestamp) {
    return `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2d6ae3, #4a7ee9); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🚨 SafeGate Emergency Alert</h1>
                <p style="opacity: 0.9; margin-top: 10px;">Panimalar Engineering College</p>
            </div>
            
            <div style="padding: 30px; background: white;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h2 style="color: #e63946; margin-top: 0;">${emergencyReport.typeName}</h2>
                    
                    <div style="margin: 20px 0;">
                        <strong style="color: #2d6ae3;">📍 Location:</strong><br>
                        <a href="${locationLink}" style="color: #2d6ae3; text-decoration: none;">View on Google Maps</a><br>
                        <small>Coordinates: ${emergencyReport.location.lat.toFixed(6)}, ${emergencyReport.location.lng.toFixed(6)}</small>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong style="color: #2d6ae3;">📝 Description:</strong><br>
                        <p>${emergencyReport.description || 'No additional details provided'}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong style="color: #2d6ae3;">👤 Reporter:</strong><br>
                        <p>${emergencyReport.user.name} (${emergencyReport.user.email})</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong style="color: #2d6ae3;">⏰ Time Reported:</strong><br>
                        <p>${timestamp}</p>
                    </div>
                </div>
                
                <div style="background: #e9ecef; padding: 20px; border-radius: 10px; border-left: 4px solid #06d6a0;">
                    <h3 style="margin-top: 0; color: #212529;">🚨 Action Required:</h3>
                    <ol style="color: #495057;">
                        <li>Dispatch nearest responder immediately</li>
                        <li>Contact reporter if possible</li>
                        <li>Update status in SafeGate Dashboard</li>
                        <li>Monitor live location updates</li>
                    </ol>
                    <p style="color: #6c757d; margin-top: 15px;">
                        <strong>Live tracking active:</strong> Reporter's location updates every 10 seconds.<br>
                        <strong>Proximity alerts:</strong> You'll be notified when within 50m of reporter.
                    </p>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; border-top: 1px solid #dee2e6;">
                <p style="margin: 0;">This is an automated alert from SafeGate Emergency Response System</p>
                <p style="margin: 10px 0 0;">Panimalar Engineering College • ${new Date().getFullYear()}</p>
            </div>
        </div>
    `;
}

async function initiateEmergencyCall() {
    // Simulate emergency call
    console.log('Initiating emergency call to nearest responder...');
    return new Promise(resolve => setTimeout(resolve, 1000));
}

function startLiveLocationSharing(emergencyId) {
    if (liveSharingInterval) clearInterval(liveSharingInterval);
    
    liveSharingInterval = setInterval(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString(),
                        emergencyId: emergencyId
                    };
                    
                    // Update live location
                    console.log('Live location update:', location);
                    
                    // Update map marker
                    if (userMarker) {
                        userMarker.setLatLng([location.lat, location.lng]);
                        accuracyCircle.setLatLng([location.lat, location.lng]);
                        accuracyCircle.setRadius(location.accuracy);
                    }
                },
                null,
                { enableHighAccuracy: true }
            );
        }
    }, 10000);
}

function logEmergency(emergencyReport) {
    // Save to localStorage for offline support
    const emergencies = JSON.parse(localStorage.getItem('emergencies') || '[]');
    emergencies.push(emergencyReport);
    localStorage.setItem('emergencies', JSON.stringify(emergencies.slice(-10)));
    
    console.log('Emergency logged:', emergencyReport);
}

// ===== WOMEN SAFETY FUNCTIONS =====
function activateWomenSafety() {
    if (!userLoggedIn) {
        showToast('Please sign in to activate Women Safety', 'warning');
        openLoginModal();
        return;
    }
    
    if (confirm('Activate Women Safety SOS?\n\nThis will:\n• Immediately alert campus security\n• Start live location sharing\n• Send discreet notification\n• Continue until manually stopped\n\nPress OK to activate or Cancel to abort.')) {
        emergencyData.type = 'women';
        emergencyData.description = 'Women Safety SOS - Discreet Alert Activated';
        
        showLoading(true);
        
        setTimeout(() => {
            const emergencyReport = {
                type: 'women',
                typeName: 'Women Safety SOS',
                location: userLocation || { lat: CAMPUS_CENTER[0], lng: CAMPUS_CENTER[1] },
                description: 'Women Safety SOS - Discreet Alert',
                timestamp: new Date().toISOString(),
                user: {
                    name: localStorage.getItem('userName') || 'Anonymous',
                    email: localStorage.getItem('userEmail') || 'Unknown'
                },
                status: 'active',
                id: generateEmergencyId()
            };
            
            sendEmergencyNotifications(emergencyReport);
            startLiveLocationSharing(emergencyReport.id);
            logEmergency(emergencyReport);
            
            showEmergencyNotification('Women Safety SOS activated! Help is on the way.');
            showLoading(false);
        }, 1000);
    }
}

// ===== NOTIFICATION FUNCTIONS =====
function showEmergencyNotification(message) {
    elements.toastMessage.textContent = message;
    elements.notificationToast.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.notificationToast.style.display = 'none';
    }, 5000);
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#06d6a0' : type === 'error' ? '#e63946' : '#2d6ae3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== DASHBOARD FUNCTIONS =====
function openDashboard() {
    elements.dashboardModal.style.display = 'flex';
    updateDashboard();
}

function closeDashboard() {
    elements.dashboardModal.style.display = 'none';
}

function updateDashboard() {
    // Get emergencies from localStorage
    const emergencies = JSON.parse(localStorage.getItem('emergencies') || '[]');
    const activeEmergencies = emergencies.filter(e => e.status === 'active');
    
    // Update stats
    document.getElementById('activeEmergencies').textContent = activeEmergencies.length;
    
    // Update emergencies list
    const emergenciesList = document.getElementById('emergenciesList');
    emergenciesList.innerHTML = '';
    
    if (emergencies.length === 0) {
        emergenciesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>No active emergencies</p>
            </div>
        `;
    } else {
        emergencies.slice(-5).reverse().forEach(emergency => {
            const emergencyEl = document.createElement('div');
            emergencyEl.className = 'emergency-item';
            emergencyEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: ${EMERGENCY_TYPES[emergency.type]?.color || '#64748b'};
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                    ">
                        <i class="${EMERGENCY_TYPES[emergency.type]?.icon || 'fas fa-exclamation-triangle'}"></i>
                    </div>
                    <div style="flex: 1;">
                        <strong>${emergency.typeName}</strong>
                        <p style="margin: 5px 0; color: #64748b; font-size: 14px;">
                            ${new Date(emergency.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <span style="
                        background: ${emergency.status === 'active' ? 'rgba(230, 57, 70, 0.1)' : 'rgba(6, 214, 160, 0.1)'};
                        color: ${emergency.status === 'active' ? '#e63946' : '#06d6a0'};
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                    ">
                        ${emergency.status === 'active' ? 'Active' : 'Resolved'}
                    </span>
                </div>
            `;
            emergenciesList.appendChild(emergencyEl);
        });
    }
}

// ===== UTILITY FUNCTIONS =====
function showLoading(show) {
    if (show) {
        document.body.style.cursor = 'wait';
        document.body.style.pointerEvents = 'none';
    } else {
        document.body.style.cursor = '';
        document.body.style.pointerEvents = '';
    }
}

function simulateProximityAlert() {
    if (Math.random() > 0.7) {
        const distance = Math.floor(Math.random() * 100) + 10;
        if (distance <= 50) {
            elements.distanceAlert.textContent = `${distance}m away`;
            elements.proximityAlert.style.display = 'flex';
            
            setTimeout(() => {
                elements.proximityAlert.style.display = 'none';
            }, 5000);
            
            // Vibrate on mobile
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }
}

function updateLiveStatus() {
    const updatesList = document.getElementById('updatesList');
    const updates = [
        'Security patrol active in Zone A',
        'Medical team available at clinic',
        'Fire extinguishers checked',
        'Emergency exits clear',
        'All systems operational'
    ];
    
    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    
    const updateItem = document.createElement('div');
    updateItem.className = 'update-item';
    updateItem.innerHTML = `
        <div class="update-icon success">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="update-content">
            <p class="update-message">${randomUpdate}</p>
            <small class="update-time">Just now</small>
        </div>
    `;
    
    updatesList.insertBefore(updateItem, updatesList.firstChild);
    
    if (updatesList.children.length > 5) {
        updatesList.removeChild(updatesList.lastChild);
    }
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // SOS Button
    elements.sosButton.addEventListener('click', openEmergencyModal);
    
    // Close Modal
    elements.closeModal.addEventListener('click', closeEmergencyModal);
    
    // Women Safety Button
    elements.womenSafetyBtn.addEventListener('click', activateWomenSafety);
    
    // Login/Signup
    elements.loginBtn.addEventListener('click', () => {
        elements.loginModal.style.display = 'flex';
    });
    
    elements.closeLogin.addEventListener('click', () => {
        elements.loginModal.style.display = 'none';
    });
    
    elements.googleLogin.addEventListener('click', handleGoogleLogin);
    
    // Dashboard
    elements.dashboardBtn.addEventListener('click', openDashboard);
    elements.closeDashboard.addEventListener('click', closeDashboard);
    
    // Emergency Log
    elements.emergencyLogBtn.addEventListener('click', () => {
        openDashboard();
        showToast('Emergency history loaded', 'info');
    });
    
    // Map Controls
    elements.locateBtn.addEventListener('click', () => {
        if (userLocation) {
            map.setView([userLocation.lat, userLocation.lng], 17);
            showToast('Map centered on your location', 'info');
        }
    });
    
    elements.zoomIn.addEventListener('click', () => map.zoomIn());
    elements.zoomOut.addEventListener('click', () => map.zoomOut());
    
    // Emergency Type Selection
    elements.emergencyTypeCards.forEach(card => {
        card.addEventListener('click', () => {
            elements.emergencyTypeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            emergencyData.type = card.dataset.type;
        });
    });
    
    // Quick Emergency Buttons
    elements.quickEmergencyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            emergencyData.type = btn.dataset.type;
            openEmergencyModal();
        });
    });
    
    // Location Cards - Open Google Maps
    elements.locationCards.forEach(card => {
        card.addEventListener('click', () => {
            const coords = card.dataset.location.split(',').map(Number);
            const name = card.dataset.name;
            const location = CAMPUS_LOCATIONS[name];
            if (location && location.googleMaps) {
                window.open(location.googleMaps, '_blank');
            }
        });
    });
    
    // Location Action Buttons
    elements.locationActions.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.location-card');
            const name = card.dataset.name;
            const location = CAMPUS_LOCATIONS[name];
            if (location && location.googleMaps) {
                window.open(location.googleMaps, '_blank');
            }
        });
    });
    
    // Step Navigation
    elements.nextButtons.step1.addEventListener('click', () => goToNextStep());
    elements.nextButtons.step2.addEventListener('click', () => goToNextStep());
    elements.nextButtons.step3.addEventListener('click', () => goToNextStep());
    
    elements.backButtons.step2.addEventListener('click', () => goToPreviousStep());
    elements.backButtons.step3.addEventListener('click', () => goToPreviousStep());
    elements.backButtons.step4.addEventListener('click', () => goToPreviousStep());
    
    // Emergency Submission
    elements.submitEmergency.addEventListener('click', submitEmergency);
    
    // Close Success
    elements.closeSuccess.addEventListener('click', closeEmergencyModal);
    
    // Refresh Location
    elements.refreshLocation.addEventListener('click', getUserLocation);
    
    // Character Count
    elements.emergencyDescription.addEventListener('input', () => {
        const count = elements.emergencyDescription.value.length;
        elements.charCount.textContent = count;
        
        if (count > 450) {
            elements.charCount.style.color = '#e63946';
        } else if (count > 300) {
            elements.charCount.style.color = '#ff6b35';
        } else {
            elements.charCount.style.color = '#06d6a0';
        }
    });
    
    // Modal Dragging
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    elements.draggableHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = elements.draggableModal.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        elements.draggableModal.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        elements.draggableModal.style.left = (e.clientX - dragOffset.x) + 'px';
        elements.draggableModal.style.top = (e.clientY - dragOffset.y) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        elements.draggableModal.style.cursor = '';
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === elements.emergencyModal) {
            closeEmergencyModal();
        }
        if (e.target === elements.loginModal) {
            elements.loginModal.style.display = 'none';
        }
        if (e.target === elements.dashboardModal) {
            closeDashboard();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key closes modals
        if (e.key === 'Escape') {
            if (elements.emergencyModal.style.display === 'flex') closeEmergencyModal();
            if (elements.loginModal.style.display === 'flex') elements.loginModal.style.display = 'none';
            if (elements.dashboardModal.style.display === 'flex') closeDashboard();
        }
        
        // Spacebar for SOS (with Ctrl)
        if (e.key === ' ' && e.ctrlKey) {
            e.preventDefault();
            openEmergencyModal();
        }
        
        // Alt+W for Women Safety
        if (e.key === 'w' && e.altKey) {
            e.preventDefault();
            activateWomenSafety();
        }
    });
}

// ===== LOGIN FUNCTIONS =====
function checkUserLogin() {
    const user = JSON.parse(localStorage.getItem('safeGateUser'));
    if (user) {
        userLoggedIn = true;
        updateUserUI(user);
    }
}

function updateUserUI(user) {
    elements.loginBtn.innerHTML = `<i class="fab fa-google"></i> <span>${user.name}</span>`;
    elements.userAvatar.innerHTML = `<i class="fas fa-user-check"></i>`;
    elements.userAvatar.title = user.name;
}

function handleGoogleLogin() {
    showLoading(true);
    
    // Simulate Google login
    setTimeout(() => {
        const user = {
            name: 'Sunil Kumar B',
            email: 'raghulvarathan06@gmail.com'
        };
        
        localStorage.setItem('safeGateUser', JSON.stringify(user));
        userLoggedIn = true;
        updateUserUI(user);
        
        elements.loginModal.style.display = 'none';
        showLoading(false);
        showToast(`Welcome ${user.name}!`, 'success');
    }, 1500);
}

// Initialize the application
initApplication();