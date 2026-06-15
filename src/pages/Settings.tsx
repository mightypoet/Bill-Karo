import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { profile, updateProfile } = useStore();
  const [formData, setFormData] = useState({
    id: 'default',
    restaurantName: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    upiId: '',
    taxPercentage: 5,
    serviceChargePercentage: 0,
    currency: 'INR',
    invoicePrefix: 'INV',
    receiptMessage: 'Thank you!'
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSave = () => {
    updateProfile(formData);
    // Add toast here in a real app
    alert("Settings saved successfully");
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your business profile and billing configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>This information will appear on your receipts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input name="restaurantName" value={formData.restaurantName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Full Address</Label>
              <Input name="address" value={formData.address} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>UPI ID (For QR Code)</Label>
              <Input name="upiId" value={formData.upiId} onChange={handleChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Percentage (%)</Label>
              <Input type="number" name="taxPercentage" value={formData.taxPercentage} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Service Charge (%)</Label>
              <Input type="number" name="serviceChargePercentage" value={formData.serviceChargePercentage} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input name="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Receipt Footer Message</Label>
              <Input name="receiptMessage" value={formData.receiptMessage} onChange={handleChange} />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
