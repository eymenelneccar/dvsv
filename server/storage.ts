import {
  users,
  products,
  customers,
  suppliers,
  transactions,
  transactionItems,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Supplier,
  type InsertSupplier,
  type Transaction,
  type InsertTransaction,
  type TransactionItem,
  type InsertTransactionItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, like, and, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getProducts(search?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;

  getCustomers(search?: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  getSuppliers(search?: string): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  getSupplierProducts(supplierId: string): Promise<Product[]>;

  getTransactions(limit?: number, offset?: number, search?: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transactionData: InsertTransaction): Promise<Transaction>;
  createTransactionItem(item: InsertTransactionItem): Promise<TransactionItem>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction>;

  getDashboardMetrics(): Promise<{
    totalSales: number;
    totalOrders: number;
    activeProducts: number;
    newCustomers: number;
    lowStockCount: number;
    pendingOrders: number;
    activeCustomers: number;
    returns: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser) {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProducts(search?: string) {
    if (search) {
      return await db
        .select()
        .from(products)
        .where(
          sql`${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`} OR ${products.barcode} ILIKE ${`%${search}%`}`
        )
        .orderBy(desc(products.createdAt));
    }
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductByBarcode(barcode: string) {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product;
  }

  async getProduct(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct) {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>) {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string) {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts() {
    return await db
      .select()
      .from(products)
      .where(sql`${products.quantity} <= ${products.minQuantity}`)
      .orderBy(products.quantity);
  }

  async getCustomers(search?: string) {
    if (search) {
      return await db
        .select()
        .from(customers)
        .where(like(customers.name, `%${search}%`))
        .orderBy(desc(customers.createdAt));
    }
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByName(name: string) {
    const [customer] = await db.select().from(customers).where(eq(customers.name, name));
    return customer;
  }

  async createCustomer(customer: InsertCustomer) {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>) {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async updateCustomerDebt(customerId: string, amount: string, currency: string, operation: 'add' | 'subtract' = 'add') {
    const customer = await this.getCustomer(customerId);
    if (!customer) return null;

    // Convert amount to TRY if needed (approximate rate: 1 USD = 33 TRY)
    let amountInTRY = parseFloat(amount);
    if (currency === 'USD') {
      amountInTRY = amountInTRY * 33;
    }

    const currentDebt = parseFloat(customer.totalDebt || "0");
    const newDebt = operation === 'add' ? currentDebt + amountInTRY : currentDebt - amountInTRY;

    await db.update(customers)
      .set({ 
        totalDebt: Math.max(0, newDebt).toString(),
        debtCurrency: "TRY",
        updatedAt: new Date()
      })
      .where(eq(customers.id, customerId));

    return newDebt;
  }

  async getCustomerDebtStatus(customerId: string) {
    const customer = await this.getCustomer(customerId);
    if (!customer) return null;

    const debt = parseFloat(customer.totalDebt || "0");
    const debtLimitTRY = 5000;
    const debtLimitUSD = 150;

    return {
      debt,
      currency: customer.debtCurrency || "TRY",
      isOverLimit: debt >= debtLimitTRY,
      debtInUSD: debt / 33,
      isOverLimitUSD: (debt / 33) >= debtLimitUSD
    };
  }

  async getSuppliers(search?: string) {
    if (search) {
      return await db
        .select()
        .from(suppliers)
        .where(like(suppliers.name, `%${search}%`))
        .orderBy(desc(suppliers.createdAt));
    }
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string) {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier) {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>) {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      // أولاً، احذف جميع المنتجات المرتبطة بهذا المورد
      const supplierProducts = await db
        .select()
        .from(products)
        .where(eq(products.supplierId, id));

      if (supplierProducts.length > 0) {
        await db
          .delete(products)
          .where(eq(products.supplierId, id));
      }

      // ثم احذف المورد
      const result = await db.delete(suppliers).where(eq(suppliers.id, id));

      if (result.rowCount === 0) {
        throw new Error("المورد غير موجود");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      throw error;
    }
  }

  async getSupplierProducts(supplierId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.supplierId, supplierId),
        eq(products.isActive, true)
      ))
      .orderBy(desc(products.createdAt));
  }

  async getTransactions(limit: number = 50, offset: number = 0, search?: string) {
    if (search) {
      return await db
        .select()
        .from(transactions)
        .where(
          or(
            like(transactions.transactionNumber, `%${search}%`),
            like(transactions.customerName, `%${search}%`)
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(desc(transactions.createdAt));
    }

    return await db
      .select()
      .from(transactions)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(transactions.createdAt));
  }

  async getTransaction(id: string) {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const lastTransaction = await db
      .select({ number: transactions.transactionNumber })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    let newNumber = 1;

    if (lastTransaction.length > 0) {
      const lastNumber = parseInt(
        lastTransaction[0].number?.replace("INV-", "") || "0",
        10
      );
      newNumber = lastNumber + 1;
    }

    const transactionNumber = `INV-${newNumber.toString().padStart(3, "0")}`;

    const [transaction] = await db
      .insert(transactions)
      .values({
        transactionNumber,
        ...transactionData,
        updatedAt: new Date(),
      })
      .returning();

    return transaction;
  }

  async createTransactionItem(item: InsertTransactionItem) {
    const [newItem] = await db.insert(transactionItems).values(item).returning();
    return newItem;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>) {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async getDashboardMetrics() {
    const totalSalesResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.total}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "completed"),
          sql`EXTRACT(MONTH FROM ${transactions.createdAt}) = EXTRACT(MONTH FROM CURRENT_DATE)`
        )
      );

    const totalOrdersResult = await db.select({ count: sql<number>`count(*)` }).from(transactions);

    const activeProductsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));

    const newCustomersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(sql`EXTRACT(MONTH FROM ${customers.createdAt}) = EXTRACT(MONTH FROM CURRENT_DATE)`);

    const lowStockResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.quantity} <= ${products.minQuantity}`);

    const pendingOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.status, "pending"));

    const activeCustomersResult = await db
      .select({ count: sql<number>`count(DISTINCT ${transactions.customerId})` })
      .from(transactions)
      .where(sql`EXTRACT(MONTH FROM ${transactions.createdAt}) = EXTRACT(MONTH FROM CURRENT_DATE)`);

    const returnsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(eq(transactions.status, "cancelled"));

    return {
      totalSales: totalSalesResult[0]?.total || 0,
      totalOrders: totalOrdersResult[0]?.count || 0,
      activeProducts: activeProductsResult[0]?.count || 0,
      newCustomers: newCustomersResult[0]?.count || 0,
      lowStockCount: lowStockResult[0]?.count || 0,
      pendingOrders: pendingOrdersResult[0]?.count || 0,
      activeCustomers: activeCustomersResult[0]?.count || 0,
      returns: returnsResult[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();