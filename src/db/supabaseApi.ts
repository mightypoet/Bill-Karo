import { supabase } from '../lib/supabase';
import { RestaurantProfile, Category, Product, Invoice } from './local';

export const cloudApi = {
  // --- Profile ---
  async getProfile(userId: string): Promise<RestaurantProfile | null> {
    const { data: profile } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (profile) {
      return {
        id: profile.id,
        restaurantName: profile.restaurant_name,
        logo: profile.logo,
        gstNumber: profile.gst_number,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        upiId: profile.upi_id,
        taxPercentage: profile.tax_percentage,
        serviceChargePercentage: profile.service_charge_percentage,
        currency: profile.currency,
        invoicePrefix: profile.invoice_prefix,
        receiptMessage: profile.receipt_message,
      };
    }

    // Provision new profile
    const newRest = {
      owner_id: userId,
      restaurant_name: 'My Store',
      tax_percentage: 5,
    };
    const { data: created, error } = await supabase.from('restaurants').insert(newRest).select().maybeSingle();
    if (created && !error) {
      return {
        id: created.id,
        restaurantName: created.restaurant_name,
        taxPercentage: created.tax_percentage,
        serviceChargePercentage: created.service_charge_percentage,
        currency: created.currency,
        invoicePrefix: created.invoice_prefix,
        receiptMessage: created.receipt_message,
      } as RestaurantProfile;
    }
    return null;
  },

  async saveProfile(userId: string, profile: RestaurantProfile): Promise<void> {
    await supabase.from('restaurants').update({
      restaurant_name: profile.restaurantName,
      gst_number: profile.gstNumber,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      upi_id: profile.upiId,
      tax_percentage: profile.taxPercentage,
      service_charge_percentage: profile.serviceChargePercentage,
      currency: profile.currency,
      invoice_prefix: profile.invoicePrefix,
      receipt_message: profile.receiptMessage,
    }).eq('id', profile.id).eq('owner_id', userId);
  },

  // --- Categories ---
  async getCategories(userId: string): Promise<Category[]> {
    const { data } = await supabase.from('categories').select('*').eq('user_id', userId);
    return (data || []).map(cat => ({ id: cat.id, name: cat.name }));
  },

  async saveCategory(userId: string, restaurantId: string, category: Category): Promise<void> {
    const { id, name } = category;
    
    // Check if exists
    const { data } = await supabase.from('categories').select('id').eq('id', id).maybeSingle();
    
    if (data) {
      await supabase.from('categories').update({ name }).eq('id', id).eq('user_id', userId);
    } else {
      await supabase.from('categories').insert({ id, restaurant_id: restaurantId, user_id: userId, name });
    }
  },

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    await supabase.from('categories').delete().eq('id', categoryId).eq('user_id', userId);
  },

  // --- Products ---
  async getProducts(userId: string): Promise<Product[]> {
    const { data } = await supabase.from('products').select('*').eq('user_id', userId);
    return (data || []).map(prod => ({
      id: prod.id,
      categoryId: prod.category_id,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      tax: prod.tax,
      image: prod.image,
      sku: prod.sku,
      availability: prod.availability
    }));
  },

  async saveProduct(userId: string, restaurantId: string, product: Product): Promise<void> {
    const payload = {
      restaurant_id: restaurantId,
      user_id: userId,
      category_id: product.categoryId,
      name: product.name,
      description: product.description,
      price: product.price,
      tax: product.tax,
      image: product.image,
      sku: product.sku,
      availability: product.availability,
    };

    const { data } = await supabase.from('products').select('id').eq('id', product.id).maybeSingle();

    if (data) {
      await supabase.from('products').update(payload).eq('id', product.id).eq('user_id', userId);
    } else {
      await supabase.from('products').insert({ ...payload, id: product.id });
    }
  },

  async deleteProduct(userId: string, productId: string): Promise<void> {
    await supabase.from('products').delete().eq('id', productId).eq('user_id', userId);
  },

  // --- Invoices ---
  async getInvoices(userId: string): Promise<Invoice[]> {
    const { data } = await supabase.from('invoices').select('*').eq('user_id', userId).order('date', { ascending: false });
    return (data || []).map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      date: inv.date,
      customerName: inv.customer_name,
      customerMobile: inv.customer_mobile,
      orderType: inv.order_type as any,
      tableNumber: inv.table_number,
      items: inv.items, // JSON array
      subtotal: inv.subtotal,
      taxAmount: inv.tax_amount,
      serviceChargeAmount: inv.service_charge_amount,
      discountAmount: inv.discount_amount,
      total: inv.total,
      status: inv.status as any
    }));
  },

  async saveInvoice(userId: string, restaurantId: string, invoice: Invoice): Promise<void> {
    const payload = {
      id: invoice.id,
      restaurant_id: restaurantId,
      user_id: userId,
      customer_name: invoice.customerName,
      customer_mobile: invoice.customerMobile,
      invoice_number: invoice.invoiceNumber,
      order_type: invoice.orderType,
      table_number: invoice.tableNumber,
      subtotal: invoice.subtotal,
      tax_amount: invoice.taxAmount,
      service_charge_amount: invoice.serviceChargeAmount,
      discount_amount: invoice.discountAmount,
      total: invoice.total,
      status: invoice.status,
      items: invoice.items,
      date: invoice.date
    };

    const { data } = await supabase.from('invoices').select('id').eq('id', invoice.id).maybeSingle();
    if (data) {
       await supabase.from('invoices').update(payload).eq('id', invoice.id).eq('user_id', userId);
    } else {
       await supabase.from('invoices').insert(payload);
    }
  }
};
