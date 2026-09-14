// Enums and type definitions for GOG Management System

export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  PRODUCTION: 'PRODUCTION',
  INVENTORY: 'INVENTORY',
} as const;
export type Role = typeof Role[keyof typeof Role];

export const JobStatus = {
  QUOTATION: 'QUOTATION',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  MATERIALS_RESERVED: 'MATERIALS_RESERVED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  QUALITY_CHECK: 'QUALITY_CHECK',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type Priority = typeof Priority[keyof typeof Priority];

export const CustomerType = {
  INDIVIDUAL: 'INDIVIDUAL',
  CORPORATE: 'CORPORATE',
  SCHOOL: 'SCHOOL',
  NGO: 'NGO',
  RESELLER: 'RESELLER',
} as const;
export type CustomerType = typeof CustomerType[keyof typeof CustomerType];

export const InventoryCategory = {
  BLANK_TSHIRTS: 'BLANK_TSHIRTS',
  OTHER_GARMENTS: 'OTHER_GARMENTS',
  INK: 'INK',
  DTF_POWDER: 'DTF_POWDER',
  TRANSFER_FILM: 'TRANSFER_FILM',
  VINYL: 'VINYL',
  SUBLIMATION_PAPER: 'SUBLIMATION_PAPER',
  STICKER_PAPER: 'STICKER_PAPER',
  BANNER_MATERIAL: 'BANNER_MATERIAL',
  PACKAGING: 'PACKAGING',
  CLEANING_SUPPLIES: 'CLEANING_SUPPLIES',
  SPARE_PARTS: 'SPARE_PARTS',
  OTHER: 'OTHER',
} as const;
export type InventoryCategory = typeof InventoryCategory[keyof typeof InventoryCategory];

export const StockTransactionType = {
  OPENING_BALANCE: 'OPENING_BALANCE',
  PURCHASE_RECEIPT: 'PURCHASE_RECEIPT',
  ISSUE_TO_PRODUCTION: 'ISSUE_TO_PRODUCTION',
  RETURN_FROM_PRODUCTION: 'RETURN_FROM_PRODUCTION',
  SALE: 'SALE',
  DAMAGE: 'DAMAGE',
  WASTAGE: 'WASTAGE',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
  STOCK_COUNT_CORRECTION: 'STOCK_COUNT_CORRECTION',
} as const;
export type StockTransactionType = typeof StockTransactionType[keyof typeof StockTransactionType];

export const InkReason = {
  CUSTOMER_PRODUCTION: 'CUSTOMER_PRODUCTION',
  TEST_PRINT: 'TEST_PRINT',
  CLEANING: 'CLEANING',
  SPILLAGE: 'SPILLAGE',
  FAILED_PRINT: 'FAILED_PRINT',
  OTHER: 'OTHER',
} as const;
export type InkReason = typeof InkReason[keyof typeof InkReason];

export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_MONEY: 'MOBILE_MONEY',
  CREDIT_CARD: 'CREDIT_CARD',
  CHEQUE: 'CHEQUE',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERPAID: 'OVERPAID',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const BrandingMethod = {
  SCREEN_PRINTING: 'Screen printing',
  DTF: 'DTF',
  DTG: 'DTG',
  HEAT_TRANSFER: 'Heat transfer',
  SUBLIMATION: 'Sublimation',
  EMBROIDERY: 'Embroidery',
  VINYL_CUTTING: 'Vinyl cutting',
  LARGE_FORMAT: 'Large-format printing',
  OTHER: 'Other',
} as const;

export const ProductType = {
  TSHIRTS: 'T-shirts',
  POLO_SHIRTS: 'Polo shirts',
  CAPS: 'Caps',
  MUGS: 'Mugs',
  BANNERS: 'Banners',
  STICKERS: 'Stickers',
  SIGNAGE: 'Signage',
  BUSINESS_CARDS: 'Business cards',
  FLYERS: 'Flyers',
  LABELS: 'Labels',
  HOODIES: 'Hoodies',
  OTHER: 'Other customized products',
} as const;
