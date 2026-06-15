import { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { Product, InvoiceItem, Invoice } from "../db/local";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Smartphone,
  Send,
  Search,
} from "lucide-react";
import { format } from "date-fns";

export default function POS() {
  const { profile, categories, products, saveInvoice } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart State
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [orderType, setOrderType] = useState<
    "Dine In" | "Takeaway" | "Delivery"
  >("Dine In");
  const [tableNumber, setTableNumber] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        activeCategory === "all" || p.categoryId === activeCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Calculations
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  // Tax calculation: assuming product.tax is percentage. If zero, use profile tax.
  // Actually, standard POS usually calculates tax per item or globally.
  // Let's use profile tax if product tax is not specified or 0.
  const taxAmount = cart.reduce((acc, item) => {
    const p = products.find((prod) => prod.id === item.productId);
    const taxRate = p?.tax ? p.tax : profile?.taxPercentage || 0;
    return acc + item.price * item.quantity * (taxRate / 100);
  }, 0);

  const serviceChargeAmount =
    subtotal * ((profile?.serviceChargePercentage || 0) / 100);
  const discountAmount = 0; // Configurable if needed
  const total = subtotal + taxAmount + serviceChargeAmount - discountAmount;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      }),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleGenerateBill = async () => {
    if (cart.length === 0) return;

    // Create Invoice object
    const invoiceNumber = `${profile?.invoicePrefix || "INV"}-${format(new Date(), "yyyyMMdd")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      date: new Date().toISOString(),
      customerName: customerName || "Guest",
      customerMobile: customerMobile || "",
      orderType,
      tableNumber,
      items: cart,
      subtotal,
      taxAmount,
      serviceChargeAmount,
      discountAmount,
      total,
      status: "Paid",
    };

    await saveInvoice(newInvoice);

    // TODO: Generate PDF and open WhatsApp
    generateAndSendWhatsApp(newInvoice);

    // Clear cart
    setCart([]);
    setCustomerName("");
    setCustomerMobile("");
    setTableNumber("");
  };

  const generateAndSendWhatsApp = (inv: Invoice) => {
    const restName = profile?.restaurantName || "Our Restaurant";
    // Deep Link WhatsApp
    const message = `Hello ${inv.customerName},

Thank you for visiting ${restName}.

*Your Invoice Details:*
Invoice No: ${inv.invoiceNumber}
Amount: ₹${inv.total.toFixed(2)}

We appreciate your visit. Have a great day!`;

    const encoded = encodeURIComponent(message);
    let url = `https://wa.me/?text=${encoded}`;
    if (inv.customerMobile) {
      // Basic formatting for India by default or generic
      let m = inv.customerMobile.replace(/\D/g, "");
      if (m.length === 10) m = "91" + m;
      url = `https://wa.me/${m}?text=${encoded}`;
    }

    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-screen w-full overflow-hidden bg-[#F3F4F6] text-slate-900 font-sans">
      {/* Left Sidebar: Categories */}
      <nav className="w-full md:w-20 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex md:flex-col items-center py-4 md:py-6 gap-4 md:gap-8 overflow-x-auto md:overflow-y-auto shrink-0 z-10">
        <button
          onClick={() => setActiveCategory("all")}
          className={`flex flex-col items-center gap-1 shrink-0 ${activeCategory === "all" ? "text-emerald-600" : "text-slate-400 hover:text-emerald-500"}`}
        >
          <div
            className={`p-3 rounded-xl transition-colors ${activeCategory === "all" ? "bg-emerald-50" : "hover:bg-slate-50"}`}
          >
            <ShoppingCart className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase">All</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`flex flex-col items-center gap-1 shrink-0 ${activeCategory === c.id ? "text-emerald-600" : "text-slate-400 hover:text-emerald-500"}`}
          >
            <div
              className={`p-3 rounded-xl transition-colors ${activeCategory === c.id ? "bg-emerald-50" : "hover:bg-slate-50"}`}
            >
              {/* Fallback to generic icon since categories are dynamic */}
              <div className="w-6 h-6 flex items-center justify-center font-bold text-lg">
                {c.name.charAt(0)}
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase truncate w-16 text-center">
              {c.name}
            </span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header containing search */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-6 z-20 shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                className="w-full bg-slate-100 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Product Grid Area */}
        <div className="flex-1 p-4 md:p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group flex flex-col"
            >
              <div className="h-32 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-4xl overflow-hidden group-hover:bg-slate-50 transition-colors">
                {/* Fallback visual since we don't have real images in the prototype yet */}
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-white font-bold opacity-80">
                    <span className="text-emerald-600 text-3xl group-hover:scale-110 transition-transform">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm mb-1 text-slate-800 leading-snug">
                {product.name}
              </h3>
              <div className="flex justify-between items-center mt-auto pt-2">
                <span className="text-emerald-600 font-bold">
                  ₹{product.price.toFixed(2)}
                </span>
                {product.sku && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-mono">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
              No products found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Cart / Billing Panel */}
      <aside className="w-full md:w-96 bg-white/60 backdrop-blur-xl border-l border-slate-200 flex flex-col shadow-2xl shrink-0 z-30 transition-transform">
        <div className="p-6 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-slate-800">Current Order</h2>
            <span
              className="text-xs font-bold text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]"
              title={tableNumber || "Guest"}
            >
              {tableNumber ? `T-${tableNumber}` : "New Bill"}
            </span>
          </div>

          <div className="flex gap-2 mt-2">
            {(["Dine In", "Takeaway", "Delivery"] as const).map((type) => (
              <button
                key={type}
                className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-colors ${orderType === type ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setOrderType(type)}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <input
              type="text"
              placeholder="Customer Name"
              className="w-full bg-slate-50/80 border border-slate-200 rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mobile (WhatsApp)"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
              />
              {orderType === "Dine In" && (
                <input
                  type="text"
                  placeholder="Table"
                  className="w-1/3 bg-slate-50/80 border border-slate-200 rounded-lg py-1.5 px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 px-4 md:px-6 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-2">
              <ShoppingCart className="w-12 h-12 opacity-50" />
              <p className="font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    ₹{item.price.toFixed(2)} / ea
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-bold w-14 text-right text-slate-800 shrink-0">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Totals & Actions */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-200 shrink-0">
          <div className="space-y-2 mb-4 md:mb-6">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
            {serviceChargeAmount > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Service Charge</span>
                <span>₹{serviceChargeAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="font-bold text-base md:text-lg text-slate-800">
                Grand Total
              </span>
              <span className="font-bold text-xl md:text-2xl text-emerald-600">
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:gap-3">
            <button
              className="w-full py-3 md:py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg shadow-lg shadow-emerald-200 transition-transform active:scale-[0.98]"
              disabled={cart.length === 0}
              onClick={handleGenerateBill}
            >
              Place Order & Print Bill
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
