import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import * as XLSX from "xlsx";
import { parseGoogleSheetsData } from "./src/utils/googleSheetsParser.js";

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
const db = getDatabase(app);

async function syncSheets() {
  console.log("Fetching Google Sheets...");
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1oWYPF62vl06oSQ2nx9pakErCIUTj6Rdu-M6wNn8Io60/export?format=csv&gid=351297083";
  const res = await fetch(sheetUrl);
  const csvText = await res.text();
  
  const wb = XLSX.read(csvText, { type: 'string' });
  const worksheet = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  const newParsedRecords = parseGoogleSheetsData(rawData);
  console.log(`Parsed ${newParsedRecords.length} records from Google Sheets.`);

  // Get existing points
  console.log("Fetching existing records from Firebase...");
  const snapshot = await get(ref(db, 'pointsRecords'));
  let existingRecords = snapshot.val() || [];
  
  // existingRecords in Firebase might be an object if pushed with push(), but it is an array here
  if (!Array.isArray(existingRecords)) {
      existingRecords = Object.values(existingRecords);
  }
  
  // Merge, avoiding duplicates by raw_line and student_name
  const existingKeys = new Set(existingRecords.map(r => `${r.session_id}_${r.student_name}_${r.points}`));
  let added = 0;
  
  for (const r of newParsedRecords) {
    const key = `${r.session_id}_${r.student_name}_${r.points}`;
    if (!existingKeys.has(key)) {
      existingRecords.push(r);
      added++;
    }
  }

  if (added > 0) {
    console.log(`Pushing ${added} new records to Firebase...`);
    await set(ref(db, 'pointsRecords'), existingRecords);
    console.log("Success!");
  } else {
    console.log("No new records to add.");
  }
  
  process.exit(0);
}

syncSheets().catch(console.error);
