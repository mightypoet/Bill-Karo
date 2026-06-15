import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface RestaurantProfile {
  id: string;
  restaurantName: string;
  logo?: string;
  gstNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  upiId?: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  currency: string;
  invoicePrefix: string;
  receiptMessage: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  tax: number;
  image?: string;
  sku?: string;
  availability: boolean;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number; // rate
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerMobile: string;
  orderType: 'Dine In' | 'Takeaway' | 'Delivery';
  tableNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  total: number;
  status: 'Paid' | 'Pending' | 'Cancelled';
}

interface PosDBSchema extends DBSchema {
  profile: {
    key: string;
    value: RestaurantProfile;
  };
  categories: {
    key: string;
    value: Category;
  };
  products: {
    key: string;
    value: Product;
    indexes: { 'by-category': string };
  };
  customers: {
    key: string;
    value: Customer;
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: { 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<PosDBSchema>>;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<PosDBSchema>('restoflow-pos', 1, {
      upgrade(db) {
        db.createObjectStore('profile', { keyPath: 'id' });
        db.createObjectStore('categories', { keyPath: 'id' });
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('by-category', 'categoryId');
        db.createObjectStore('customers', { keyPath: 'id' });
        const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
        invoiceStore.createIndex('by-date', 'date');
      },
    });
  }
  return dbPromise;
}

export const dbApi = {
  // Profile
  async getProfile(id: string = 'default') {
    const db = await initDB();
    const profile = await db.get('profile', id);
    if (!profile) {
      const defaultProfile: RestaurantProfile = {
        id: 'default',
        restaurantName: 'New Restaurant',
        taxPercentage: 5,
        serviceChargePercentage: 0,
        currency: 'INR',
        invoicePrefix: 'INV',
        receiptMessage: 'Thank you for visiting!'
      };
      await db.put('profile', defaultProfile);
      return defaultProfile;
    }
    return profile;
  },
  async saveProfile(profile: RestaurantProfile) {
    const db = await initDB();
    await db.put('profile', profile);
  },

  // Categories
  async getCategories() {
    const db = await initDB();
    return db.getAll('categories');
  },
  async saveCategory(cat: Category) {
    const db = await initDB();
    await db.put('categories', cat);
  },
  async deleteCategory(id: string) {
    const db = await initDB();
    await db.delete('categories', id);
  },

  // Products
  async getProducts() {
    const db = await initDB();
    return db.getAll('products');
  },
  async saveProduct(prod: Product) {
    const db = await initDB();
    await db.put('products', prod);
  },
  async deleteProduct(id: string) {
    const db = await initDB();
    await db.delete('products', id);
  },

  // Invoices
  async getInvoices() {
    const db = await initDB();
    const all = await db.getAll('invoices');
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  async saveInvoice(inv: Invoice) {
    const db = await initDB();
    await db.put('invoices', inv);
  }
};
