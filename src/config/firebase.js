import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// THÔNG BÁO CHO NGƯỜI DÙNG:
// Bạn cần thay thế thông tin cấu hình bên dưới bằng cấu hình từ Project Firebase của bạn.
// Hướng dẫn:
// 1. Vào https://console.firebase.google.com/, tạo một Project mới.
// 2. Chọn "Realtime Database" ở menu trái, nhấn "Create Database" (chọn Test Mode).
// 3. Chọn biểu tượng </> (Web) ở trang chủ Project Settings để tạo app web.
// 4. Copy đoạn mã firebaseConfig dán vào bên dưới.
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

let app, database;

try {
  // Chỉ khởi tạo Firebase nếu có config thật (không phải placeholder)
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("ĐIỀN_API_KEY")) {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("⚠️ Firebase chưa được cấu hình. Hệ thống sẽ tạm thời dùng localStorage (chế độ Offline).");
  }
} catch (error) {
  console.error("Lỗi khởi tạo Firebase:", error);
}

export { database };
