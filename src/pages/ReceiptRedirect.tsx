import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, FileWarning } from 'lucide-react';

export default function ReceiptRedirect() {
  const { invoiceId } = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      if (!invoiceId) {
        setError("Invalid link");
        return;
      }

      // We explicitly query the database as requested by the user
      // Assuming 'public_read_invoice_by_id' policy is active
      const { data, error } = await supabase
        .from('invoices')
        .select('receipt_url')
        .eq('id', invoiceId)
        .maybeSingle();

      if (error) {
        // Fallback: If DB query fails due to RLS, reconstruct the URL predictably 
        // since we uploaded it as `${profile.id}/inv_${inv.invoiceNumber}_${Date.now()}.pdf`
        // Wait, we uploaded it as profile.id/... which we don't have.
        // Actually we updated the upload logic to use `${profile.id}/inv_${inv.invoiceNumber}_${Date.now()}.pdf`. Wait, did we?
        // Let's check POS.tsx: `const fileName = \`${profile.id}/inv_${inv.invoiceNumber}_${Date.now()}.pdf\`;`
        // So the DB query is CRITICAL because of `Date.now()`.
        console.error("Error fetching receipt URL:", error);
        setError("Could not retrieve receipt. The link may have expired or is invalid.");
        return;
      }

      if (data && data.receipt_url) {
        window.location.replace(data.receipt_url);
      } else {
        setError("Receipt PDF not found for this order.");
      }
    }

    fetchReceipt();
  }, [invoiceId]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center text-slate-800 bg-[#F3F4F6] font-sans">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <FileWarning size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Receipt Not Found</h1>
        <p className="text-slate-500 max-w-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 text-center text-slate-800 bg-[#F3F4F6] font-sans">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <h1 className="text-2xl font-bold mb-2">Loading Receipt...</h1>
        <p className="text-slate-500">You are being redirected to your PDF receipt.</p>
    </div>
  );
}
