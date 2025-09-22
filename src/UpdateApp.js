// src/UpdateApp.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import UploadLearn from "./UploadLearn";
import UploadCurriculum from "./UploadCurriculum";
import UploadContent from "./UploadContent";

function UpdateApp({ token }) {
  return (
    <Routes>
      {/* Dashboard */}
      <Route
        path="/"
        element={token ? <Dashboard /> : <Navigate to="/auth" />}
      />

      {/* Upload Learn Menu */}
      <Route
        path="/upload-learn"
        element={token ? <UploadLearn /> : <Navigate to="/auth" />}
      />

      {/* Upload Curriculum */}
      <Route
        path="/upload-curriculum"
        element={token ? <UploadCurriculum /> : <Navigate to="/auth" />}
      />

      {/* Upload Content */}
      <Route
        path="/upload-content"
        element={token ? <UploadContent /> : <Navigate to="/auth" />}
      />
    </Routes>
  );
}

export default UpdateApp;
