import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Users, Settings2, Activity, Play, Pause, ChevronLeft, Eye } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { user, isAdmin, signOut } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'workspaces' | 'all-customers'>('workspaces');
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    // Fetch all user access rows
    const { data: userData, error: userError } = await supabase
      .from("user_access")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*");

    const { data: restaurantsData } = await supabase
      .from("restaurants")
      .select("*");

    if (userData) {
      setUsers(userData);
      setInvoices(invoicesData || []);
      setRestaurants(restaurantsData || []);
      setStats({
        totalUsers: userData.length,
        activeUsers: userData.filter(
          (u) =>
            u.is_active &&
            (!u.service_end_time || new Date(u.service_end_time) > new Date()),
        ).length,
        totalInvoices: (invoicesData || []).length,
      });
    } else if (userError) {
      console.error(userError);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const updateUserStatus = async (userId: string, updates: any) => {
    const { error } = await supabase
      .from("user_access")
      .update(updates)
      .eq("user_id", userId);
    if (!error) {
      fetchAdminData();
    } else {
      alert("Error updating user: " + error.message);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  // Derived Data for All Customers
  const allCustomersMap = new Map();
  invoices.forEach(inv => {
    if (!inv.customer_mobile) return;
    const key = `${inv.customer_mobile}-${inv.user_id}`;
    if (!allCustomersMap.has(key)) {
      const rest = restaurants.find(r => r.owner_id === inv.user_id);
      allCustomersMap.set(key, {
        name: inv.customer_name || 'Unknown',
        mobile: inv.customer_mobile,
        totalSpent: 0,
        lastVisit: inv.date,
        brand: rest?.restaurant_name || 'Unknown Brand',
        userId: inv.user_id
      });
    }
    const customer = allCustomersMap.get(key);
    customer.totalSpent += inv.total;
    if (new Date(inv.date) > new Date(customer.lastVisit)) {
      customer.lastVisit = inv.date;
    }
  });
  const allCustomers = Array.from(allCustomersMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

  // Derived Data for Selected Workspace
  let wsInvoices: any[] = [];
  let wsMetrics = { revenue: 0, bills: 0, avgBill: 0 };
  let wsCustomers: any[] = [];
  let wsTopItems: any[] = [];

  if (selectedWorkspace) {
    wsInvoices = invoices.filter(inv => inv.user_id === selectedWorkspace.user_id);
    wsMetrics.bills = wsInvoices.length;
    wsMetrics.revenue = wsInvoices.reduce((sum, inv) => sum + inv.total, 0);
    wsMetrics.avgBill = wsMetrics.bills > 0 ? wsMetrics.revenue / wsMetrics.bills : 0;
    
    const wsCustMap = new Map();
    const itemMap = new Map();

    wsInvoices.forEach(inv => {
      // Customers
      if (inv.customer_mobile) {
        if (!wsCustMap.has(inv.customer_mobile)) {
          wsCustMap.set(inv.customer_mobile, {
            name: inv.customer_name || 'Unknown',
            mobile: inv.customer_mobile,
            totalSpent: 0,
            lastVisit: inv.date,
          });
        }
        const cust = wsCustMap.get(inv.customer_mobile);
        cust.totalSpent += inv.total;
        if (new Date(inv.date) > new Date(cust.lastVisit)) {
          cust.lastVisit = inv.date;
        }
      }
      
      // Items
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
          if (!itemMap.has(item.productId)) {
            itemMap.set(item.productId, { name: item.name, quantity: 0, revenue: 0 });
          }
          const i = itemMap.get(item.productId);
          i.quantity += item.quantity;
          i.revenue += item.quantity * item.price;
        });
      }
    });

    wsCustomers = Array.from(wsCustMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    wsTopItems = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans p-6 md:p-8">
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
        </div>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out Admin
        </Button>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {!selectedWorkspace ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Total Workspaces
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {stats.totalUsers}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Active Workspaces
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">
                    {stats.activeUsers}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Total Bills Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {stats.totalInvoices}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 pb-px">
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'workspaces' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('workspaces')}
              >
                Workspaces
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'all-customers' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('all-customers')}
              >
                All Customers
              </button>
            </div>

            {activeTab === 'workspaces' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Workspace Management</CardTitle>
                  <CardDescription>
                    Manage user access and billing intervals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center text-slate-500">
                      Loading workspaces...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-y border-slate-200">
                          <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">Email</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Brand</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Service End Time</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Joined</th>
                            <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {users.map((u) => {
                            const isExpired =
                              u.service_end_time &&
                              new Date(u.service_end_time) < new Date();
                            const stateStatus =
                              !u.is_active || isExpired ? "Paused" : "Active";
                            const brand = restaurants.find(r => r.owner_id === u.user_id)?.restaurant_name || '-';

                            return (
                              <tr key={u.user_id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                  {u.email}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                  {brand}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${stateStatus === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                                  >
                                    {stateStatus}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="datetime-local"
                                    className="text-xs border border-slate-200 rounded p-1"
                                    value={
                                      u.service_end_time
                                        ? new Date(
                                            new Date(u.service_end_time).getTime() -
                                              new Date().getTimezoneOffset() * 60000,
                                          )
                                            .toISOString()
                                            .slice(0, 16)
                                        : ""
                                    }
                                    onChange={(e) =>
                                      updateUserStatus(u.user_id, {
                                        service_end_time: e.target.value
                                          ? new Date(e.target.value).toISOString()
                                          : null,
                                      })
                                    }
                                  />
                                  {!u.service_end_time && (
                                    <span className="text-xs text-slate-400 ml-2">
                                      Lifetime
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                  {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-slate-600 hover:bg-slate-100"
                                    onClick={() => setSelectedWorkspace({ ...u, brand })}
                                  >
                                    <Eye className="w-3 h-3 mr-1" /> View Details
                                  </Button>
                                  {u.is_active ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                      onClick={() =>
                                        updateUserStatus(u.user_id, {
                                          is_active: false,
                                        })
                                      }
                                    >
                                      <Pause className="w-3 h-3 mr-1" /> Pause
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                      onClick={() =>
                                        updateUserStatus(u.user_id, {
                                          is_active: true,
                                        })
                                      }
                                    >
                                      <Play className="w-3 h-3 mr-1" /> Resume
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {users.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-8 text-center text-slate-500"
                              >
                                No workspaces found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'all-customers' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>All Customers (Global)</CardTitle>
                  <CardDescription>
                    A master list of every customer across all workspaces.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-y border-slate-200">
                        <tr>
                          <th className="px-6 py-3 font-medium text-slate-500">Customer Name</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Phone</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Brand/Workspace</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Total Spent</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {allCustomers.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                            <td className="px-6 py-4 text-slate-600">{c.mobile}</td>
                            <td className="px-6 py-4 text-slate-600 font-medium">
                              <span className="px-2 py-1 bg-slate-100 rounded text-xs">{c.brand}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">₹{c.totalSpent.toFixed(2)}</td>
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(c.lastVisit).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                        {allCustomers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                              No customers found yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={() => setSelectedWorkspace(null)} className="mb-2 -ml-2 text-slate-500">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to Workspaces
                </Button>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {selectedWorkspace.brand !== '-' ? selectedWorkspace.brand : selectedWorkspace.email}
                </h2>
                <p className="text-slate-500">{selectedWorkspace.email}</p>
              </div>
            </div>

            {/* Workspace Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">₹{wsMetrics.revenue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total Bills Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{wsMetrics.bills}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Average Bill Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">₹{wsMetrics.avgBill.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle>Brand Customers</CardTitle>
                  <CardDescription>All customers for this workspace.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-y border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 font-medium text-slate-500">Customer Name</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Phone</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Total Spent</th>
                          <th className="px-6 py-3 font-medium text-slate-500">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {wsCustomers.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                            <td className="px-6 py-4 text-slate-600">{c.mobile}</td>
                            <td className="px-6 py-4 font-bold text-emerald-600">₹{c.totalSpent.toFixed(2)}</td>
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(c.lastVisit).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                        {wsCustomers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                              No customers found for this workspace.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {wsTopItems.length > 0 ? (
                    <div className="space-y-4">
                      {wsTopItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                              #{idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.quantity} sold</p>
                            </div>
                          </div>
                          <div className="font-semibold text-sm">
                            ₹{item.revenue.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No sales data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
