// Firebase Configuration for SafeGate 2.0

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "safegate-panimalar.firebaseapp.com",
    projectId: "safegate-panimalar",
    storageBucket: "safegate-panimalar.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
let app, auth, db, storage;

try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Enable offline persistence
    db.enablePersistence()
        .catch((err) => {
            console.error("Firebase persistence failed:", err);
        });
    
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
    console.log("Using localStorage fallback");
}

// Authentication Service
class AuthService {
    // Sign in with Google
    static async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Save user data to Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                phoneNumber: user.phoneNumber || '',
                campusId: this.generateCampusId(user.email),
                role: 'student',
                emergencyContacts: [
                    { name: 'Emergency Contact 1', phone: '+917448325875' },
                    { name: 'Emergency Contact 2', phone: '+919445200978' }
                ],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                settings: {
                    notifications: true,
                    locationSharing: true,
                    soundEnabled: true,
                    theme: 'light'
                }
            }, { merge: true });
            
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    campusId: this.generateCampusId(user.email)
                }
            };
        } catch (error) {
            console.error("Google sign-in error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Sign in with email/password
    static async signInWithEmail(email, password) {
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            const user = result.user;
            
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email
                }
            };
        } catch (error) {
            console.error("Email sign-in error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Sign up with email/password
    static async signUpWithEmail(email, password, userData) {
        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            const user = result.user;
            
            // Save additional user data to Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                name: userData.name,
                phoneNumber: userData.phone || '',
                campusId: this.generateCampusId(user.email),
                role: 'student',
                department: userData.department || '',
                year: userData.year || '',
                emergencyContacts: userData.emergencyContacts || [
                    { name: 'Emergency Contact 1', phone: '+917448325875' },
                    { name: 'Emergency Contact 2', phone: '+919445200978' }
                ],
                medicalInfo: userData.medicalInfo || {},
                settings: {
                    notifications: true,
                    locationSharing: true,
                    soundEnabled: true,
                    theme: 'light'
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Send welcome email
            await this.sendWelcomeEmail(user.email, userData.name);
            
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    name: userData.name
                }
            };
        } catch (error) {
            console.error("Sign up error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Sign out
    static async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error("Sign out error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get current user
    static getCurrentUser() {
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            });
        });
    }
    
    // Send welcome email
    static async sendWelcomeEmail(email, name) {
        try {
            // This would integrate with SendGrid/EmailJS in production
            const emailData = {
                to: email,
                subject: 'Welcome to SafeGate 2.0 - Panimalar Emergency Response',
                html: `
                    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #4361ee, #7209b7); padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0;">Welcome to SafeGate 2.0!</h1>
                        </div>
                        <div style="padding: 30px; background: white;">
                            <p>Dear ${name},</p>
                            <p>Welcome to SafeGate 2.0 - the ultimate campus emergency response system for Panimalar Engineering College.</p>
                            <p>Your safety is our priority. With SafeGate, you can:</p>
                            <ul>
                                <li>Report emergencies instantly with one click</li>
                                <li>Get immediate assistance from campus responders</li>
                                <li>Share your live location during emergencies</li>
                                <li>Access discreet Women Safety SOS</li>
                                <li>Navigate to key campus locations</li>
                            </ul>
                            <p><strong>Emergency Contacts:</strong><br>
                            • Campus Security: +91 7448325875<br>
                            • Medical Emergency: +91 9445200978</p>
                            <p>Stay safe,<br>
                            <strong>SafeGate Team</strong><br>
                            Panimalar Engineering College</p>
                        </div>
                    </div>
                `
            };
            
            console.log("Welcome email would be sent:", emailData);
            return { success: true };
        } catch (error) {
            console.error("Send welcome email error:", error);
            return { success: false, error: error.message };
        }
    }
    
    // Generate campus ID from email
    static generateCampusId(email) {
        if (!email) return 'GUEST';
        
        // Extract roll number from Panimalar email format
        const match = email.match(/(\d{2}[a-zA-Z]{2,3}\d{3,4})@panimalar\.edu\.in/i);
        if (match) {
            return match[1].toUpperCase();
        }
        
        // Fallback: use first part of email
        return email.split('@')[0].toUpperCase();
    }
}

