/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useStore } from './store/useStore';

// Pages placeholders
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import MenuQR from './pages/MenuQR';
import OwnerLayout from './layouts/OwnerLayout';

export default function App() {
  const { user, loading, checkUser } = useAuthStore();
  const { loadData, isLoading: isDataLoading } = useStore();

  useEffect(() => {
    checkUser();
    loadData();
  }, [checkUser, loadData]);

  if (loading || isDataLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        {/* Public QR Menu Route  */}
        <Route path="/menu/:restaurantName" element={<MenuQR />} />

        {/* Protected Routes */}
        <Route path="/" element={user ? <OwnerLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="menu" element={<Menu />} />
          <Route path="orders" element={<Orders />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
