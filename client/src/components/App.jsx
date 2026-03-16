import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { supabase } from '../supabaseClient';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Layout from './pages/Layout';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil session saat pertama kali app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Pasang listener untuk perubahan status auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tampilkan loading sebentar saat mengecek session agar tidak langsung redirect ke login
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const ProtectedRoute = ({ children }) => {
    return session ? <>{children}</> : <Navigate to="/login" />;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={session ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/register"
            element={session ? <Navigate to="/" /> : <Register />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Transactions />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout onLogout={handleLogout}>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}