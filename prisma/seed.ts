import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GOG Management System seeding...');

  // Clean existing records in reverse dependency order
  await prisma.payment.deleteMany();
  await prisma.materialReturn.deleteMany();
  await prisma.materialIssue.deleteMany();
  await prisma.inkUsage.deleteMany();
  await prisma.dailyProduction.deleteMany();
  await prisma.jobItem.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.job.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 1. Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'COMPANY_NAME', value: 'GOG Printing & Branding Ltd', description: 'Business Legal Name' },
      { key: 'HOURLY_LABOUR_RATE', value: '15.00', description: 'Standard hourly labour cost estimate' },
      { key: 'DEFAULT_OVERHEAD_PERCENT', value: '12.5', description: 'Factory overhead cost percentage' },
      { key: 'CURRENCY', value: 'USD', description: 'Base accounting currency' },
    ],
  });

  // 2. Create Demo Users
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const managerHash = await bcrypt.hash('Manager@123', 10);
  const salesHash = await bcrypt.hash('Sales@123', 10);
  const prodHash = await bcrypt.hash('Production@123', 10);
  const invHash = await bcrypt.hash('Inventory@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gog.com',
      passwordHash,
      name: 'Alex Mugisha (Admin)',
      role: 'ADMIN',
      phone: '+250 788 111 001',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@gog.com',
      passwordHash: managerHash,
      name: 'Claire Uwase (Manager)',
      role: 'MANAGER',
      phone: '+250 788 111 002',
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: 'sales@gog.com',
      passwordHash: salesHash,
      name: 'David Karekezi (Sales)',
      role: 'SALES',
      phone: '+250 788 111 003',
    },
  });

  const production = await prisma.user.create({
    data: {
      email: 'production@gog.com',
      passwordHash: prodHash,
      name: 'Eric Niyonshuti (Production)',
      role: 'PRODUCTION',
      phone: '+250 788 111 004',
    },
  });

  const inventory = await prisma.user.create({
    data: {
      email: 'inventory@gog.com',
      passwordHash: invHash,
      name: 'Grace Mutoni (Inventory)',
      role: 'INVENTORY',
      phone: '+250 788 111 005',
    },
  });

  console.log('👤 Created 5 standard user roles.');

  // 3. Create Suppliers
  const supplierGarments = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-001',
      name: 'Apex Premium Apparel Ltd',
      contactPerson: 'Robert Mugabe',
      phone: '+250 788 222 101',
      email: 'orders@apexapparel.co',
      address: 'Industrial Zone, Plot 45, Kigali',
      paymentTerms: 'Net 30',
      productsSupplied: 'Blank T-Shirts, Polo Shirts, Hoodies, Caps',
    },
  });

  const supplierInks = await prisma.supplier.create({
    data: {
      supplierCode: 'SUP-002',
      name: 'East Africa Digital Inks',
      contactPerson: 'Sarah Jenkins',
      phone: '+254 711 333 202',
      email: 'supply@eadigitalinks.com',
      address: 'Enterprise Road, Nairobi',
      paymentTerms: 'Immediate / Bank Transfer',
      productsSupplied: 'DTF Inks, Powders, Sublimation Inks, Cleaning Solutions',
    },
  });

  // 4. Create Inventory Items (T-shirts, Inks, Films, Consumables)
  const inventoryItemsData = [
    // Blank T-Shirts
    {
      sku: 'TSH-BLK-M',
      name: 'Round-neck T-Shirt - Black / Medium',
      category: 'BLANK_TSHIRTS',
      unitOfMeasure: 'pcs',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'M',
      color: 'Black',
      gender: 'Unisex',
      openingStock: 250,
      currentStock: 250,
      reorderLevel: 50,
      unitCost: 3.50,
      sellingPrice: 8.00,
      supplierId: supplierGarments.id,
      storageLocation: 'Aisle 1 - Shelf B2',
    },
    {
      sku: 'TSH-BLK-L',
      name: 'Round-neck T-Shirt - Black / Large',
      category: 'BLANK_TSHIRTS',
      unitOfMeasure: 'pcs',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'L',
      color: 'Black',
      gender: 'Unisex',
      openingStock: 200,
      currentStock: 200,
      reorderLevel: 40,
      unitCost: 3.50,
      sellingPrice: 8.00,
      supplierId: supplierGarments.id,
      storageLocation: 'Aisle 1 - Shelf B3',
    },
    {
      sku: 'TSH-WHT-M',
      name: 'Round-neck T-Shirt - White / Medium',
      category: 'BLANK_TSHIRTS',
      unitOfMeasure: 'pcs',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'M',
      color: 'White',
      gender: 'Unisex',
      openingStock: 300,
      currentStock: 300,
      reorderLevel: 50,
      unitCost: 3.20,
      sellingPrice: 7.50,
      supplierId: supplierGarments.id,
      storageLocation: 'Aisle 1 - Shelf A2',
    },
    {
      sku: 'TSH-WHT-L',
      name: 'Round-neck T-Shirt - White / Large',
      category: 'BLANK_TSHIRTS',
      unitOfMeasure: 'pcs',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'L',
      color: 'White',
      gender: 'Unisex',
      openingStock: 180,
      currentStock: 180,
      reorderLevel: 40,
      unitCost: 3.20,
      sellingPrice: 7.50,
      supplierId: supplierGarments.id,
      storageLocation: 'Aisle 1 - Shelf A3',
    },
    {
      sku: 'TSH-NVY-L',
      name: 'Round-neck T-Shirt - Navy Blue / Large',
      category: 'BLANK_TSHIRTS',
      unitOfMeasure: 'pcs',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'L',
      color: 'Navy Blue',
      gender: 'Unisex',
      openingStock: 35, // Low stock demo!
      currentStock: 35,
      reorderLevel: 40,
      unitCost: 3.60,
      sellingPrice: 8.50,
      supplierId: supplierGarments.id,
      storageLocation: 'Aisle 1 - Shelf C2',
    },
    {
      sku: 'POLO-WHT-L',
      name: 'Polo Pique Shirt - White / Large',
      category: 'OTHER_GARMENTS',
      unitOfMeasure: 'pcs',
      garmentType: 'Polo',
      brand: 'US Polo Style',
      size: 'L',
      color: 'White',
      gender: 'Unisex',
      openingStock: 120,
      currentStock: 120,
      reorderLevel: 25,
      unitCost: 6.50,
      sellingPrice: 14.00,
      supplierId: supplierGarments.id,
      storageLocation: 'Aisle 2 - Shelf D1',
    },
    // Inks
    {
      sku: 'INK-DTF-WHT',
      name: 'DTF Premium Textile Ink - White',
      category: 'INK',
      unitOfMeasure: 'ml',
      openingStock: 5000,
      currentStock: 5000,
      reorderLevel: 1000,
      unitCost: 0.05, // $50 per 1000ml bottle
      supplierId: supplierInks.id,
      storageLocation: 'Chemical Cabinet - Shelf 1',
    },
    {
      sku: 'INK-DTF-CYN',
      name: 'DTF Premium Textile Ink - Cyan',
      category: 'INK',
      unitOfMeasure: 'ml',
      openingStock: 3000,
      currentStock: 3000,
      reorderLevel: 800,
      unitCost: 0.045,
      supplierId: supplierInks.id,
      storageLocation: 'Chemical Cabinet - Shelf 1',
    },
    {
      sku: 'INK-DTF-MAG',
      name: 'DTF Premium Textile Ink - Magenta',
      category: 'INK',
      unitOfMeasure: 'ml',
      openingStock: 2500,
      currentStock: 2500,
      reorderLevel: 800,
      unitCost: 0.045,
      supplierId: supplierInks.id,
      storageLocation: 'Chemical Cabinet - Shelf 1',
    },
    {
      sku: 'INK-DTF-YEL',
      name: 'DTF Premium Textile Ink - Yellow',
      category: 'INK',
      unitOfMeasure: 'ml',
      openingStock: 2800,
      currentStock: 2800,
      reorderLevel: 800,
      unitCost: 0.045,
      supplierId: supplierInks.id,
      storageLocation: 'Chemical Cabinet - Shelf 1',
    },
    {
      sku: 'INK-DTF-BLK',
      name: 'DTF Premium Textile Ink - Black',
      category: 'INK',
      unitOfMeasure: 'ml',
      openingStock: 4000,
      currentStock: 4000,
      reorderLevel: 1000,
      unitCost: 0.045,
      supplierId: supplierInks.id,
      storageLocation: 'Chemical Cabinet - Shelf 1',
    },
    // Consumables & Films
    {
      sku: 'FILM-DTF-60CM',
      name: 'DTF PET Transfer Film 60cm x 100m Roll',
      category: 'TRANSFER_FILM',
      unitOfMeasure: 'rolls',
      openingStock: 15,
      currentStock: 15,
      reorderLevel: 3,
      unitCost: 85.00,
      supplierId: supplierInks.id,
      storageLocation: 'Roll Rack A',
    },
    {
      sku: 'POW-DTF-POLY',
      name: 'DTF Hot Melt Adhesive Powder (White) 1kg',
      category: 'DTF_POWDER',
      unitOfMeasure: 'kg',
      openingStock: 25,
      currentStock: 25,
      reorderLevel: 5,
      unitCost: 18.00,
      supplierId: supplierInks.id,
      storageLocation: 'Chemical Cabinet - Shelf 3',
    },
  ];

  const createdInventoryMap = new Map<string, any>();
  for (const item of inventoryItemsData) {
    const record = await prisma.inventoryItem.create({ data: item });
    createdInventoryMap.set(item.sku, record);

    // Record Opening Balance Stock Transaction
    await prisma.stockTransaction.create({
      data: {
        transactionNumber: `TXN-OPN-${item.sku}`,
        inventoryItemId: record.id,
        type: 'OPENING_BALANCE',
        quantity: item.openingStock,
        unitCost: item.unitCost,
        balanceAfter: item.openingStock,
        referenceType: 'MANUAL',
        notes: 'Initial opening stock ledger entry',
        createdById: admin.id,
        isApproved: true,
      },
    });
  }

  console.log(`📦 Seeded ${inventoryItemsData.length} inventory catalog items with opening balances.`);

  // 5. Create Customers
  const cust1 = await prisma.customer.create({
    data: {
      customerNumber: 'CUST-001',
      name: 'Kigali Marathon Organizing Committee',
      phone: '+250 788 555 100',
      email: 'events@kigalimarathon.rw',
      address: 'Amahoro Stadium Offices, Remera, Kigali',
      customerType: 'CORPORATE',
      notes: 'Annual premium sponsor contract',
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      customerNumber: 'CUST-002',
      name: 'Green Hills Academy Tech Club',
      phone: '+250 788 444 200',
      email: 'techclub@greenhills.edu.rw',
      address: 'Nyarutarama, Kigali',
      customerType: 'SCHOOL',
      notes: 'Prefers 100% heavy cotton shirts',
    },
  });

  const cust3 = await prisma.customer.create({
    data: {
      customerNumber: 'CUST-003',
      name: 'Safari Tech Innovators',
      phone: '+250 788 777 300',
      email: 'branding@safaritech.io',
      address: 'Norrsken House Kigali',
      customerType: 'CORPORATE',
    },
  });

  console.log('🏢 Seeded 3 active customers.');

  // 6. Create Jobs
  // Job 1: In Production (T-shirts)
  const job1Date = new Date();
  const job1Required = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead
  const job1 = await prisma.job.create({
    data: {
      jobNumber: 'GOG-000001',
      customerId: cust1.id,
      dateReceived: job1Date,
      requiredDate: job1Required,
      productType: 'T-shirts',
      brandingMethod: 'DTF',
      designReference: 'KM-2026-RUNNERS-CREW',
      assignedStaffId: production.id,
      priority: 'HIGH',
      status: 'IN_PRODUCTION',
      totalAmount: 700.00,
      discount: 20.00,
      tax: 0,
      depositPaid: 400.00,
      balanceDue: 280.00,
      notes: 'Two prints per shirt: Chest logo (8cm) + Full Back runner number',
      labourCostEstimate: 50.00,
      overheadCostEstimate: 35.00,
      packagingCostEstimate: 15.00,
      deliveryCostEstimate: 10.00,
    },
  });

  // Line item 1: 50 Black Medium
  const item1A = await prisma.jobItem.create({
    data: {
      jobId: job1.id,
      itemDescription: 'Runners Crew T-Shirt - Black / M',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'M',
      color: 'Black',
      quantityOrdered: 50,
      quantityCompleted: 35,
      quantityRejected: 2,
      quantityDamaged: 1,
      quantityPending: 12,
      unitPrice: 7.00,
      totalPrice: 350.00,
    },
  });

  // Line item 2: 50 Black Large
  const item1B = await prisma.jobItem.create({
    data: {
      jobId: job1.id,
      itemDescription: 'Runners Crew T-Shirt - Black / L',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'L',
      color: 'Black',
      quantityOrdered: 50,
      quantityCompleted: 20,
      quantityRejected: 1,
      quantityDamaged: 0,
      quantityPending: 29,
      unitPrice: 7.00,
      totalPrice: 350.00,
    },
  });

  // Issue materials for Job 1
  const tBlackM = createdInventoryMap.get('TSH-BLK-M');
  const tBlackL = createdInventoryMap.get('TSH-BLK-L');

  await prisma.materialIssue.create({
    data: {
      issueNumber: 'ISSUE-000001',
      jobId: job1.id,
      inventoryItemId: tBlackM.id,
      quantityIssued: 50,
      issuedById: inventory.id,
      receivedById: production.id,
      notes: '50 units of Black M issued for printing',
    },
  });

  await prisma.materialIssue.create({
    data: {
      issueNumber: 'ISSUE-000002',
      jobId: job1.id,
      inventoryItemId: tBlackL.id,
      quantityIssued: 50,
      issuedById: inventory.id,
      receivedById: production.id,
      notes: '50 units of Black L issued for printing',
    },
  });

  // Log Ink Usage for Job 1
  const inkWhite = createdInventoryMap.get('INK-DTF-WHT');
  const inkCyan = createdInventoryMap.get('INK-DTF-CYN');

  await prisma.inkUsage.create({
    data: {
      jobId: job1.id,
      inventoryItemId: inkWhite.id,
      color: 'White',
      brand: 'East Africa Digital Inks',
      inkType: 'DTF',
      quantityUsed: 220,
      quantityWasted: 15,
      unitOfMeasure: 'ml',
      operatorId: production.id,
      reason: 'CUSTOMER_PRODUCTION',
      notes: 'White underbase printing for dark garments',
    },
  });

  await prisma.inkUsage.create({
    data: {
      jobId: job1.id,
      inventoryItemId: inkCyan.id,
      color: 'Cyan',
      brand: 'East Africa Digital Inks',
      inkType: 'DTF',
      quantityUsed: 65,
      quantityWasted: 5,
      unitOfMeasure: 'ml',
      operatorId: production.id,
      reason: 'CUSTOMER_PRODUCTION',
      notes: 'Cyan gradient graphics',
    },
  });

  // Daily Production Record for Job 1
  await prisma.dailyProduction.create({
    data: {
      date: new Date(),
      jobId: job1.id,
      jobItemId: item1A.id,
      product: 'Runners Crew T-Shirt - Black / M',
      productionMethod: 'DTF',
      quantityPlanned: 50,
      quantityStarted: 40,
      quantityCompleted: 35,
      quantityRejected: 2,
      quantityDamaged: 1,
      quantityRemaining: 12,
      operatorId: production.id,
      workstation: 'Heat Press Line 1 & DTF Printer A',
      startTime: '08:30',
      endTime: '12:45',
      qualityStatus: 'PASSED',
      notes: 'Morning shift batch. 2 rejects due to slight misalignment, 1 damaged in press.',
    },
  });

  // Payment for Job 1 deposit
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-000001',
      jobId: job1.id,
      amount: 400.00,
      paymentMethod: 'BANK_TRANSFER',
      reference: 'BK-TRF-998271',
      paymentStatus: 'COMPLETED',
      notes: 'Initial 50%+ deposit received',
      recordedById: sales.id,
    },
  });

  // Job 2: Completed Job (White T-shirts)
  const pastDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  const job2 = await prisma.job.create({
    data: {
      jobNumber: 'GOG-000002',
      customerId: cust2.id,
      dateReceived: pastDate,
      requiredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      productType: 'T-shirts',
      brandingMethod: 'Screen printing',
      designReference: 'GHA-ROBOTICS-CLUB',
      assignedStaffId: production.id,
      priority: 'MEDIUM',
      status: 'COMPLETED',
      totalAmount: 375.00,
      discount: 0,
      tax: 0,
      depositPaid: 375.00,
      balanceDue: 0.00,
      notes: 'Delivered to school campus',
      labourCostEstimate: 30.00,
      overheadCostEstimate: 20.00,
      packagingCostEstimate: 10.00,
      deliveryCostEstimate: 5.00,
    },
  });

  await prisma.jobItem.create({
    data: {
      jobId: job2.id,
      itemDescription: 'Tech Club White T-Shirt / M',
      garmentType: 'Round-neck',
      brand: 'Gildan Heavy Cotton',
      size: 'M',
      color: 'White',
      quantityOrdered: 50,
      quantityCompleted: 50,
      quantityRejected: 0,
      quantityDamaged: 0,
      quantityPending: 0,
      unitPrice: 7.50,
      totalPrice: 375.00,
    },
  });

  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-000002',
      jobId: job2.id,
      amount: 375.00,
      paymentMethod: 'MOBILE_MONEY',
      reference: 'MOMO-738291',
      paymentStatus: 'COMPLETED',
      notes: 'Full payment completed upon order',
      recordedById: sales.id,
    },
  });

  console.log('✅ Seeded active jobs, line items, material issues, ink usages, payments, and production logs.');
  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
