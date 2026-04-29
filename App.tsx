import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AllMeetings from './pages/AllMeetings';
import NewMeeting from './pages/NewMeeting';
import MeetingDetails from './pages/MeetingDetails';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Checkout from './pages/Checkout';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import { useAuth } from './context/AuthContext';

const AppContent = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  const rawHash = window.location.hash;
  if (rawHash.includes('access_token') && rawHash.includes('type=recovery')) {
    const p = new URLSearchParams(rawHash.substring(1));
    const at = p.get('access_token') || '';
    const rt = p.get('refresh_token') || '';
    if (at) {
      sessionStorage.setItem('reset_access_token', at);
      sessionStorage.setItem('reset_refresh_token', rt);
      sessionStorage.setItem('is_password_reset', 'true');
      window.history.replaceState(
        null, '',
        window.location.origin + '/#/reset-password'
      );
    }
  }

  const isPasswordReset = sessionStorage.getItem('is_password_reset') === 'true';
  const isPublic = isPasswordReset
    || ['/', '/login', '/signup', '/reset-password', '/about'].includes(location.pathname)
    || (!user && ['/pricing', '/checkout'].includes(location.pathname));

  if (loading) {
    return <div className="h-screen w-full bg-background-light dark:bg-background-dark" />;
  }

  if (isPublic) {
    if (user && ['/', '/login', '/signup'].includes(location.pathname) && !isPasswordReset) {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <PublicLayout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </PublicLayout>
    );
  }

  if (!user && location.pathname !== '/reset-password') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meetings" element={<AllMeetings />} />
        <Route path="/meetings/new" element={<NewMeeting />} />
        <Route path="/meetings/:id" element={<MeetingDetails />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;