import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { profile, storeSettings, updateProfile, updateStoreSettings } = useStore();
  
  // Keep billing fields in profile
  const [profileData, setProfileData] = useState({
    id: 'default',
    email: '',
    upiId: '',
    taxPercentage: 0,
    serviceChargePercentage: 0,
    currency: 'INR',
    invoicePrefix: 'INV'
  });

  // Keep store settings fields separated
  const [storeData, setStoreData] = useState({
    id: 'default',
    storeName: '',
    phone: '',
    address: '',
    gstNumber: '',
    footerMessage: 'Thank you for visiting!'
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        id: profile.id,
        email: profile.email || '',
        upiId: profile.upiId || '',
        taxPercentage: profile.taxPercentage ?? 0,
        serviceChargePercentage: profile.serviceChargePercentage ?? 0,
        currency: profile.currency || 'INR',
        invoicePrefix: profile.invoicePrefix || 'INV'
      });
    }
    if (storeSettings) {
      setStoreData({
        id: storeSettings.id,
        storeName: storeSettings.storeName || '',
        phone: storeSettings.phone || '',
        address: storeSettings.address || '',
        gstNumber: storeSettings.gstNumber || '',
        footerMessage: storeSettings.footerMessage || 'Thank you!'
      });
    }
  }, [profile, storeSettings]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setProfileData({ ...profileData, [e.target.name]: value });
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreData({ ...storeData, [e.target.name]: e.target.value });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (profile) {
        await updateProfile({
          ...profile,
          ...profileData,
          restaurantName: storeData.storeName || profile.restaurantName,
          phone: storeData.phone || profile.phone,
          address: storeData.address || profile.address,
          gstNumber: storeData.gstNumber || profile.gstNumber,
          receiptMessage: storeData.footerMessage || profile.receiptMessage,
        });
      }
      
      try {
        await updateStoreSettings(storeData);
      } catch (storeError) {
        // Silently fail store_settings update if the table hasn't been created yet -> use profile info as fallback
        console.warn("Could not save store_settings explicitly. Using restaurants table fallback.", storeError);
      }
      
      alert("Settings saved successfully!");
    } catch (e: any) {
      console.error("Save error:", e);
      alert("Failed to save settings: " + (e.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm md:text-base text-gray-500">Manage your business profile and billing configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>This information will appear on your receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input name="storeName" value={storeData.storeName} onChange={handleStoreChange} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input name="phone" value={storeData.phone} onChange={handleStoreChange} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" value={profileData.email} onChange={handleProfileChange} />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input name="gstNumber" value={storeData.gstNumber} onChange={handleStoreChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Full Address</Label>
              <Input name="address" value={storeData.address} onChange={handleStoreChange} />
            </div>
            <div className="space-y-2">
              <Label>UPI ID (For QR Code)</Label>
              <Input name="upiId" value={profileData.upiId} onChange={handleProfileChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Percentage (%)</Label>
              <Input type="number" name="taxPercentage" value={profileData.taxPercentage} onChange={handleProfileChange} />
            </div>
            <div className="space-y-2">
              <Label>Service Charge (%)</Label>
              <Input type="number" name="serviceChargePercentage" value={profileData.serviceChargePercentage} onChange={handleProfileChange} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input name="invoicePrefix" value={profileData.invoicePrefix} onChange={handleProfileChange} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Receipt Footer Message</Label>
              <Input name="footerMessage" value={storeData.footerMessage} onChange={handleStoreChange} />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
