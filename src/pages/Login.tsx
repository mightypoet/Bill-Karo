import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Store, CheckCircle, Zap, Shield, Smartphone } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="h-20 px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">
            BK
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bill Karo</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="font-bold hidden md:flex text-slate-600 hover:text-emerald-600" onClick={signInWithGoogle}>Login</Button>
          <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200" onClick={signInWithGoogle}>Get Started for Free</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-12 md:mt-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold mb-6 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          #1 SaaS POS for Modern Restaurants
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
          Smart Billing for <br/> <span className="text-emerald-600">Smart Restaurants</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto">
          Manage your restaurant, cloud kitchen, or cafe effortlessly. Fast billing, WhatsApp receipts, and real-time analytics—all in one place, stored securely in the cloud.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Button className="h-16 px-10 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-200" onClick={signInWithGoogle}>
            Test for Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 text-left w-full max-w-5xl mx-auto pb-20">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
              <Zap size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Lightning Fast Billing</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Generate bills in seconds with our optimized frosted-glass POS interface. Built for speed.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
              <Smartphone size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">WhatsApp Receipts</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Go green and save on paper rolls. Send digital invoices directly to customer's WhatsApp instantly.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Cloud Synced</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Your menus, settings, and sales data are securely synced to the cloud and locked to your account.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
