// src/Dashboard.js
import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function Dashboard() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload(); // refresh to go back to login
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎓 Student Dashboard</h2>
      {userData ? (
        <div>
          <p><b>Email:</b> {userData.email}</p>
          <p><b>Role:</b> {userData.role}</p>

          <h3>📚 Your Courses:</h3>
        <ul>
          {userData.courses && userData.courses.map((course, index) => (
            <li key={index}>{course}</li>
          ))}
        </ul>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
