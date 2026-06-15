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
import { LogOut, Users, Settings2, Activity, Play, Pause } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { user, isAdmin, signOut } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalInvoices: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    // Fetch all user access rows
    const { data: userData, error: userError } = await supabase
      .from("user_access")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch some basic stats
    const { count: invoiceCount } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true });

    if (userData) {
      setUsers(userData);
      setStats({
        totalUsers: userData.length,
        activeUsers: userData.filter(
          (u) =>
            u.is_active &&
            (!u.service_end_time || new Date(u.service_end_time) > new Date()),
        ).length,
        totalInvoices: invoiceCount || 0,
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

        {/* Users List */}
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
                      <th className="px-6 py-3 font-medium text-slate-500">
                        Email
                      </th>
                      <th className="px-6 py-3 font-medium text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-3 font-medium text-slate-500">
                        Service End Time
                      </th>
                      <th className="px-6 py-3 font-medium text-slate-500">
                        Joined
                      </th>
                      <th className="px-6 py-3 font-medium text-slate-500 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map((u) => {
                      const isExpired =
                        u.service_end_time &&
                        new Date(u.service_end_time) < new Date();
                      const stateStatus =
                        !u.is_active || isExpired ? "Paused" : "Active";

                      return (
                        <tr key={u.user_id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {u.email}
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
                          <td className="px-6 py-4 text-right">
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
                          colSpan={5}
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
      </div>
    </div>
  );
}
