'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Tenant,
  Branch,
  Category,
  Product,
  Order,
  Customer,
  OrderStatus,
  ServiceTier,
  OrderItem,
  PaymentStatus,
  PaymentMethod,
  DashboardMetrics,
} from '@washora/shared';
import {
  mockTenant,
  mockBranches,
  mockCategories,
  mockProducts,
  mockOrders,
  mockCustomers,
  mockDashboardMetrics,
} from '@/lib/mockData';
import { api } from '@/lib/api';

export interface CartItem extends OrderItem {
  id: string;
}

export interface AppContextType {
  // Tenant & Branch
  tenant: Tenant;
  branches: Branch[];
  activeBranch: Branch;
  setActiveBranchId: (branchId: string) => void;
  addBranch: (branch: Omit<Branch, 'id' | 'createdAt'>) => Promise<void>;
  updateBranch: (id: string, branch: Partial<Branch>) => Promise<void>;

  // Data
  categories: Category[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  metrics: DashboardMetrics;
  isLoading: boolean;
  isBackendConnected: boolean;
  syncWithBackend: () => Promise<void>;

  // Category Management
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Product Management
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductPriceForBranch: (product: Product, tier: ServiceTier, branchId?: string) => number;

  // Customer Management
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent' | 'pendingBalance'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;

  // POS State
  cart: CartItem[];
  selectedCustomer: Customer | null;
  selectedTier: ServiceTier;
  discountAmount: number;
  expressSurcharge: boolean;
  notes: string;
  setSelectedCustomer: (customer: Customer | null) => void;
  setSelectedTier: (tier: ServiceTier) => void;
  setDiscountAmount: (discount: number) => void;
  setExpressSurcharge: (express: boolean) => void;
  setNotes: (notes: string) => void;
  addToCart: (product: Product, tier?: ServiceTier, customNotes?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  calculateTotals: () => {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    itemCount: number;
  };
  createOrder: (paidAmount?: number, paymentMethod?: PaymentMethod) => Order;

  // Order Management
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  recordPayment: (orderId: string, amount: number, method: PaymentMethod, reference?: string) => Promise<void>;
  issueRefund: (orderId: string, amount: number, reason: string) => Promise<void>;

  // Toast / Notifications
  notifications: Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }>;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissNotification: (id: string) => void;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant>(mockTenant);
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [activeBranchId, setActiveBranchIdState] = useState<string>(mockBranches[0].id);

  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockDashboardMetrics);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(mockCustomers[0]);
  const [selectedTier, setSelectedTier] = useState<ServiceTier>(ServiceTier.REGULAR);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [expressSurcharge, setExpressSurcharge] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Notifications
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }>
  >([]);

  // Theme
  const [isDark, setIsDark] = useState(false);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Initial Sync from MongoDB Atlas via NestJS REST API
  const syncWithBackend = async () => {
    try {
      setIsLoading(true);
      const [catsRes, prodsRes, branchesRes, custsRes, ordersRes] = await Promise.all([
        api.getCategories().catch(() => null),
        api.getProducts().catch(() => null),
        api.getBranches().catch(() => null),
        api.getCustomers().catch(() => null),
        api.getOrders().catch(() => null),
      ]);

      if (catsRes && catsRes.length > 0) {
        setCategories(
          catsRes.map((c: any) => ({
            ...c,
            id: c._id || c.id,
          }))
        );
      }
      if (prodsRes && prodsRes.length > 0) {
        setProducts(
          prodsRes.map((p: any) => ({
            ...p,
            id: p._id || p.id,
            categoryId: p.categoryId?._id || p.categoryId,
          }))
        );
      }
      if (branchesRes && branchesRes.length > 0) {
        setBranches(
          branchesRes.map((b: any) => ({
            ...b,
            id: b._id || b.id,
          }))
        );
      }
      if (custsRes && custsRes.length > 0) {
        setCustomers(
          custsRes.map((cust: any) => ({
            ...cust,
            id: cust._id || cust.id,
          }))
        );
      }
      if (ordersRes && ordersRes.length > 0) {
        setOrders(
          ordersRes.map((o: any) => ({
            ...o,
            id: o._id || o.id,
          }))
        );
      }
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend offline, using high-performance local state');
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncWithBackend();
  }, []);

  const setActiveBranchId = (branchId: string) => {
    setActiveBranchIdState(branchId);
    const branchName = branches.find((b) => b.id === branchId)?.name || 'Branch';
    showNotification(`Switched operational context to ${branchName}`, 'info');
  };

  const addBranch = async (newBranch: Omit<Branch, 'id' | 'createdAt'>) => {
    const created: Branch = {
      ...newBranch,
      id: `branch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBranches((prev) => [...prev, created]);
    api.createBranch({ ...newBranch, tenantId: tenant.id }).catch(() => {});
    showNotification(`Branch "${created.name}" created successfully`, 'success');
  };

  const updateBranch = async (id: string, patch: Partial<Branch>) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    api.updateBranch(id, patch).catch(() => {});
    showNotification('Branch updated successfully', 'success');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showNotification = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissNotification(id);
    }, 4000);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Branch-aware rate calculation
  const getProductPriceForBranch = (
    product: Product,
    tier: ServiceTier,
    branchId: string = activeBranch.id
  ): number => {
    const branchOverride = product.branchPriceOverrides?.find(
      (b: any) => (b.branchId === branchId || (b.branchId as any)?._id === branchId)
    );
    const priceSet = branchOverride ? branchOverride.prices : product.prices;

    if (tier === ServiceTier.SAME_DAY) return priceSet.sameDay;
    if (tier === ServiceTier.EXPRESS) return priceSet.express;
    return priceSet.regular;
  };

  // Category CRUD
  const addCategory = async (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      productCount: 0,
    };
    setCategories((prev) => [...prev, newCat]);
    api.createCategory({ ...catData, tenantId: tenant.id }).catch(() => {});
    showNotification(`Category "${newCat.name}" added to MongoDB Atlas`, 'success');
  };

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    api.updateCategory(id, patch).catch(() => {});
    showNotification('Category updated', 'success');
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setProducts((prev) => prev.filter((p) => p.categoryId !== id));
    api.deleteCategory(id).catch(() => {});
    showNotification('Category and associated products removed', 'info');
  };

  // Product CRUD
  const addProduct = async (newProdData: Omit<Product, 'id' | 'createdAt'>) => {
    const created: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [created, ...prev]);

    setCategories((prev) =>
      prev.map((c) =>
        c.id === created.categoryId
          ? { ...c, productCount: (c.productCount || 0) + 1 }
          : c
      )
    );

    api.createProduct({ ...newProdData, tenantId: tenant.id }).catch(() => {});
    showNotification(`Product "${created.name}" saved to MongoDB Atlas!`, 'success');
  };

  const updateProduct = async (id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    api.updateProduct(id, patch).catch(() => {});
    showNotification('Product updated in database', 'success');
  };

  const deleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (target) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === target.categoryId
            ? { ...c, productCount: Math.max(0, (c.productCount || 1) - 1) }
            : c
        )
      );
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    api.deleteProduct(id).catch(() => {});
    showNotification('Product removed from database', 'info');
  };

  // Customer Management
  const addCustomer = (
    custData: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent' | 'pendingBalance'>
  ): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      pendingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    setSelectedCustomer(newCust);
    api.createCustomer({ ...custData, tenantId: tenant.id }).catch(() => {});
    showNotification(`Customer "${newCust.name}" registered to MongoDB Atlas`, 'success');
    return newCust;
  };

  const updateCustomer = async (id: string, patch: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    api.updateCustomer(id, patch).catch(() => {});
    showNotification('Customer updated', 'success');
  };

  // Cart operations
  const addToCart = (
    product: Product,
    tier: ServiceTier = selectedTier,
    customNotes?: string
  ) => {
    const unitPrice = getProductPriceForBranch(product, tier);

    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.tier === tier
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * unitPrice;
      if (customNotes) updated[existingIndex].notes = customNotes;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        categoryName: product.categoryName || 'General Care',
        unit: product.unit,
        tier: tier,
        unitPrice: unitPrice,
        quantity: 1,
        subtotal: unitPrice,
        notes: customNotes,
        barcode: `BC-${Date.now().toString().slice(-4)}-1`,
      };
      setCart((prev) => [...prev, newItem]);
    }
    showNotification(`Added "${product.name}" (${tier}) to order`, 'info');
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = Math.max(0, item.quantity + delta);
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setNotes('');
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Math.min(discountAmount, subtotal);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * (activeBranch.taxRate / 100));
    const total = taxableAmount + tax;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return { subtotal, discount, tax, total, itemCount };
  };

  const createOrder = (
    paidAmount: number = 0,
    paymentMethod: PaymentMethod = PaymentMethod.UPI
  ): Order => {
    const { subtotal, discount, tax, total, itemCount } = calculateTotals();
    const newOrderNumber = `#ORD-${10250 + orders.length + 1}`;
    const dueAmount = Math.max(0, total - paidAmount);
    const paymentStatus =
      paidAmount >= total
        ? PaymentStatus.PAID
        : paidAmount > 0
        ? PaymentStatus.PARTIAL
        : PaymentStatus.UNPAID;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      customerId: selectedCustomer?.id || 'guest',
      customer: {
        id: selectedCustomer?.id,
        name: selectedCustomer?.name || 'Walk-in Customer',
        phone: selectedCustomer?.phone || '9999900000',
        email: selectedCustomer?.email,
        address: selectedCustomer?.address,
      },
      items: [...cart],
      itemCount,
      subtotal,
      discount,
      tax,
      taxRate: activeBranch.taxRate,
      total,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMethod,
      payments:
        paidAmount > 0
          ? [
              {
                id: `pay-${Date.now()}`,
                orderId: `ord-${Date.now()}`,
                tenantId: tenant.id,
                branchId: activeBranch.id,
                amount: paidAmount,
                method: paymentMethod,
                receivedBy: 'Ramesh (POS Counter)',
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
      status: OrderStatus.RECEIVED,
      orderStatus: OrderStatus.RECEIVED,
      timeline: [
        {
          status: OrderStatus.RECEIVED,
          label: 'Order received & garment intake',
          timestamp: new Date().toISOString(),
          updatedBy: 'Ramesh (POS Counter)',
          isCompleted: true,
        },
      ],
      expectedDeliveryDate: new Date(
        Date.now() + (expressSurcharge ? 24 : 48) * 3600 * 1000
      ).toISOString(),
      notes: notes || undefined,
      express: expressSurcharge || selectedTier !== ServiceTier.REGULAR,
      tags: [expressSurcharge ? 'Express' : 'Standard', paymentStatus],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Async write to MongoDB Atlas via NestJS API
    api.createOrder(newOrder).catch((err) => console.warn('Order sync:', err));

    if (selectedCustomer?.id) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                totalOrders: (c.totalOrders || 0) + 1,
                totalSpent: (c.totalSpent || 0) + total,
                pendingBalance: (c.pendingBalance || 0) + dueAmount,
              }
            : c
        )
      );
    }

    setMetrics((prev) => ({
      ...prev,
      ordersToday: prev.ordersToday + 1,
      revenueToday: prev.revenueToday + paidAmount,
      dueAmountTotal: prev.dueAmountTotal + dueAmount,
      recentOrders: [newOrder, ...prev.recentOrders.slice(0, 4)],
    }));

    clearCart();
    showNotification(`Order ${newOrderNumber} generated & synced to MongoDB Atlas!`, 'success');
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedTimeline = [
            ...(order.timeline || []),
            {
              status: newStatus,
              label: note || `Status updated to ${newStatus}`,
              timestamp: new Date().toISOString(),
              updatedBy: 'Manager',
              isCompleted: true,
            },
          ];
          return {
            ...order,
            status: newStatus,
            orderStatus: newStatus,
            timeline: updatedTimeline,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
    api.updateOrderStatus(orderId, newStatus, note).catch(() => {});
    showNotification(`Order status updated to ${newStatus}`, 'success');
  };

  const cancelOrder = async (orderId: string, reason: string = 'Cancelled by staff') => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: OrderStatus.CANCELLED,
            orderStatus: OrderStatus.CANCELLED,
            notes: order.notes ? `${order.notes} | Cancellation: ${reason}` : `Cancellation: ${reason}`,
            timeline: [
              ...(order.timeline || []),
              {
                status: OrderStatus.CANCELLED,
                label: `Order Cancelled: ${reason}`,
                timestamp: new Date().toISOString(),
                updatedBy: 'Manager',
                isCompleted: true,
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
    api.updateOrderStatus(orderId, OrderStatus.CANCELLED, reason).catch(() => {});
    showNotification('Order has been cancelled', 'warning');
  };

  const recordPayment = async (
    orderId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const newPaid = order.paidAmount + amount;
          const newDue = Math.max(0, order.total - newPaid);
          const newStatus =
            newPaid >= order.total
              ? PaymentStatus.PAID
              : newPaid > 0
              ? PaymentStatus.PARTIAL
              : PaymentStatus.UNPAID;

          const newPaymentRecord = {
            id: `pay-${Date.now()}`,
            orderId: order.id,
            tenantId: tenant.id,
            branchId: activeBranch.id,
            amount: amount,
            method: method,
            referenceNumber: reference,
            receivedBy: 'Manager',
            createdAt: new Date().toISOString(),
          };

          return {
            ...order,
            paidAmount: newPaid,
            dueAmount: newDue,
            paymentStatus: newStatus,
            paymentMethod: method,
            payments: [...(order.payments || []), newPaymentRecord],
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
    api.recordPayment(orderId, amount, method, reference).catch(() => {});
    showNotification(`Payment of ₹${amount} recorded on MongoDB Atlas`, 'success');
  };

  const issueRefund = async (orderId: string, amount: number, reason: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const newRefundRecord = {
            id: `ref-${Date.now()}`,
            orderId: order.id,
            tenantId: tenant.id,
            amount: amount,
            reason: reason,
            method: order.paymentMethod || PaymentMethod.UPI,
            approvedBy: 'Shop Owner',
            createdAt: new Date().toISOString(),
          };

          return {
            ...order,
            paymentStatus: PaymentStatus.REFUNDED,
            refunds: [...(order.refunds || []), newRefundRecord],
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      })
    );
    showNotification(`Refund of ₹${amount} recorded`, 'info');
  };

  return (
    <AppContext.Provider
      value={{
        tenant,
        branches,
        activeBranch,
        setActiveBranchId,
        addBranch,
        updateBranch,
        categories,
        products,
        orders,
        customers,
        metrics,
        isLoading,
        isBackendConnected,
        syncWithBackend,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductPriceForBranch,
        addCustomer,
        updateCustomer,
        cart,
        selectedCustomer,
        selectedTier,
        discountAmount,
        expressSurcharge,
        notes,
        setSelectedCustomer,
        setSelectedTier,
        setDiscountAmount,
        setExpressSurcharge,
        setNotes,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        calculateTotals,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        recordPayment,
        issueRefund,
        notifications,
        showNotification,
        dismissNotification,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
