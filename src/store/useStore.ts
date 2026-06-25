import { create } from 'zustand';
import { dbApi as localDbApi, Product, Category, Invoice, RestaurantProfile, StoreSettings } from '../db/local';
import { cloudApi } from '../db/supabaseApi';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface PosState {
  profile: RestaurantProfile | null;
  storeSettings: StoreSettings | null;
  categories: Category[];
  products: Product[];
  invoices: Invoice[];
  isLoading: boolean;
  loadData: (userId?: string) => Promise<void>;
  updateProfile: (profile: RestaurantProfile) => Promise<void>;
  updateStoreSettings: (settings: StoreSettings) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveInvoice: (invoice: Invoice) => Promise<void>;
}

export const useStore = create<PosState>((set, get) => ({
  profile: null,
  storeSettings: null,
  categories: [],
  products: [],
  invoices: [],
  isLoading: true,
  
  loadData: async (userId?: string) => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured && userId && userId !== 'mock') {
        const profile = await cloudApi.getProfile(userId);
        const storeSettings = await cloudApi.getStoreSettings(userId);
        const categories = await cloudApi.getCategories(userId);
        const products = await cloudApi.getProducts(userId);
        const invoices = await cloudApi.getInvoices(userId);
        set({ profile, storeSettings, categories, products, invoices, isLoading: false });
      } else {
        const [profile, storeSettings, categories, products, invoices] = await Promise.all([
          localDbApi.getProfile(),
          localDbApi.getStoreSettings(),
          localDbApi.getCategories(),
          localDbApi.getProducts(),
          localDbApi.getInvoices()
        ]);
        set({ profile, storeSettings, categories, products, invoices, isLoading: false });
      }
    } catch (e) {
      console.error("Failed to load DB data", e);
      set({ isLoading: false });
    }
  },

  updateProfile: async (profile) => {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    
    if (isSupabaseConfigured && userId && userId !== 'mock') {
      await cloudApi.saveProfile(userId, profile);
    } else {
      await localDbApi.saveProfile(profile);
    }
    set({ profile });
  },

  updateStoreSettings: async (settings) => {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    
    if (isSupabaseConfigured && userId && userId !== 'mock') {
      await cloudApi.saveStoreSettings(userId, settings);
    } else {
      await localDbApi.saveStoreSettings(settings);
    }
    set({ storeSettings: settings });
  },

  addCategory: async (name) => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    const { profile } = get();

    const id = crypto.randomUUID();
    const newCat = { id, name };

    if (isSupabaseConfigured && userId && userId !== 'mock' && profile) {
      await cloudApi.saveCategory(userId, profile.id, newCat);
    } else {
      await localDbApi.saveCategory(newCat);
    }
    set((state) => ({ categories: [...state.categories, newCat] }));
  },

  deleteCategory: async (id) => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;

    if (isSupabaseConfigured && userId && userId !== 'mock') {
       await cloudApi.deleteCategory(userId, id);
    } else {
       await localDbApi.deleteCategory(id);
    }
    set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
  },

  addProduct: async (prodOmitId) => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    const { profile } = get();

    const id = crypto.randomUUID();
    const product = { ...prodOmitId, id };

    if (isSupabaseConfigured && userId && userId !== 'mock' && profile) {
       await cloudApi.saveProduct(userId, profile.id, product);
    } else {
       await localDbApi.saveProduct(product);
    }
    set((state) => ({ products: [...state.products, product] }));
  },

  updateProduct: async (product) => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    const { profile } = get();

    if (isSupabaseConfigured && userId && userId !== 'mock' && profile) {
      await cloudApi.saveProduct(userId, profile.id, product);
    } else {
      await localDbApi.saveProduct(product);
    }
    set((state) => ({ products: state.products.map(p => p.id === product.id ? product : p) }));
  },

  deleteProduct: async (id) => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;

    if (isSupabaseConfigured && userId && userId !== 'mock') {
       await cloudApi.deleteProduct(userId, id);
    } else {
       await localDbApi.deleteProduct(id);
    }
    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
  },

  saveInvoice: async (invoice) => {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    const { profile } = get();

    if (isSupabaseConfigured && userId && userId !== 'mock' && profile) {
      await cloudApi.saveInvoice(userId, profile.id, invoice);
    } else {
      await localDbApi.saveInvoice(invoice);
    }
    set((state) => ({ invoices: [invoice, ...state.invoices] }));
  }
}));
