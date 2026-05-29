/**
 * ============================================================
 * SIC 4.0
 * Entry point for rendering the React application.
 * 
 * Copyright (C) 2025 Team Greenarae
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * See the LICENSE file in the project root for more information.
 * 
 * 
 * File: main.tsx
 * ============================================================
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import TradingPage from "./Pages/TradingPage";
import LoginPage from "./Pages/LoginPage";
import AdminPage from "./Pages/AdminPage";
import { ForbiddenPage, NotFoundPage, InternalServerErrorPage, TooManyRequestsPage } from "./Pages/Error/Error";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          {/* For All */}
          <Route path="/" element={<LoginPage />} />

          {/* For Users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/trading" element={<TradingPage />} />
          </Route>

          {/* For Admin */}
          <Route element={<ProtectedRoute isAdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Error Pages */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/429" element={<TooManyRequestsPage />} />
          <Route path="/500" element={<InternalServerErrorPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  </StrictMode>
);