// Database Service
class DatabaseService {
    // Report emergency to Firestore
    static async reportEmergency(emergencyData, user) {
        try {
            const emergencyRef = db.collection('emergencies').doc();
            const emergencyId = emergencyRef.id;
            
            const emergencyDoc = {
                id: emergencyId,
                type: emergencyData.type,
                typeName: emergencyData.typeName,
                location: {
                    latitude: emergencyData.location.lat,
                    longitude: emergencyData.location.lng,
                    accuracy: emergencyData.location.accuracy
                },
                description: emergencyData.description,
                reporter: {
                    uid: user.uid,
                    name: user.name,
                    campusId: user.campusId,
                    phone: user.phoneNumber || ''
                },
                status: 'active',
                priority: this.getEmergencyPriority(emergencyData.type),
                assignedTo: null,
                responders: [],
                timeline: [{
                    action: 'reported',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    by: user.name
                }],
                notifications: {
                    sms: emergencyData.notifications.sms,
                    email: emergencyData.notifications.email,
                    call: emergencyData.notifications.call
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await emergencyRef.set(emergencyDoc);
            
            // Update user's emergency history
            await db.collection('users').doc(user.uid).update({
                emergencyHistory: firebase.firestore.FieldValue.arrayUnion(emergencyId)
            });
            
            // Send real-time notifications to responders
            await this.notifyResponders(emergencyDoc);
            
            return {
                success: true,
                emergencyId: emergencyId,
                data: emergencyDoc
            };
        } catch (error) {
            console.error("Report emergency error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Update live location
    static async updateLiveLocation(userId, location, emergencyId) {
        try {
            const locationUpdate = {
                userId: userId,
                latitude: location.lat,
                longitude: location.lng,
                accuracy: location.accuracy,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                emergencyId: emergencyId
            };
            
            // Update emergency document with latest location
            if (emergencyId) {
                await db.collection('emergencies').doc(emergencyId).update({
                    'location.current': {
                        latitude: location.lat,
                        longitude: location.lng,
                        accuracy: location.accuracy,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Add to location history
            await db.collection('locations').add(locationUpdate);
            
            return { success: true };
        } catch (error) {
            console.error("Update location error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get active emergencies
    static async getActiveEmergencies() {
        try {
            const snapshot = await db.collection('emergencies')
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            
            const emergencies = [];
            snapshot.forEach(doc => {
                emergencies.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return {
                success: true,
                emergencies: emergencies
            };
        } catch (error) {
            console.error("Get emergencies error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Update emergency status
    static async updateEmergencyStatus(emergencyId, status, userId, notes = '') {
        try {
            const updateData = {
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (status === 'assigned') {
                updateData.assignedTo = userId;
            } else if (status === 'resolved') {
                updateData.resolvedAt = firebase.firestore.FieldValue.serverTimestamp();
                updateData.resolvedBy = userId;
            }
            
            await db.collection('emergencies').doc(emergencyId).update(updateData);
            
            // Add to timeline
            await db.collection('emergencies').doc(emergencyId).update({
                timeline: firebase.firestore.FieldValue.arrayUnion({
                    action: status,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    by: userId,
                    notes: notes
                })
            });
            
            return { success: true };
        } catch (error) {
            console.error("Update status error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get emergency history for user
    static async getUserEmergencyHistory(userId) {
        try {
            const snapshot = await db.collection('emergencies')
                .where('reporter.uid', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            
            const emergencies = [];
            snapshot.forEach(doc => {
                emergencies.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return {
                success: true,
                emergencies: emergencies
            };
        } catch (error) {
            console.error("Get history error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get responders
    static async getResponders() {
        try {
            const snapshot = await db.collection('responders')
                .where('status', '==', 'active')
                .get();
            
            const responders = [];
            snapshot.forEach(doc => {
                responders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return {
                success: true,
                responders: responders
            };
        } catch (error) {
            console.error("Get responders error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Notify responders
    static async notifyResponders(emergency) {
        try {
            // Get active responders for this emergency type
            const respondersSnapshot = await db.collection('responders')
                .where('status', '==', 'active')
                .where('types', 'array-contains', emergency.type)
                .get();
            
            const notifications = [];
            respondersSnapshot.forEach(doc => {
                const responder = doc.data();
                
                // Create notification
                const notification = {
                    type: 'emergency_alert',
                    emergencyId: emergency.id,
                    emergencyType: emergency.type,
                    priority: emergency.priority,
                    location: emergency.location,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                };
                
                // Add to responder's notifications
                db.collection('responders').doc(doc.id).update({
                    notifications: firebase.firestore.FieldValue.arrayUnion(notification)
                });
                
                notifications.push({
                    responderId: doc.id,
                    ...notification
                });
            });
            
            // Send push notifications (FCM integration would go here)
            await this.sendPushNotifications(notifications);
            
            return { success: true, notified: notifications.length };
        } catch (error) {
            console.error("Notify responders error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Send push notifications
    static async sendPushNotifications(notifications) {
        // Firebase Cloud Messaging integration would go here
        console.log("Push notifications to send:", notifications.length);
        return { success: true };
    }
    
    // Get emergency priority
    static getEmergencyPriority(type) {
        const priorities = {
            medical: 'high',
            fire: 'critical',
            chemical: 'high',
            natural: 'high',
            security: 'high',
            harassment: 'critical',
            accident: 'medium',
            other: 'low'
        };
        return priorities[type] || 'medium';
    }
}

// Real-time Service
class RealtimeService {
    constructor() {
        this.listeners = new Map();
    }
    
    // Listen to active emergencies
    listenToEmergencies(callback) {
        const unsubscribe = db.collection('emergencies')
            .where('status', '==', 'active')
            .onSnapshot(snapshot => {
                const emergencies = [];
                snapshot.forEach(doc => {
                    emergencies.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(emergencies);
            }, error => {
                console.error("Emergency listener error:", error);
                callback([], error);
            });
        
        this.listeners.set('emergencies', unsubscribe);
        return unsubscribe;
    }
    
    // Listen to emergency updates
    listenToEmergency(emergencyId, callback) {
        const unsubscribe = db.collection('emergencies')
            .doc(emergencyId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                }
            }, error => {
                console.error("Emergency update listener error:", error);
                callback(null, error);
            });
        
        this.listeners.set(`emergency_${emergencyId}`, unsubscribe);
        return unsubscribe;
    }
    
    // Remove all listeners
    removeAllListeners() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
    }
}

// Storage Service
class StorageService {
    // Upload emergency photo
    static async uploadEmergencyPhoto(file, emergencyId, userId) {
        try {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`emergencies/${emergencyId}/${Date.now()}_${file.name}`);
            
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // Update emergency document with photo URL
            await db.collection('emergencies').doc(emergencyId).update({
                photos: firebase.firestore.FieldValue.arrayUnion({
                    url: downloadURL,
                    uploadedBy: userId,
                    uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
            });
            
            return {
                success: true,
                url: downloadURL
            };
        } catch (error) {
            console.error("Upload photo error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Upload user profile picture
    static async uploadProfilePicture(file, userId) {
        try {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`profiles/${userId}/profile.jpg`);
            
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            // Update user document
            await db.collection('users').doc(userId).update({
                photoURL: downloadURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update auth profile
            await auth.currentUser.updateProfile({
                photoURL: downloadURL
            });
            
            return {
                success: true,
                url: downloadURL
            };
        } catch (error) {
            console.error("Upload profile picture error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Analytics Service
class AnalyticsService {
    static logEvent(eventName, eventParams = {}) {
        // Firebase Analytics integration would go here
        console.log(`[Analytics] ${eventName}:`, eventParams);
    }
    
    static setUserProperties(userId, properties = {}) {
        console.log(`[Analytics] Set user properties for ${userId}:`, properties);
    }
}

// Export services
window.FirebaseServices = {
    Auth: AuthService,
    Database: DatabaseService,
    Storage: StorageService,
    Realtime: new RealtimeService(),
    Analytics: AnalyticsService,
    
    // Check if Firebase is initialized
    isInitialized: () => !!app,
    
    // Get Firebase app instance
    getApp: () => app,
    
    // Initialize services
    init: () => {
        if (!app) {
            console.warn("Firebase not initialized. Using localStorage fallback.");
            return false;
        }
        return true;
    }
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    if (FirebaseServices.isInitialized()) {
        console.log("Firebase services ready");
        
        // Check auth state
        FirebaseServices.Auth.getCurrentUser().then(user => {
            if (user) {
                console.log("User is signed in:", user.email);
                
                // Set analytics user ID
                FirebaseServices.Analytics.setUserProperties(user.uid, {
                    campus_id: FirebaseServices.Auth.generateCampusId(user.email),
                    role: 'student'
                });
            }
        });
    }
});