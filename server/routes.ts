import { generateSKU } from "../utils/sku.js";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import {
  insertProductSchema,
  insertCustomerSchema,
  insertSupplierSchema,
  insertTransactionSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Products
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string;
      const products = await storage.getProducts(search);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req, res) => {
    try {
      console.log("Creating product with data:", req.body);

      // تحويل القيم الرقمية إلى نصوص كما هو مطلوب في قاعدة البيانات
      const processedData = {
        ...req.body,
        price: req.body.price ? req.body.price.toString() : "0",
        cost: req.body.cost ? req.body.cost.toString() : undefined,
        quantity: req.body.quantity ? parseInt(req.body.quantity) : 0,
        minQuantity: req.body.minQuantity ? parseInt(req.body.minQuantity) : 5,
      };

      const productData = insertProductSchema.parse(processedData);
      console.log("Validated product data:", productData);

      const product = await storage.createProduct(productData);
      console.log("Created product:", product);

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors,
          receivedData: req.body 
        });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ 
        message: "Failed to create product", 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Barcode
  app.get('/api/products/barcode/:barcode', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProductByBarcode(req.params.barcode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Customers
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string;
      const customers = await storage.getCustomers(search);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const customerId = req.params.id;
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }

      const result = await storage.deleteCustomer(customerId);
      console.log(`Customer ${customerId} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      if (error instanceof Error && error.message?.includes('not found')) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  app.get('/api/customers/:id/debt', isAuthenticated, async (req, res) => {
    try {
      const debtStatus = await storage.getCustomerDebtStatus(req.params.id);
      if (!debtStatus) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(debtStatus);
    } catch (error) {
      console.error("Error fetching customer debt status:", error);
      res.status(500).json({ message: "Failed to fetch debt status" });
    }
  });

  app.post('/api/customers/:id/payment', isAuthenticated, async (req, res) => {
    try {
      const { amount, currency = 'TRY' } = req.body;
      const newDebt = await storage.updateCustomerDebt(req.params.id, amount, currency, 'subtract');
      if (newDebt === null) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ success: true, newDebt });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Suppliers
  app.get('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const search = req.query.search as string;
      const suppliers = await storage.getSuppliers(search);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get('/api/suppliers/:id/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getSupplierProducts(req.params.id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      res.status(500).json({ message: "Failed to fetch supplier products" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.get('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, supplierData);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      if (error instanceof Error && error.message === "Supplier not found") {
        return res.status(404).json({ message: "المورد غير موجود" });
      }
      res.status(500).json({ message: "فشل في حذف المورد" });
    }
  });

  // Transactions
  app.get('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      const transactions = await storage.getTransactions(limit, offset, search);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      console.log("=== Transaction Creation Started ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const { transaction, items } = req.body;

      // التحقق من وجود البيانات المطلوبة
      if (!transaction) {
        console.error("❌ Missing transaction data");
        return res.status(400).json({ message: "Missing transaction data" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        console.error("❌ Missing or empty items array");
        return res.status(400).json({ message: "Missing or empty items" });
      }

      console.log("✅ Transaction data:", transaction);
      console.log("✅ Items count:", items.length);
      console.log("✅ Items:", items);

      const now = new Date();
      const transactionNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;

      console.log("✅ Generated transaction number:", transactionNumber);

      const transactionData = insertTransactionSchema.parse({
        ...transaction,
        transactionNumber,
      });

      console.log("✅ Parsed transaction data:", transactionData);

      const newTransaction = await storage.createTransaction(transactionData);
      console.log("✅ Created transaction:", newTransaction);

      if (Array.isArray(items) && items.length > 0) {
        console.log("📦 Creating transaction items...");
        for (const item of items) {
          console.log("Creating item:", item);
          await storage.createTransactionItem({
            ...item,
            transactionId: newTransaction.id,
          });
        }
        console.log("✅ All items created successfully");
      }

      // If payment type is credit and customer exists, update debt
      if (transactionData.paymentType === 'credit' && transactionData.customerId) {
        console.log("💳 Updating customer debt...");
        await storage.updateCustomerDebt(
          transactionData.customerId, 
          transactionData.total, 
          transactionData.currency || 'TRY',
          'add'
        );
        console.log("✅ Customer debt updated");
      }

      console.log("=== Transaction Creation Completed Successfully ===");
      res.status(201).json(newTransaction);
    } catch (error) {
      console.log("=== Transaction Creation Failed ===");
      console.error("❌ Full error:", error);
      console.error("❌ Error message:", error instanceof Error ? error.message : "Unknown error");
      console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
      
      if (error instanceof z.ZodError) {
        console.error("❌ Zod validation errors:", error.errors);
        return res.status(400).json({
          message: "Invalid transaction data",
          errors: error.errors,
          receivedData: req.body
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create transaction",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Payment endpoint
  app.post("/api/payments", async (req, res) => {
    try {
      const { amount, transactionId, customerId } = req.body;

      if (!amount || !transactionId || !customerId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Assuming 'storage' has a method to fetch a transaction by ID
      const transaction = await storage.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const currentTotal = parseFloat(transaction.total || "0");
      const paymentAmount = parseFloat(amount);
      const newTotal = currentTotal - paymentAmount;

      // Update transaction
      const updatedTransaction = await storage.updateTransaction(transactionId, {
        total: newTotal.toString(),
        status: newTotal === 0 ? "completed" : "pending",
      });

      if (!updatedTransaction) {
        return res.status(500).json({ error: "Failed to update transaction" });
      }

      // Update customer debt
      const customer = await storage.getCustomer(customerId);
      if (customer) {
        const currentDebt = parseFloat(customer.totalDebt || "0");
        const newDebt = Math.max(0, currentDebt - paymentAmount);

        await storage.updateCustomer(customerId, {
          totalDebt: newDebt.toString(),
        });

        // إنشاء سجل تحصيل دين
        const now = new Date();
        const transactionNumber = `PAYMENT-${now.getFullYear()}${(now.getMonth() + 1)
          .toString()
          .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random()
          .toString(36)
          .substr(2, 6)
          .toUpperCase()}`;

        const debtCollectionTransaction = insertTransactionSchema.parse({
          transactionNumber,
          customerId: customer.id,
          customerName: customer.name,
          total: `-${paymentAmount}`, // مبلغ سالب للدلالة على التحصيل
          discount: "0",
          tax: "0",
          paymentType: "debt_collection",
          currency: transaction.currency || "TRY",
          status: "completed",
          transactionType: "debt_collection",
        });

        await storage.createTransaction(debtCollectionTransaction);
      }

      res.json({ 
        success: true, 
        remainingAmount: newTotal,
        amount: paymentAmount,
        message: newTotal === 0 ? "Payment completed" : "Partial payment recorded"
      });
    } catch (error) {
      console.error("Payment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}