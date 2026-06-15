/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useStore } from "./store/useStore";
import { Store, AlertTriangle } from "lucide-react";

// Pages placeholders
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import MenuQR from "./pages/MenuQR";
import OwnerLayout from "./layouts/OwnerLayout";
import Admin from "./pages/Admin";

export default function App() {
  const { user, userAccess, isAdmin, loading, checkUser } = useAuthStore();
  const { loadData, isLoading: isDataLoading } = useStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (!loading && user) {
      loadData(user.id);
    } else if (!loading && !user) {
      useStore.setState({ isLoading: false }); // Drop loading mask if landing page
    }
  }, [user, loading, loadData]);

  if (loading || isDataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F3F4F6] text-slate-500 font-bold">
        Loading Workspace...
      </div>
    );
  }

  const isServicePaused =
    userAccess &&
    (!userAccess.is_active ||
      (userAccess.service_end_time &&
        new Date(userAccess.service_end_time) < new Date()));

  // Service Paused Overlay Component
  if (user && isServicePaused && !isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F3F4F6] text-slate-900 px-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Service Paused</h1>
        <p className="text-slate-500 max-w-md mb-6">
          Your workspace has been temporarily paused or your billing cycle has
          ended. Please contact the administrator to resume your services.
        </p>
        <button
          className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
          onClick={() => useAuthStore.getState().signOut()}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />

        {/* Public QR Menu Route  */}
        <Route path="/menu/:restaurantName" element={<MenuQR />} />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={isAdmin ? <Admin /> : <Navigate to="/" />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            user ? (
              !isAdmin ? (
                <OwnerLayout />
              ) : (
                <Navigate to="/admin" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="menu" element={<Menu />} />
          <Route path="orders" element={<Orders />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
