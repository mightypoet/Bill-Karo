import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Download, Send, Search, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Orders() {
  const { invoices, profile, storeSettings } = useStore();
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || 
    inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerMobile.includes(search)
  );

  const downloadPDF = async (invoice: any) => {
    setSelectedInvoice(invoice);
    // Allow DOM to update
    setTimeout(async () => {
      if (receiptRef.current) {
        // Force printable container width strictly
        receiptRef.current.style.width = '320px';
        
        const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const imgWidth = 80;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [imgWidth, imgHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Receipt-${invoice.invoiceNumber}.pdf`);
        setSelectedInvoice(null);
      }
    }, 100);
  };

  const sendWhatsApp = async (inv: any) => {
    setIsUploading(inv.id);
    setSelectedInvoice(inv);

    setTimeout(async () => {
      try {
        let pdfUrl = '';

        if (receiptRef.current) {
          // Force printable container width strictly
          receiptRef.current.style.width = '320px';
          
          const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
          const imgData = canvas.toDataURL('image/png');
          
          const imgWidth = 80;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [imgWidth, imgHeight]
          });
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          if (navigator.onLine && isSupabaseConfigured && profile?.id) {
            const pdfBlob = pdf.output('blob');
            const fileName = `${profile.id}/inv_${inv.invoiceNumber}_${Date.now()}.pdf`;
            
            const { data, error } = await supabase.storage.from('invoices').upload(fileName, pdfBlob, {
              contentType: 'application/pdf',
              upsert: true
            });
            
            if (!error && data) {
              const { data: publicUrlData } = supabase.storage.from('invoices').getPublicUrl(fileName);
              pdfUrl = publicUrlData.publicUrl;
              
              await supabase.from('invoices').update({ receipt_url: pdfUrl }).eq('id', inv.id);
            }
          }
          
          if (!pdfUrl) {
             // Fallback local download
             pdf.save(`Receipt-${inv.invoiceNumber}.pdf`);
          }
        }

        const restName = storeSettings?.storeName || profile?.restaurantName || 'Our Restaurant';
        const message = `Hello ${inv.customerName || 'Customer'},\nThank you for visiting ${restName}.\nYour total is ₹${Number(inv.total).toFixed(2)}.\nYou can view and download your detailed receipt here: ${window.location.origin}/receipt/${inv.id}\nWe appreciate your visit!`;

        const encoded = encodeURIComponent(message);
        let url = `https://wa.me/?text=${encoded}`;
        if (inv.customerMobile) {
          let m = String(inv.customerMobile).replace(/\D/g, '');
          if (m.length === 10) m = '91' + m;
          url = `https://wa.me/${m}?text=${encoded}`;
        }
        
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          window.location.href = url;
        }
      } catch (err: any) {
        console.error("Error generating WhatsApp link", err);
        alert(`Failed to generate WhatsApp link: ${err.message}. Ensure everything is configured in the cloud or download the PDF locally.`);
      } finally {
        setSelectedInvoice(null);
        setIsUploading(null);
      }
    }, 100);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order History</h1>
          <p className="text-gray-500">View and manage past invoices.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search invoices..." 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-y">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">Invoice No</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Customer</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{format(new Date(inv.date), 'dd MMM yyyy, hh:mm a')}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{inv.customerName}</div>
                      <div className="text-xs text-gray-500">{inv.customerMobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{inv.orderType}</span>
                      {inv.tableNumber && <span className="ml-1 text-xs text-gray-500">T{inv.tableNumber}</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">₹{inv.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => downloadPDF(inv)} title="Download PDF">
                          <Download className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => sendWhatsApp(inv)} title="WhatsApp" disabled={isUploading === inv.id}>
                          {isUploading === inv.id ? <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" /> : <Send className="w-4 h-4 text-emerald-600" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Hidden Receipt Template for html2canvas */}
      {selectedInvoice && (
        <div className="fixed top-[-9999px] left-[-9999px]">
          <div ref={receiptRef} className="p-6 pb-12 w-[320px] bg-[#ffffff] text-[#000000] box-border" style={{ fontFamily: 'monospace', backgroundColor: '#ffffff', color: '#000000' }}>
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold mb-1">{storeSettings?.storeName || profile?.restaurantName || 'Bill Karo'}</h1>
              {storeSettings?.address && <p className="text-xs mt-1">{storeSettings.address}</p>}
              {storeSettings?.phone && <p className="text-xs mt-1">Ph: {storeSettings.phone}</p>}
              {storeSettings?.gstNumber && <p className="text-xs mt-1 font-bold">GSTIN: {storeSettings.gstNumber}</p>}
            </div>
            
            <div className="border-b-2 border-dashed border-[#cccccc] my-4"></div>
            
            <div className="text-xs space-y-1">
              <div className="flex justify-between"><span>Inv:</span><span>{selectedInvoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span>Date:</span><span>{format(new Date(selectedInvoice.date), 'dd/MM/yyyy HH:mm')}</span></div>
              <div className="flex justify-between"><span>Type:</span><span>{selectedInvoice.orderType} {selectedInvoice.tableNumber && `(T${selectedInvoice.tableNumber})`}</span></div>
              <div className="flex justify-between"><span>Cust:</span><span>{selectedInvoice.customerName}</span></div>
            </div>

            <div className="border-b-2 border-dashed border-[#cccccc] my-4"></div>

            <div className="text-sm">
              <div className="flex justify-between font-bold text-sm mb-2">
                <span className="flex-1">Item</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-16 text-right">Amt</span>
              </div>
              <div className="space-y-2">
                {selectedInvoice.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start text-xs">
                    <span className="flex-1 pr-2 break-words">{item.name}</span>
                    <span className="w-12 text-center break-words">{item.quantity}</span>
                    <span className="w-16 text-right break-words">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b-2 border-dashed border-[#cccccc] my-4"></div>

            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              {selectedInvoice.taxAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span>Tax</span>
                  <span>{selectedInvoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {selectedInvoice.serviceChargeAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span>S. Charge</span>
                  <span>{selectedInvoice.serviceChargeAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-b-2 border-dashed border-[#cccccc] my-4"></div>

            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>₹{selectedInvoice.total.toFixed(2)}</span>
            </div>

            <div className="text-center text-xs space-y-2 pb-6">
              {profile?.upiId && (
                <div className="p-2 border border-[#cccccc] rounded mb-4 inline-block">
                  <p>Pay via UPI:</p>
                  <p className="font-bold">{profile.upiId}</p>
                </div>
              )}
              <p className="font-bold text-sm mb-1">{storeSettings?.footerMessage || profile?.receiptMessage || 'Thank you for visiting!'}</p>
              <p className="text-[10px]">Powered by Bill Karo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
