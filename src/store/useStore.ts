import { create } from 'zustand';
import { dbApi, Product, Category, Invoice, RestaurantProfile } from '../db/local';

interface PosState {
  profile: RestaurantProfile | null;
  categories: Category[];
  products: Product[];
  invoices: Invoice[];
  isLoading: boolean;
  loadData: () => Promise<void>;
  updateProfile: (profile: RestaurantProfile) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveInvoice: (invoice: Invoice) => Promise<void>;
}

export const useStore = create<PosState>((set, get) => ({
  profile: null,
  categories: [],
  products: [],
  invoices: [],
  isLoading: true,
  
  loadData: async () => {
    set({ isLoading: true });
    try {
      const [profile, categories, products, invoices] = await Promise.all([
        dbApi.getProfile(),
        dbApi.getCategories(),
        dbApi.getProducts(),
        dbApi.getInvoices()
      ]);
      set({ profile, categories, products, invoices, isLoading: false });
    } catch (e) {
      console.error("Failed to load local DB data", e);
      set({ isLoading: false });
    }
  },

  updateProfile: async (profile) => {
    await dbApi.saveProfile(profile);
    set({ profile });
  },

  addCategory: async (name) => {
    const id = crypto.randomUUID();
    const newCat = { id, name };
    await dbApi.saveCategory(newCat);
    set((state) => ({ categories: [...state.categories, newCat] }));
  },

  deleteCategory: async (id) => {
    await dbApi.deleteCategory(id);
    set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
  },

  addProduct: async (prodOmitId) => {
    const id = crypto.randomUUID();
    const product = { ...prodOmitId, id };
    await dbApi.saveProduct(product);
    set((state) => ({ products: [...state.products, product] }));
  },

  updateProduct: async (product) => {
    await dbApi.saveProduct(product);
    set((state) => ({ products: state.products.map(p => p.id === product.id ? product : p) }));
  },

  deleteProduct: async (id) => {
    await dbApi.deleteProduct(id);
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
  },

  saveInvoice: async (invoice) => {
    await dbApi.saveInvoice(invoice);
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
  }
}));
