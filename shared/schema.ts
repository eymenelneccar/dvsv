import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("employee"), // admin, employee
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products/Inventory table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  sku: varchar("sku").unique().notNull(),
  barcode: varchar("barcode").unique(),
  category: varchar("category"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  currency: varchar("currency").default("TRY"), // TRY, USD
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  quantity: integer("quantity").default(0),
  minQuantity: integer("min_quantity").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  totalDebt: decimal("total_debt", { precision: 10, scale: 2 }).default("0"),
  debtCurrency: varchar("debt_currency").default("TRY"), // TRY, USD
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionNumber: varchar("transaction_number").unique().notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: varchar("customer_name").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  paymentType: varchar("payment_type").default("cash"), // cash, credit, debt_collection
  currency: varchar("currency").default("TRY"), // TRY, USD
  status: varchar("status").default("completed"), // completed, pending, cancelled
  transactionType: varchar("transaction_type").default("sale"), // sale, debt_collection
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction items table
export const transactionItems = pgTable("transaction_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").references(() => transactions.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  productName: varchar("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Insert schemas
export const insertProductSchema = createInsertSchema(products)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    price: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? val : val.toString()
    ),
    cost: z.union([z.string(), z.number()]).optional().transform(val => 
      val === undefined ? val : (typeof val === 'string' ? val : val.toString())
    ),
  });

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  transactionNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  paymentType: z.enum(["cash", "credit", "debt_collection"]).default("cash"),
  currency: z.enum(["TRY", "USD"]).default("TRY"),
  transactionType: z.enum(["sale", "debt_collection"]).default("sale"),
});

export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  taxNumber: varchar("tax_number"),
  paymentTerms: varchar("payment_terms"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
