import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyDy39uvBABW_L2xmkiLcF7fBkOuHbI3Rb4",
  authDomain: "vinranking-8d26f.firebaseapp.com",
  projectId: "vinranking-8d26f",
  storageBucket: "vinranking-8d26f.firebasestorage.app",
  messagingSenderId: "410246375536",
  appId: "1:410246375536:web:990a0f64bdcb6c6aeeecb5",
  measurementId: "G-QFRMVN1GCJ",
  databaseURL: "https://vinranking-8d26f-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const initialData = JSON.parse(fs.readFileSync('./src/data/initialData.json', 'utf8'));

async function restore() {
  try {
    console.log("Restoring students...");
    await set(ref(database, 'students'), initialData.students);
    
    console.log("Restoring pointsRecords...");
    await set(ref(database, 'pointsRecords'), initialData.points_records || []);
    
    console.log("Restoring sessions...");
    await set(ref(database, 'sessions'), initialData.sessions || []);
    
    console.log("Data restored successfully to Firebase!");
    process.exit(0);
  } catch (error) {
    console.error("Error restoring data:", error);
    process.exit(1);
  }
}

restore();
