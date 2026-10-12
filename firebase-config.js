/**
 * Firebase Realtime Configuration & Database Bridge
 * Connected to Firebase Firestore Project: liege-immobilier
 */

const firebaseConfig = {
  apiKey: "AIzaSyChA6zR_W4UglvzD9e0n6XfA38WFUavk34",
  authDomain: "liege-immobilier.firebaseapp.com",
  projectId: "liege-immobilier",
  storageBucket: "liege-immobilier.firebasestorage.app",
  messagingSenderId: "474614319019",
  appId: "1:474614319019:web:1527accb8c3b2fc539f4ee",
  measurementId: "G-M1RKLPPV1Z"
};

let db = null;

if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    console.log("🔥 Firebase Firestore connected successfully to project: liege-immobilier");
  } catch (err) {
    console.warn("Firebase init error, using LocalStorage fallback:", err);
  }
} else {
  console.warn("Firebase SDK not loaded, using LocalStorage fallback.");
}

/**
 * Universal Database Adapter
 * Persists data to Firebase Cloud and syncs in Realtime across all devices!
 */
const DB = {
  // 1. Get Initial Data
  async getData(key, defaultValue) {
    if (db) {
      try {
        const docRef = db.collection('liege_data').doc(key);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          return docSnap.data().payload;
        } else {
          // Initialize doc in Firestore with default data
          await docRef.set({
            payload: defaultValue,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          return defaultValue;
        }
      } catch (err) {
        console.warn(`Firestore read error on ${key}, falling back to local:`, err);
      }
    }

    // LocalStorage Fallback
    try {
      const local = localStorage.getItem(`liege_${key}`);
      return local ? JSON.parse(local) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  // 2. Save Data & Sync to Cloud
  async saveData(key, value) {
    // Save to LocalStorage immediately for instant UX
    try {
      localStorage.setItem(`liege_${key}`, JSON.stringify(value));
    } catch (e) {}

    // Save to Firebase Cloud in Realtime
    if (db) {
      try {
        await db.collection('liege_data').doc(key).set({
          payload: value,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error(`Firestore write error on ${key}:`, err);
      }
    }
  },

  // 3. Realtime Listener (Temps Réel)
  subscribe(key, onUpdate) {
    if (db) {
      return db.collection('liege_data').doc(key).onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data().payload;
          try {
            localStorage.setItem(`liege_${key}`, JSON.stringify(data));
          } catch (e) {}
          onUpdate(data);
        }
      }, (err) => {
        console.warn("Snapshot listener error:", err);
      });
    }

    // Storage event listener for multi-tab fallback
    window.addEventListener('storage', (e) => {
      if (e.key === `liege_${key}`) {
        try {
          onUpdate(JSON.parse(e.newValue));
        } catch (err) {}
      }
    });
    return () => {};
  }
};
