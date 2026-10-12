/**
 * Firebase Firestore Single Source of Truth
 * Synchronizes Director and 2 Responsables: Meddeb Naoufel & Meddeb Hani
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
    console.log("🔥 Firebase Firestore connected: liege-immobilier");
  } catch (err) {
    console.warn("Firebase init error:", err);
  }
}

// Données initiales complètes réelles (Meddeb Naoufel & Meddeb Hani)
const initialProjectData = {
  responsables: {
    naoufel: {
      name: "Meddeb Naoufel",
      site: "Chantier A (Résidence Liège)",
      received: 850000,
      materials: [
        { id: 1, title: "Ciment Lafarge Chiffa (120 Sacs)", supplier: "Quincaillerie Moderne", time: "08:30", amount: 102000 },
        { id: 2, title: "Briques Rouges 8 Trous (2500 U)", supplier: "Briqueterie de l'Est", time: "10:15", amount: 150000 },
        { id: 3, title: "Fer à béton FeE500 (2 Tonnes)", supplier: "Dépôt Métaux Annaba", time: "Hier 14:00", amount: 240000 },
        { id: 4, title: "Plâtre de construction (40 Sacs)", supplier: "Comptoir Bâtiment", time: "Hier 16:30", amount: 28000 }
      ],
      payouts: [
        { id: 1, worker: "Karim Bensalem (Coffreur)", time: "Aujourd'hui à 17:30", amount: 45000, note: "Journée + Heures supp" },
        { id: 2, worker: "Farid Touati (Ferrailleur)", time: "Aujourd'hui à 17:35", amount: 50000, note: "Forfait ferraillage poteaux" },
        { id: 3, worker: "Youcef Mansouri (Manœuvre)", time: "Aujourd'hui à 17:40", amount: 35000, note: "Paiement semaine" },
        { id: 4, worker: "Ahmed Kaci (Manœuvre)", time: "Aujourd'hui à 17:45", amount: 35000, note: "Paiement semaine" }
      ],
      workers: [
        { id: 1, name: "Karim Bensalem", role: "Coffreur Boiseur", time: "07:15", status: "present", pay: 4500 },
        { id: 2, name: "Farid Touati", role: "Ferrailleur", time: "07:20", status: "present", pay: 5000 },
        { id: 3, name: "Bilal Khelifi", role: "Électricien Bâtiment", time: "--:--", status: "absent", pay: 0 },
        { id: 4, name: "Youcef Mansouri", role: "Manœuvre Qualifié", time: "07:05", status: "present", pay: 3500 },
        { id: 5, name: "Ahmed Kaci", role: "Manœuvre", time: "07:08", status: "present", pay: 3500 },
        { id: 6, name: "Djamel Zouaoui", role: "Maçon Finition", time: "07:30", status: "present", pay: 4500 }
      ]
    },
    hani: {
      name: "Meddeb Hani",
      site: "Chantier B (Tour Annaba)",
      received: 900000,
      materials: [
        { id: 1, title: "Sable Oued Souf (3 Camions 16m³)", supplier: "Carrière Nord", time: "09:00", amount: 135000 },
        { id: 2, title: "Gravier Concassé 15/25 (2 Camions)", supplier: "Carrière Nord", time: "11:00", amount: 90000 },
        { id: 3, title: "Tubes PVC & Raccords Assainissement", supplier: "Sanitaire Plus", time: "14:20", amount: 145000 },
        { id: 4, title: "Gants, Casques et Outillage Sécurité", supplier: "Sécurité BTP", time: "15:45", amount: 32000 }
      ],
      payouts: [
        { id: 1, worker: "Sofiane Hamidi (Maçon Chef)", time: "Aujourd'hui à 17:15", amount: 65000, note: "Paiement brique façade" },
        { id: 2, worker: "Amine Zitouni (Plâtrier)", time: "Aujourd'hui à 17:25", amount: 60000, note: "Avance enduit intérieur" },
        { id: 3, worker: "Groupe Échafaudeurs (3 Ouvriers)", time: "Aujourd'hui à 18:00", amount: 80000, note: "Montage échafaudage nord" },
        { id: 4, worker: "Rabah Bouzid (Grutier)", time: "Aujourd'hui à 18:15", amount: 50000, note: "Paiement opérateur grue" }
      ],
      workers: [
        { id: 7, name: "Sofiane Hamidi", role: "Maçon Chef", time: "07:10", status: "present", pay: 6500 },
        { id: 8, name: "Amine Zitouni", role: "Plâtrier / Staffeur", time: "07:45", status: "late", pay: 4500 },
        { id: 9, name: "Rabah Bouzid", role: "Grutier", time: "06:50", status: "present", pay: 7000 },
        { id: 10, name: "Walid Cherif", role: "Plombier Sanitaire", time: "--:--", status: "absent", pay: 0 },
        { id: 11, name: "Samir Boumaza", role: "Manœuvre", time: "07:15", status: "present", pay: 3500 },
        { id: 12, name: "Tarek Mansour", role: "Peintre Bâtiment", time: "07:22", status: "present", pay: 4000 }
      ]
    }
  }
};

/**
 * Universal Database Bridge
 * Automatically saves and reads to/from Cloud Firestore and LocalStorage
 */
const DB = {
  async getProjectData() {
    if (db) {
      try {
        const docRef = db.collection('liege_data').doc('master');
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const val = docSnap.data().payload;
          localStorage.setItem('liege_master', JSON.stringify(val));
          return val;
        } else {
          // Initialize remote database with real data
          await docRef.set({
            payload: initialProjectData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          localStorage.setItem('liege_master', JSON.stringify(initialProjectData));
          return initialProjectData;
        }
      } catch (err) {
        console.warn("Firestore read error, using local fallback:", err);
      }
    }
    // Fallback: LocalStorage
    try {
      const local = localStorage.getItem('liege_master');
      return local ? JSON.parse(local) : initialProjectData;
    } catch (e) {
      return initialProjectData;
    }
  },

  async saveProjectData(data) {
    try {
      localStorage.setItem('liege_master', JSON.stringify(data));
    } catch (e) {}

    if (db) {
      try {
        await db.collection('liege_data').doc('master').set({
          payload: data,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.error("Firestore write error:", err);
      }
    }
  },

  subscribeProject(onUpdate) {
    if (db) {
      return db.collection('liege_data').doc('master').onSnapshot((doc) => {
        if (doc.exists) {
          const val = doc.data().payload;
          try {
            localStorage.setItem('liege_master', JSON.stringify(val));
          } catch (e) {}
          onUpdate(val);
        }
      }, (err) => {
        console.warn("Snapshot error:", err);
      });
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'liege_master') {
        try {
          onUpdate(JSON.parse(e.newValue));
        } catch (err) {}
      }
    });
    return () => {};
  }
};
