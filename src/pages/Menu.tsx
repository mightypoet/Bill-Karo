import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Upload, FileQuestion } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Menu() {
  const { categories, products, addCategory, deleteCategory, addProduct, deleteProduct } = useStore();
  const [newCatName, setNewCatName] = useState('');
  
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    price: '',
    tax: '0',
    sku: '',
    availability: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.categoryId && newProduct.price) {
      addProduct({
        name: newProduct.name,
        categoryId: newProduct.categoryId,
        price: parseFloat(newProduct.price),
        tax: parseFloat(newProduct.tax),
        sku: newProduct.sku,
        availability: newProduct.availability
      });
      setIsAddingProduct(false);
      setNewProduct({ name: '', categoryId: '', price: '', tax: '0', sku: '', availability: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        let addedCount = 0;
        
        // Build current category map (lowercase name -> id)
        const catMap = new Map<string, string>();
        categories.forEach(c => catMap.set(c.name.trim().toLowerCase(), c.id));

        for (const row of data) {
          const categoryName = row['Category']?.toString();
          const itemName = row['Item Name']?.toString();
          const price = parseFloat(row['Price']);
          const description = row['Description']?.toString() || '';
          
          if (itemName && !isNaN(price)) {
            let catId = '';
            if (categoryName) {
              const lowerCatName = categoryName.trim().toLowerCase();
              if (catMap.has(lowerCatName)) {
                catId = catMap.get(lowerCatName)!;
              } else {
                // Wait for the new category to be created to get its ID
                catId = await addCategory(categoryName.trim());
                catMap.set(lowerCatName, catId); // add to map so we don't recreate it
              }
            }
            
            await addProduct({
              name: itemName.trim(),
              categoryId: catId,
              price: price,
              tax: 0,
              sku: '',
              availability: true
            });
            addedCount++;
          }
        }
        
        alert(`Successfully added ${addedCount} item(s) to the menu.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const showFormatExample = () => {
    alert("Expected Columns:\n- 'Category' (e.g., Starters)\n- 'Item Name' (e.g., Spring Rolls)\n- 'Price' (e.g., 250)\n- 'Description' (Optional)");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Menu Management</h1>
          <p className="text-sm md:text-base text-gray-500">Manage your categories and products.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            className="hidden" 
          />
          <Button variant="outline" onClick={showFormatExample} title="Show format example" className="px-3">
            <FileQuestion className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Upload Menu
          </Button>
          <Button onClick={() => setIsAddingProduct(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Categories Column */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="New Category" 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button size="icon" onClick={handleAddCategory}><Plus className="w-4 h-4" /></Button>
            </div>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded border">
                  <span className="font-medium text-sm">{cat.name}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteCategory(cat.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
              {categories.length === 0 && <p className="text-sm text-gray-500">No categories added yet.</p>}
            </ul>
          </CardContent>
        </Card>

        {/* Products Column */}
        <div className="md:col-span-2 space-y-4">
          {isAddingProduct && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newProduct.categoryId}
                      onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax (%)</Label>
                    <Input type="number" value={newProduct.tax} onChange={e => setNewProduct({...newProduct, tax: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
                  <Button onClick={handleAddProduct}>Save Product</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.map(prod => {
                  const cat = categories.find(c => c.id === prod.categoryId);
                  return (
                    <div key={prod.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{prod.name}</div>
                        <div className="text-xs text-gray-500">
                          {cat?.name || 'Uncategorized'} • {prod.sku && `SKU: ${prod.sku}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-bold">₹{prod.price.toFixed(2)}</div>
                        <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => deleteProduct(prod.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {products.length === 0 && !isAddingProduct && (
                  <div className="text-center py-8 text-gray-500">No products found. Add a category first, then add products.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
