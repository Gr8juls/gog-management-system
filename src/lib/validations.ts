import { z } from 'zod';
import { CustomerType, Priority, JobStatus, InventoryCategory, StockTransactionType, InkReason, PaymentMethod } from './types';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const CustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  customerType: z.enum(['INDIVIDUAL', 'CORPORATE', 'SCHOOL', 'NGO', 'RESELLER']).default('INDIVIDUAL'),
  notes: z.string().optional().or(z.literal('')),
});

export const JobItemSchema = z.object({
  itemDescription: z.string().min(1, 'Item description required'),
  garmentType: z.string().optional().or(z.literal('')),
  brand: z.string().optional().or(z.literal('')),
  size: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
  quantityOrdered: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
});

export const JobCreateSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  requiredDate: z.string().min(1, 'Required completion date is required'),
  productType: z.string().min(1, 'Product type is required'),
  brandingMethod: z.string().min(1, 'Branding method is required'),
  designReference: z.string().optional().or(z.literal('')),
  assignedStaffId: z.string().optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  discount: z.number().default(0),
  tax: z.number().default(0),
  depositPaid: z.number().default(0),
  notes: z.string().optional().or(z.literal('')),
  labourCostEstimate: z.number().default(0),
  overheadCostEstimate: z.number().default(0),
  packagingCostEstimate: z.number().default(0),
  deliveryCostEstimate: z.number().default(0),
  items: z.array(JobItemSchema).min(1, 'At least one line item is required'),
});

export const DailyProductionSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  jobItemId: z.string().optional().or(z.literal('')),
  date: z.string().optional(),
  product: z.string().min(1, 'Product is required'),
  productionMethod: z.string().min(1, 'Production method is required'),
  quantityPlanned: z.number().int().nonnegative('Quantity planned must be >= 0'),
  quantityStarted: z.number().int().nonnegative('Quantity started must be >= 0'),
  quantityCompleted: z.number().int().nonnegative('Quantity completed must be >= 0'),
  quantityRejected: z.number().int().default(0),
  quantityDamaged: z.number().int().default(0),
  operatorId: z.string().optional().or(z.literal('')),
  workstation: z.string().optional().or(z.literal('')),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  qualityStatus: z.enum(['PASSED', 'REWORK', 'FAILED']).default('PASSED'),
  managerApproved: z.boolean().default(false),
});

export const InventoryItemSchema = z.object({
  sku: z.string().min(2, 'SKU is required'),
  name: z.string().min(2, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional().or(z.literal('')),
  unitOfMeasure: z.string().default('pcs'),
  garmentType: z.string().optional().or(z.literal('')),
  brand: z.string().optional().or(z.literal('')),
  size: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  openingStock: z.number().default(0),
  reorderLevel: z.number().default(10),
  maxStockLevel: z.number().optional().nullable(),
  unitCost: z.number().default(0),
  sellingPrice: z.number().optional().nullable(),
  supplierId: z.string().optional().or(z.literal('')),
  storageLocation: z.string().optional().or(z.literal('')),
});

export const StockTransactionSchema = z.object({
  inventoryItemId: z.string().min(1, 'Item is required'),
  type: z.string().min(1, 'Transaction type is required'),
  quantity: z.number().refine(n => n !== 0, 'Quantity cannot be zero'),
  unitCost: z.number().default(0),
  jobId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  reason: z.string().optional().or(z.literal('')),
  isApproved: z.boolean().default(true),
});

export const InkUsageSchema = z.object({
  jobId: z.string().optional().or(z.literal('')),
  inventoryItemId: z.string().min(1, 'Ink inventory item is required'),
  color: z.string().min(1, 'Color is required'),
  brand: z.string().optional().or(z.literal('')),
  inkType: z.string().optional().or(z.literal('')),
  quantityUsed: z.number().positive('Quantity used must be > 0'),
  quantityWasted: z.number().nonnegative().default(0),
  unitOfMeasure: z.string().default('ml'),
  reason: z.string().default('CUSTOMER_PRODUCTION'),
  notes: z.string().optional().or(z.literal('')),
});

export const MaterialIssueSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  quantityIssued: z.number().positive('Quantity issued must be > 0'),
  receivedById: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const MaterialReturnSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  quantityReturned: z.number().positive('Quantity returned must be > 0'),
  receivedById: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const SupplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  contactPerson: z.string().optional().or(z.literal('')),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  taxNumber: z.string().optional().or(z.literal('')),
  productsSupplied: z.string().optional().or(z.literal('')),
  paymentTerms: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const PurchaseCreateSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseDate: z.string().optional(),
  expectedPaymentDate: z.string().optional().or(z.literal('')),
  amountPaid: z.number().default(0),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(
    z.object({
      inventoryItemId: z.string().min(1, 'Item is required'),
      quantity: z.number().positive('Quantity must be > 0'),
      unitCost: z.number().positive('Unit cost must be > 0'),
    })
  ).min(1, 'At least one purchase item is required'),
});

export const PaymentSchema = z.object({
  jobId: z.string().min(1, 'Job is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CREDIT_CARD', 'CHEQUE']).default('CASH'),
  reference: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
