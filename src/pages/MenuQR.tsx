import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dbApi } from '../db/local';
import { Store, Utensils } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Product, Category, RestaurantProfile } from '../db/local';

export default function MenuQR() {
  const { restaurantName } = useParams();
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app this would query Supabase by restaurantName slug.
    // For this offline-first prototype, we just load local DB.
    async function load() {
      const p = await dbApi.getProfile();
      const cats = await dbApi.getCategories();
      const prods = await dbApi.getProducts();
      setProfile(p);
      setCategories(cats);
      setProducts(prods.filter(p => p.availability));
      setLoading(false);
    }
    load();
  }, [restaurantName]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading menu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6 shadow-md text-center rounded-b-3xl">
        <div className="w-20 h-20 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Store size={36} />
        </div>
        <h1 className="text-2xl font-bold">{profile?.restaurantName || 'Restaurant Menu'}</h1>
        <p className="text-emerald-100 text-sm mt-1">Scan & Order (View Only)</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 mt-4">
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center">
            <Utensils className="w-12 h-12 mb-3 opacity-20" />
            <p>No items available right now.</p>
          </div>
        )}

        {categories.map(category => {
          const catProducts = products.filter(p => p.categoryId === category.id);
          if (catProducts.length === 0) return null;

          return (
            <div key={category.id} className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">{category.name}</h2>
              <div className="space-y-3">
                {catProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden border-0 shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                        <Utensils size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 leading-tight">{product.name}</h3>
                        <p className="text-emerald-600 font-bold mt-1">₹{product.price.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
