import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://cbt_w7jg_user:1PMrhihntrU1zpbMOgYqQ3G7ymNbIxuT@dpg-damlbobm8hqs73djc8dg-a.oregon-postgres.render.com/cbt_w7jg';
} else if (!process.env.RENDER && process.env.DATABASE_URL.includes('@dpg-') && !process.env.DATABASE_URL.includes('.render.com')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/@dpg-([a-z0-9-]+)\//, '@dpg-$1.oregon-postgres.render.com/');
}

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN;
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true
  }));
  app.use(express.json());
  app.use(morgan('dev'));
  
  app.use(helmet({
    contentSecurityPolicy: false, 
  }));

  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  app.use('/uploads', express.static('uploads'));

  // Phone matching utility functions
  const normalizePhoneDigits = (phoneStr?: string | null): string => {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('234') && digits.length === 13) {
      digits = '0' + digits.slice(3);
    }
    return digits;
  };

  const phonesMatch = (phoneA?: string | null, phoneB?: string | null): boolean => {
    if (!phoneA || !phoneB) return false;
    const rawA = phoneA.replace(/\s+/g, '').replace(/-/g, '').trim();
    const rawB = phoneB.replace(/\s+/g, '').replace(/-/g, '').trim();
    if (rawA === rawB) return true;

    const normA = normalizePhoneDigits(phoneA);
    const normB = normalizePhoneDigits(phoneB);
    if (normA && normB && normA === normB) return true;

    const last10A = normA.slice(-10);
    const last10B = normB.slice(-10);
    if (last10A.length === 10 && last10A === last10B) return true;

    return false;
  };

  // Utility to strip leading/trailing quotes and whitespace from environment variables
  const cleanEnvStr = (val?: string): string => {
    return (val || '').trim().replace(/^["']|["']$/g, '').trim();
  };

  // Configurable admin credentials via environment variables
  const getAdminConfig = () => {
    return {
      adminName: cleanEnvStr(process.env.ADMIN_NAME) || 'System Admin',
      adminEmail: cleanEnvStr(process.env.ADMIN_EMAIL) || 'admin@hospital.com',
      adminPhone: cleanEnvStr(process.env.ADMIN_PHONE) || '08000000000',
      adminPassword: cleanEnvStr(process.env.ADMIN_PASSWORD) || 'admin',
    };
  };

  // Ensure default admin exists and is synchronized with environment variables
  const ensureAdmin = async () => {
    try {
      const { adminName, adminEmail, adminPhone, adminPassword } = getAdminConfig();

      let allUsers: any[] = [];
      try {
        allUsers = await prisma.user.findMany();
      } catch (err) {
        console.error('Failed to fetch users during ensureAdmin:', err);
      }

      const candidates = allUsers.filter(u =>
        (u.email && u.email.toLowerCase() === adminEmail.toLowerCase()) ||
        (u.phone && phonesMatch(u.phone, adminPhone)) ||
        u.role === 'admin'
      );

      let primaryAdmin = candidates[0] || null;

      if (candidates.length > 1) {
        // Resolve duplicate entries matching admin safely
        for (let i = 1; i < candidates.length; i++) {
          try {
            await prisma.user.delete({ where: { id: candidates[i].id } });
          } catch {
            // Ignore if already removed
          }
        }
      }

      if (primaryAdmin) {
        try {
          primaryAdmin = await prisma.user.update({
            where: { id: primaryAdmin.id },
            data: {
              name: adminName,
              email: adminEmail,
              phone: adminPhone,
              password: adminPassword,
              role: 'admin'
            }
          });
        } catch (updateErr) {
          // If update failed due to unique constraint, attempt finding by unique email/phone
          const byEmail = await prisma.user.findUnique({ where: { email: adminEmail } }).catch(() => null);
          const byPhone = await prisma.user.findUnique({ where: { phone: adminPhone } }).catch(() => null);
          const existing = byEmail || byPhone;
          if (existing) {
            primaryAdmin = await prisma.user.update({
              where: { id: existing.id },
              data: {
                name: adminName,
                email: adminEmail,
                phone: adminPhone,
                password: adminPassword,
                role: 'admin'
              }
            }).catch(() => existing);
          }
        }
      } else {
        try {
          primaryAdmin = await prisma.user.create({
            data: {
              name: adminName,
              phone: adminPhone,
              email: adminEmail,
              password: adminPassword,
              role: 'admin'
            }
          });
        } catch (createErr) {
          console.error('Failed to create admin in ensureAdmin:', createErr);
        }
      }
      console.log(`✅ System admin account verified (${adminPhone} / ${adminEmail})`);
      return primaryAdmin;
    } catch (err) {
      console.error('Failed to ensure default admin:', err);
      return null;
    }
  };

  const ensureWards = async () => {
    try {
      const wardsToCreate = [
        { name: 'Surgical Ward B1', type: 'surgical' },
        { name: 'Surgical Ward B2', type: 'surgical' },
        { name: 'Surgical Ward B3', type: 'surgical' },
        { name: 'Medical Ward A1', type: 'medical' },
        { name: 'Medical Ward A2', type: 'medical' },
        { name: 'Medical Ward A3', type: 'medical' },
        { name: 'Medical Ward C1', type: 'medical' },
        { name: 'Medical Ward C2', type: 'medical' },
        { name: 'Main Theatre', type: 'theatre' },
        { name: 'Male A&E', type: 'emergency' },
        { name: 'Female A&E', type: 'emergency' },
        { name: 'GOPD', type: 'general' },
        { name: 'Orthopedic Ward', type: 'orthopedic' },
        { name: 'Neuro 1', type: 'neurology' },
        { name: 'Neuro 11', type: 'neurology' },
        { name: 'Burns and Plastic ward', type: 'burns' },
        { name: 'PABC ward', type: 'pabc' },
        { name: 'Renal unit ward', type: 'renal' },
        { name: 'Maternity Ward M1', type: 'maternity' },
        { name: 'Maternity Ward M2', type: 'maternity' },
      ];

      for (const w of wardsToCreate) {
        const existing = await prisma.ward.findFirst({ where: { name: w.name } });
        if (!existing) {
          await prisma.ward.create({
            data: {
              name: w.name,
              type: w.type,
              capacity: 20,
              beds: {
                create: Array.from({ length: 20 }).map((_, i) => ({
                  status: 'vacant'
                }))
              }
            }
          });
          console.log(`✅ Ward created: ${w.name}`);
        }
      }
    } catch (err) {
      console.error('Failed to ensure default wards:', err);
    }
  };

  const ensurePricing = async () => {
    try {
      const pricingToCreate = [
        { name: 'consultation', category: 'clinical', price: 2000 },
        { name: 'bed_fee', category: 'ward', price: 1000 },
        { name: 'nurse_fee', category: 'clinical', price: 1500 },
        // Investigations
        { name: 'Full Blood Count (FBC)', category: 'investigation', price: 2500 },
        { name: 'Malaria Parasite (MP)', category: 'investigation', price: 1500 },
        { name: 'Widal Test', category: 'investigation', price: 2000 },
        { name: 'Urinalysis', category: 'investigation', price: 1000 },
        { name: 'Blood Glucose', category: 'investigation', price: 1000 },
        { name: 'Chest X-Ray', category: 'investigation', price: 5000 },
        { name: 'Abdominal Ultrasound', category: 'investigation', price: 4000 },
        { name: 'Pelvic Ultrasound', category: 'investigation', price: 4000 },
        { name: 'ECG', category: 'investigation', price: 3000 },
      ];

      for (const p of pricingToCreate) {
        await prisma.servicePricing.upsert({
          where: { name: p.name },
          update: { price: p.price, category: p.category },
          create: p
        });
      }
      console.log('✅ Service pricing seeded');
    } catch (err) {
      console.error('Failed to ensure pricing:', err);
    }
  };

  await Promise.all([ensureAdmin(), ensureWards(), ensurePricing()]);

  // Server-Sent Events (SSE) Real-Time Notification Engine
  const sseClients: Set<express.Response> = new Set();

  function broadcastEvent(type: string, payload: any) {
    const eventData = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(eventData);
      } catch (err) {
        sseClients.delete(client);
      }
    });
  }

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  const ensureInventory = async () => {
    try {
      const count = await prisma.inventory.count();
      if (count < 20) {
        const today = new Date();
        const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
        const nextYear = new Date(today); nextYear.setFullYear(today.getFullYear() + 1);
        const soon = new Date(today); soon.setDate(today.getDate() + 5);

        const drugs = [
          // Analgesics
          { name: 'Paracetamol', category: 'Analgesics', stockLevel: 500, unit: 'Tablets', price: 50, expiryDate: nextYear },
          { name: 'Ibuprofen', category: 'Analgesics', stockLevel: 300, unit: 'Tablets', price: 100, expiryDate: soon },
          { name: 'Diclofenac', category: 'Analgesics', stockLevel: 200, unit: 'Tablets', price: 150, expiryDate: nextMonth },
          
          // Antibiotics
          { name: 'Amoxicillin', category: 'Antibiotics', stockLevel: 200, unit: 'Capsules', price: 200, expiryDate: nextMonth },
          { name: 'Ciprofloxacin', category: 'Antibiotics', stockLevel: 150, unit: 'Tablets', price: 300, expiryDate: nextYear },
          { name: 'Azithromycin', category: 'Antibiotics', stockLevel: 100, unit: 'Tablets', price: 500, expiryDate: nextMonth },
          { name: 'Ceftriaxone Injection', category: 'Antibiotics', stockLevel: 50, unit: 'Vials', price: 1500, expiryDate: nextYear },
          
          // Antimalarials
          { name: 'Artemether-Lumefantrine', category: 'Antimalarials', stockLevel: 0, unit: 'Blisters', price: 800, expiryDate: nextMonth },
          { name: 'Artesunate Injection', category: 'Antimalarials', stockLevel: 40, unit: 'Vials', price: 1200, expiryDate: nextYear },
          { name: 'Quinine Tablet', category: 'Antimalarials', stockLevel: 100, unit: 'Tablets', price: 250, expiryDate: nextMonth },
          
          // Antihistamines
          { name: 'Loratadine', category: 'Antihistamine', stockLevel: 250, unit: 'Tablets', price: 150, expiryDate: nextYear },
          { name: 'Cetirizine', category: 'Antihistamine', stockLevel: 300, unit: 'Tablets', price: 150, expiryDate: nextMonth },
          { name: 'Chlorpheniramine', category: 'Antihistamine', stockLevel: 400, unit: 'Tablets', price: 50, expiryDate: nextFullYear(today, 2) },
          
          // Antihypertensives
          { name: 'Amlodipine', category: 'Antihypertensives', stockLevel: 300, unit: 'Tablets', price: 200, expiryDate: nextYear },
          { name: 'Lisinopril', category: 'Antihypertensives', stockLevel: 200, unit: 'Tablets', price: 200, expiryDate: nextYear },
          { name: 'Losartan', category: 'Antihypertensives', stockLevel: 180, unit: 'Tablets', price: 300, expiryDate: nextMonth },
          { name: 'Nifedipine', category: 'Antihypertensives', stockLevel: 150, unit: 'Tablets', price: 250, expiryDate: nextYear },

          // Antidiarrheal
          { name: 'Loperamide', category: 'Antidiarrheal', stockLevel: 100, unit: 'Capsules', price: 100, expiryDate: nextYear },
          { name: 'Zinc Sulfate', category: 'Antidiarrheal', stockLevel: 500, unit: 'Tablets', price: 150, expiryDate: nextMonth },
          { name: 'ORS Sachet', category: 'Antidiarrheal', stockLevel: 1000, unit: 'Sachets', price: 200, expiryDate: nextYear },

          // Antidiabetics
          { name: 'Metformin', category: 'Antidiabetics', stockLevel: 400, unit: 'Tablets', price: 250, expiryDate: nextYear },
          { name: 'Glibenclamide', category: 'Antidiabetics', stockLevel: 200, unit: 'Tablets', price: 200, expiryDate: nextMonth },
          { name: 'Insulin Soluble', category: 'Antidiabetics', stockLevel: 30, unit: 'Vials', price: 4500, expiryDate: nextMonth },

          // Supplements
          { name: 'Vitamin C', category: 'Supplements', stockLevel: 1000, unit: 'Tablets', price: 50, expiryDate: nextYear },
          { name: 'Vitamin B-Complex', category: 'Supplements', stockLevel: 800, unit: 'Tablets', price: 50, expiryDate: nextYear },
          { name: 'Folic Acid', category: 'Supplements', stockLevel: 1200, unit: 'Tablets', price: 50, expiryDate: nextYear },
          { name: 'Multivitamin Syrup', category: 'Supplements', stockLevel: 50, unit: 'Bottles', price: 500, expiryDate: nextMonth },
          
          // Others
          { name: 'Omeprazole', category: 'Gastrointestinal', stockLevel: 250, unit: 'Capsules', price: 200, expiryDate: nextMonth },
          { name: 'Salbutamol Inhaler', category: 'Respiratory', stockLevel: 10, unit: 'Inhalers', price: 2500, expiryDate: soon },
          { name: 'Normal Saline 500ml', category: 'IV Fluids', stockLevel: 100, unit: 'Bags', price: 800, expiryDate: nextMonth },
        ];

        function nextFullYear(date: Date, years: number) {
          const d = new Date(date);
          d.setFullYear(d.getFullYear() + years);
          return d;
        }

        for (const drug of drugs) {
          await prisma.inventory.upsert({
            where: { name: drug.name },
            update: {
              category: drug.category,
              stockLevel: drug.stockLevel,
              unit: drug.unit,
              price: drug.price,
              expiryDate: drug.expiryDate
            },
            create: drug
          });
        }
        console.log('✅ Default drugs seeded');
      }
    } catch (err) {
      console.error('Failed to seed inventory:', err);
    }
  };
  ensureInventory();

  // Audit Logger Helper
  async function logAction(userId: string, userName: string, action: string, resourceId?: string, resourceType?: string) {
    try {
      await prisma.auditLog.create({
        data: { userId, userName, action, resourceId, resourceType }
      });
    } catch (err) {
      console.error('Audit log failed:', err);
    }
  }

  // RBAC Middleware Helper
  const requireRoles = (...allowedRoles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const role = (req.headers['x-user-role'] as string) || '';
      if (!role) {
        return res.status(401).json({ error: 'Unauthorized: Missing user role header' });
      }
      if (role === 'admin' || allowedRoles.includes(role)) {
        return next();
      }
      return res.status(403).json({ error: `Forbidden: Role '${role}' is not permitted for this action.` });
    };
  };

  // Database & Sync Engine
  const isSQLiteDatabase = (): boolean => {
    const url = (process.env.DATABASE_URL || '').toLowerCase();
    return url.startsWith('file:') || url.startsWith('sqlite:');
  };

  async function upsertImportData(data: any) {
    let count = 0;
    if (!data) return count;

    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        if (!u.id) continue;
        await prisma.user.upsert({
          where: { id: u.id },
          update: {
            name: u.name,
            email: u.email ?? null,
            phone: u.phone ?? null,
            password: u.password ?? null,
            role: u.role,
            uid: u.uid ?? null
          },
          create: {
            id: u.id,
            name: u.name,
            email: u.email ?? null,
            phone: u.phone ?? null,
            password: u.password ?? null,
            role: u.role,
            uid: u.uid ?? null,
            createdAt: u.createdAt ? new Date(u.createdAt) : undefined
          }
        });
        count++;
      }
    }

    if (Array.isArray(data.pricing)) {
      for (const p of data.pricing) {
        if (!p.id || !p.name) continue;
        await prisma.servicePricing.upsert({
          where: { name: p.name },
          update: { category: p.category, price: parseFloat(p.price) || 0 },
          create: { id: p.id, name: p.name, category: p.category, price: parseFloat(p.price) || 0 }
        });
        count++;
      }
    }

    if (Array.isArray(data.inventory)) {
      for (const i of data.inventory) {
        if (!i.id || !i.name) continue;
        await prisma.inventory.upsert({
          where: { name: i.name },
          update: {
            category: i.category ?? null,
            description: i.description ?? null,
            stockLevel: parseInt(i.stockLevel) || 0,
            price: parseFloat(i.price) || 0,
            unit: i.unit || 'pcs',
            expiryDate: i.expiryDate ? new Date(i.expiryDate) : null
          },
          create: {
            id: i.id,
            name: i.name,
            category: i.category ?? null,
            description: i.description ?? null,
            stockLevel: parseInt(i.stockLevel) || 0,
            price: parseFloat(i.price) || 0,
            unit: i.unit || 'pcs',
            expiryDate: i.expiryDate ? new Date(i.expiryDate) : null
          }
        });
        count++;
      }
    }

    if (Array.isArray(data.wards)) {
      for (const w of data.wards) {
        if (!w.id) continue;
        await prisma.ward.upsert({
          where: { id: w.id },
          update: { name: w.name, type: w.type || 'General', capacity: parseInt(w.capacity) || 20 },
          create: { id: w.id, name: w.name, type: w.type || 'General', capacity: parseInt(w.capacity) || 20 }
        });
        count++;
      }
    }

    if (Array.isArray(data.patients)) {
      for (const p of data.patients) {
        if (!p.id) continue;
        await prisma.patient.upsert({
          where: { id: p.id },
          update: {
            name: p.name,
            gender: p.gender,
            dob: new Date(p.dob),
            age: p.age ? parseInt(p.age) : null,
            bloodGroup: p.bloodGroup ?? null,
            address: p.address ?? null,
            nextOfKinName: p.nextOfKinName ?? null,
            nextOfKinPhone: p.nextOfKinPhone ?? null,
            nextOfKinRelationship: p.nextOfKinRelationship ?? null,
            photoUrl: p.photoUrl ?? null,
            fingerprint: p.fingerprint ?? null,
            nextVisit: p.nextVisit ? new Date(p.nextVisit) : null,
            allergies: p.allergies ?? null,
            status: p.status || 'outpatient',
            workflowStatus: p.workflowStatus || 'registered',
            dischargeReason: p.dischargeReason ?? null,
            diagnosis: p.diagnosis ?? null
          },
          create: {
            id: p.id,
            name: p.name,
            gender: p.gender,
            dob: new Date(p.dob),
            age: p.age ? parseInt(p.age) : null,
            bloodGroup: p.bloodGroup ?? null,
            address: p.address ?? null,
            nextOfKinName: p.nextOfKinName ?? null,
            nextOfKinPhone: p.nextOfKinPhone ?? null,
            nextOfKinRelationship: p.nextOfKinRelationship ?? null,
            photoUrl: p.photoUrl ?? null,
            fingerprint: p.fingerprint ?? null,
            nextVisit: p.nextVisit ? new Date(p.nextVisit) : null,
            allergies: p.allergies ?? null,
            admissionDate: p.admissionDate ? new Date(p.admissionDate) : new Date(),
            status: p.status || 'outpatient',
            workflowStatus: p.workflowStatus || 'registered',
            dischargeReason: p.dischargeReason ?? null,
            diagnosis: p.diagnosis ?? null
          }
        });
        count++;
      }
    }

    if (Array.isArray(data.beds)) {
      for (const b of data.beds) {
        if (!b.id) continue;
        await prisma.bed.upsert({
          where: { id: b.id },
          update: { status: b.status, wardId: b.wardId, patientId: b.patientId ?? null },
          create: { id: b.id, status: b.status, wardId: b.wardId, patientId: b.patientId ?? null }
        });
        count++;
      }
    }

    if (Array.isArray(data.appointments)) {
      for (const a of data.appointments) {
        if (!a.id) continue;
        await prisma.appointment.upsert({
          where: { id: a.id },
          update: {
            patientId: a.patientId,
            doctorId: a.doctorId ?? null,
            doctorName: a.doctorName ?? null,
            dateTime: new Date(a.dateTime),
            reason: a.reason,
            status: a.status,
            type: a.type
          },
          create: {
            id: a.id,
            patientId: a.patientId,
            doctorId: a.doctorId ?? null,
            doctorName: a.doctorName ?? null,
            dateTime: new Date(a.dateTime),
            reason: a.reason,
            status: a.status,
            type: a.type
          }
        });
        count++;
      }
    }

    if (Array.isArray(data.bills)) {
      for (const b of data.bills) {
        if (!b.id) continue;
        await prisma.bill.upsert({
          where: { id: b.id },
          update: { patientId: b.patientId, totalAmount: parseFloat(b.totalAmount) || 0, status: b.status },
          create: { id: b.id, patientId: b.patientId, totalAmount: parseFloat(b.totalAmount) || 0, status: b.status, createdAt: b.createdAt ? new Date(b.createdAt) : undefined }
        });
        count++;
      }
    }

    if (Array.isArray(data.billItems)) {
      for (const bi of data.billItems) {
        if (!bi.id) continue;
        await prisma.billItem.upsert({
          where: { id: bi.id },
          update: { billId: bi.billId, description: bi.description, amount: parseFloat(bi.amount) || 0, type: bi.type },
          create: { id: bi.id, billId: bi.billId, description: bi.description, amount: parseFloat(bi.amount) || 0, type: bi.type, createdAt: bi.createdAt ? new Date(bi.createdAt) : undefined }
        });
        count++;
      }
    }

    if (Array.isArray(data.prescriptions)) {
      for (const rx of data.prescriptions) {
        if (!rx.id) continue;
        await prisma.prescription.upsert({
          where: { id: rx.id },
          update: {
            patientId: rx.patientId,
            authorId: rx.authorId,
            authorName: rx.authorName || 'Unknown',
            medication: rx.medication,
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            status: rx.status
          },
          create: {
            id: rx.id,
            patientId: rx.patientId,
            authorId: rx.authorId,
            authorName: rx.authorName || 'Unknown',
            medication: rx.medication,
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            status: rx.status,
            createdAt: rx.createdAt ? new Date(rx.createdAt) : undefined
          }
        });
        count++;
      }
    }

    if (Array.isArray(data.vitals)) {
      for (const v of data.vitals) {
        if (!v.id) continue;
        await prisma.vitalSign.upsert({
          where: { id: v.id },
          update: { bp: v.bp, pulse: v.pulse, temp: v.temp, resp: v.resp, spo2: v.spo2, weight: v.weight, takenBy: v.takenBy },
          create: { id: v.id, patientId: v.patientId, bp: v.bp, pulse: v.pulse, temp: v.temp, resp: v.resp, spo2: v.spo2, weight: v.weight, takenBy: v.takenBy, createdAt: v.createdAt ? new Date(v.createdAt) : undefined }
        });
        count++;
      }
    }

    if (Array.isArray(data.investigations)) {
      for (const inv of data.investigations) {
        if (!inv.id) continue;
        await prisma.investigation.upsert({
          where: { id: inv.id },
          update: { type: inv.type, category: inv.category, testName: inv.testName, status: inv.status, priority: inv.priority, requestedBy: inv.requestedBy, result: inv.result, fileUrl: inv.fileUrl },
          create: { id: inv.id, patientId: inv.patientId, type: inv.type, category: inv.category, testName: inv.testName, status: inv.status, priority: inv.priority, requestedBy: inv.requestedBy, result: inv.result, fileUrl: inv.fileUrl, createdAt: inv.createdAt ? new Date(inv.createdAt) : undefined }
        });
        count++;
      }
    }

    if (Array.isArray(data.notes)) {
      for (const n of data.notes) {
        if (!n.id) continue;
        await prisma.clinicalNote.upsert({
          where: { id: n.id },
          update: { content: n.content, type: n.type, authorId: n.authorId, authorName: n.authorName },
          create: { id: n.id, patientId: n.patientId, content: n.content, type: n.type, authorId: n.authorId, authorName: n.authorName, createdAt: n.createdAt ? new Date(n.createdAt) : undefined }
        });
        count++;
      }
    }

    if (Array.isArray(data.physiotherapyReferrals)) {
      for (const pt of data.physiotherapyReferrals) {
        if (!pt.id) continue;
        await prisma.physiotherapyReferral.upsert({
          where: { id: pt.id },
          update: { referredBy: pt.referredBy, clinicalIndication: pt.clinicalIndication, bodyRegion: pt.bodyRegion, treatmentType: pt.treatmentType, sessionsRequested: pt.sessionsRequested, sessionsCompleted: pt.sessionsCompleted, priority: pt.priority, status: pt.status, notes: pt.notes },
          create: { id: pt.id, patientId: pt.patientId, referredBy: pt.referredBy, clinicalIndication: pt.clinicalIndication, bodyRegion: pt.bodyRegion, treatmentType: pt.treatmentType, sessionsRequested: pt.sessionsRequested, sessionsCompleted: pt.sessionsCompleted, priority: pt.priority, status: pt.status, notes: pt.notes, createdAt: pt.createdAt ? new Date(pt.createdAt) : undefined }
        });
        count++;
      }
    }

    return count;
  }

  app.get('/api/db/info', async (req, res) => {
    try {
      const isSqlite = isSQLiteDatabase();
      const [users, patients, inventory, bills, prescriptions, appointments] = await Promise.all([
        prisma.user.count(),
        prisma.patient.count(),
        prisma.inventory.count(),
        prisma.bill.count(),
        prisma.prescription.count(),
        prisma.appointment.count()
      ]);
      res.json({
        provider: isSqlite ? 'sqlite' : 'postgresql',
        databaseUrl: isSqlite ? 'Local SQLite Database' : 'Render PostgreSQL Database',
        counts: { users, patients, inventory, bills, prescriptions, appointments },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch database info' });
    }
  });

  app.get('/api/sync/status', async (req, res) => {
    try {
      const isSqlite = isSQLiteDatabase();
      const userCount = await prisma.user.count();
      const patientCount = await prisma.patient.count();
      const inventoryCount = await prisma.inventory.count();

      res.json({
        provider: isSqlite ? 'sqlite' : 'postgresql',
        status: 'online',
        recordCounts: { users: userCount, patients: patientCount, inventory: inventoryCount },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch sync status' });
    }
  });

  app.get('/api/sync/export', async (req, res) => {
    try {
      const [
        users,
        wards,
        beds,
        patients,
        physiotherapyReferrals,
        appointments,
        bills,
        billItems,
        treatmentPlans,
        reviews,
        vitals,
        investigations,
        notes,
        prescriptions,
        inventory,
        pricing,
        logs
      ] = await Promise.all([
        prisma.user.findMany(),
        prisma.ward.findMany(),
        prisma.bed.findMany(),
        prisma.patient.findMany(),
        prisma.physiotherapyReferral.findMany(),
        prisma.appointment.findMany(),
        prisma.bill.findMany(),
        prisma.billItem.findMany(),
        prisma.treatmentPlan.findMany(),
        prisma.review.findMany(),
        prisma.vitalSign.findMany(),
        prisma.investigation.findMany(),
        prisma.clinicalNote.findMany(),
        prisma.prescription.findMany(),
        prisma.inventory.findMany(),
        prisma.servicePricing.findMany(),
        prisma.auditLog.findMany({ take: 200, orderBy: { timestamp: 'desc' } })
      ]);

      res.json({
        exportedAt: new Date().toISOString(),
        provider: isSQLiteDatabase() ? 'sqlite' : 'postgresql',
        data: {
          users,
          wards,
          beds,
          patients,
          physiotherapyReferrals,
          appointments,
          bills,
          billItems,
          treatmentPlans,
          reviews,
          vitals,
          investigations,
          notes,
          prescriptions,
          inventory,
          pricing,
          logs
        }
      });
    } catch (err: any) {
      console.error('Export error:', err);
      res.status(500).json({ error: 'Failed to export database snapshot' });
    }
  });

  app.post('/api/sync/import', async (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Missing sync data payload' });
      }

      const importedCount = await upsertImportData(data);
      res.json({
        success: true,
        importedRecords: importedCount,
        provider: isSQLiteDatabase() ? 'sqlite' : 'postgresql',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Import error:', err);
      res.status(500).json({ error: 'Sync import failed: ' + err.message });
    }
  });

  app.post('/api/sync/sync-remote', async (req, res) => {
    try {
      const { remoteUrl } = req.body;
      if (!remoteUrl) {
        return res.status(400).json({ error: 'Remote URL is required for synchronization' });
      }

      const cleanRemoteUrl = remoteUrl.replace(/\/+$/, '');
      const exportEndpoint = `${cleanRemoteUrl.endsWith('/api') ? cleanRemoteUrl : cleanRemoteUrl + '/api'}/sync/export`;
      const importEndpoint = `${cleanRemoteUrl.endsWith('/api') ? cleanRemoteUrl : cleanRemoteUrl + '/api'}/sync/import`;

      // 1. Fetch remote dataset from Render PostgreSQL server
      const remoteRes = await fetch(exportEndpoint);
      if (!remoteRes.ok) {
        throw new Error(`Failed to fetch data from remote Render host (${remoteRes.status} ${remoteRes.statusText})`);
      }
      const remoteSnapshot = await remoteRes.json();

      let localImportedCount = 0;
      if (remoteSnapshot?.data) {
        localImportedCount = await upsertImportData(remoteSnapshot.data);
      }

      // 2. Export local snapshot and send to Render PostgreSQL server
      const [
        localUsers,
        localPatients,
        localInventory,
        localBills,
        localBillItems,
        localPrescriptions,
        localInvestigations,
        localNotes,
        localVitals,
        localAppointments,
        localPricing,
        localWards
      ] = await Promise.all([
        prisma.user.findMany(),
        prisma.patient.findMany(),
        prisma.inventory.findMany(),
        prisma.bill.findMany(),
        prisma.billItem.findMany(),
        prisma.prescription.findMany(),
        prisma.investigation.findMany(),
        prisma.clinicalNote.findMany(),
        prisma.vitalSign.findMany(),
        prisma.appointment.findMany(),
        prisma.servicePricing.findMany(),
        prisma.ward.findMany()
      ]);

      const localPayload = {
        data: {
          users: localUsers,
          patients: localPatients,
          inventory: localInventory,
          bills: localBills,
          billItems: localBillItems,
          prescriptions: localPrescriptions,
          investigations: localInvestigations,
          notes: localNotes,
          vitals: localVitals,
          appointments: localAppointments,
          pricing: localPricing,
          wards: localWards
        }
      };

      const pushRes = await fetch(importEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localPayload)
      });

      const pushData = await pushRes.json().catch(() => ({}));

      res.json({
        success: true,
        message: 'Bidirectional sync with Render PostgreSQL server completed successfully',
        localImportedRecords: localImportedCount,
        remoteImportedRecords: pushData?.importedRecords || 0,
        syncedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Remote sync error:', err);
      res.status(500).json({ error: 'Remote synchronization failed: ' + err.message });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  });
  
  // Logs
  app.get('/api/logs', async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.delete('/api/logs', async (req, res) => {
    try {
      const requesterRole = req.headers['x-user-role'];
      if (requesterRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only administrators can clear activity logs.' });
      }
      await prisma.auditLog.deleteMany({});
      res.json({ message: 'Audit logs cleared successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear activity logs' });
    }
  });

  // User Management
  app.get('/api/users', async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { uid, name, email, role } = req.body;
      const user = await prisma.user.upsert({
        where: { uid },
        update: { name, email, role },
        create: { uid, name, email, role }
      });
      await logAction('system', 'Admin', `Profile synced for user: ${name} as ${role}`, user.id, 'User');
      res.status(201).json(user);
    } catch (error) {
      console.error('User sync error:', error);
      res.status(500).json({ error: 'Failed to link user' });
    }
  });

  app.patch('/api/users/:id/role', async (req, res) => {
    try {
      const requesterRole = req.headers['x-user-role'];
      if (requesterRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only administrators can update staff roles.' });
      }
      const { role } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role }
      });
      await logAction('system', 'Admin', `Updated user role: ${user.name} to ${role}`, user.id, 'User');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update role' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const requesterRole = req.headers['x-user-role'];
      if (requesterRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only administrators can remove staff.' });
      }
      const user = await prisma.user.delete({
        where: { id: req.params.id }
      });
      await logAction('system', 'Admin', `Removed staff member: ${user.name}`, user.id, 'User');
      res.json({ message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Wards & Beds
  app.get('/api/wards', async (req, res) => {
    try {
      const wards = await prisma.ward.findMany({
        include: { 
          beds: { 
            include: { patient: true } 
          } 
        }
      });
      res.json(wards);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wards' });
    }
  });

  app.post('/api/wards', async (req, res) => {
    try {
      const { name, type, capacity } = req.body;
      const ward = await prisma.ward.create({
        data: {
          name,
          type,
          capacity: parseInt(capacity),
          beds: {
            create: Array.from({ length: parseInt(capacity) }).map((_, i) => ({
              status: 'vacant'
            }))
          }
        },
        include: { beds: true }
      });
      await logAction('system', 'Admin', `Created ward: ${name}`, ward.id, 'Ward');
      res.status(201).json(ward);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create ward' });
    }
  });

  // Auth
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, phone, email, password } = req.body;
      const rawIdentifier = cleanEnvStr(identifier || phone || email);
      const cleanPassword = cleanEnvStr(password);

      if (!cleanPassword || !rawIdentifier) {
        return res.status(401).json({ error: 'Invalid email/phone or password' });
      }

      const { adminName, adminEmail, adminPhone, adminPassword } = getAdminConfig();

      let allUsers: any[] = [];
      try {
        allUsers = await prisma.user.findMany();
      } catch (dbErr) {
        console.error('Database query failed during login:', dbErr);
      }

      let user = allUsers.find(u => {
        const matchesId = u.id && u.id === rawIdentifier;
        const matchesUid = u.uid && u.uid === rawIdentifier;
        const matchesEmail = u.email && u.email.toLowerCase() === rawIdentifier.toLowerCase();
        const matchesPhone = u.phone && phonesMatch(u.phone, rawIdentifier);
        const matchesEmailPrefix = u.email && !rawIdentifier.includes('@') && u.email.toLowerCase().startsWith(rawIdentifier.toLowerCase() + '@');
        const matchesName = u.name && u.name.toLowerCase() === rawIdentifier.toLowerCase();
        return Boolean(matchesId || matchesUid || matchesEmail || matchesPhone || matchesEmailPrefix || matchesName);
      }) || null;

      const isAdminIdentifier =
        rawIdentifier.toLowerCase() === adminEmail.toLowerCase() ||
        phonesMatch(rawIdentifier, adminPhone) ||
        rawIdentifier.toLowerCase() === adminName.toLowerCase() ||
        rawIdentifier.toLowerCase() === 'admin@hospital.com' ||
        phonesMatch(rawIdentifier, '08000000000') ||
        rawIdentifier.toLowerCase() === 'admin' ||
        user?.role === 'admin';

      if (!user && isAdminIdentifier) {
        try {
          user = await ensureAdmin();
        } catch {
          // Ignore ensureAdmin failure and rely on fallback
        }
      }

      if (user && isAdminIdentifier) {
        try {
          const updatedAdmin = await ensureAdmin();
          if (updatedAdmin) {
            user = updatedAdmin;
          }
        } catch {
          // Keep current user object if sync fails
        }
      }

      // Final fallback for Admin if DB unreachable/disconnected or user not found
      if (!user && isAdminIdentifier && cleanPassword === adminPassword) {
        user = {
          id: 'admin-fallback-id',
          uid: 'admin-fallback-uid',
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          password: adminPassword,
          role: 'admin',
          createdAt: new Date()
        };
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email/phone or password' });
      }

      const passwordMatches =
        user.password === cleanPassword ||
        (isAdminIdentifier && cleanPassword === adminPassword);

      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid email/phone or password' });
      }

      res.json(user);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, phone, email, password, role } = req.body;
      const cleanName = name ? String(name).trim() : '';
      const cleanPhone = phone && String(phone).replace(/\s+/g, '').replace(/-/g, '').trim() ? String(phone).replace(/\s+/g, '').replace(/-/g, '').trim() : null;
      const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;
      const cleanPassword = password ? String(password).trim() : '';
      const cleanRole = role ? String(role).trim() : 'doctor';

      // Basic validation
      if (!cleanName || (!cleanPhone && !cleanEmail) || !cleanPassword) {
        return res.status(400).json({ error: 'Name, Password, and either Email or Phone number are required' });
      }

      if (cleanEmail && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
        return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@hospital.com)' });
      }

      // Check if phone or email already registered
      const allUsers = await prisma.user.findMany();
      const existingUser = allUsers.find(u =>
        (cleanPhone && u.phone && phonesMatch(u.phone, cleanPhone)) ||
        (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
      );

      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email or phone number is already registered' });
      }

      const user = await prisma.user.create({
        data: {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          password: cleanPassword,
          role: cleanRole
        }
      });

      await logAction('system', user.name, `Registered account: ${cleanName} (${cleanRole})`, user.id, 'User');
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error?.code === 'P2002') {
        return res.status(400).json({ error: 'A user with this email or phone number is already registered' });
      }
      res.status(400).json({ error: error.message || 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/staff', async (req, res) => {
    try {
      const requesterRole = req.headers['x-user-role'];
      if (requesterRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only administrators can register staff.' });
      }

      const { name, phone, email, password, role } = req.body;
      const cleanName = name ? String(name).trim() : '';
      const cleanPhone = phone && String(phone).replace(/\s+/g, '').replace(/-/g, '').trim() ? String(phone).replace(/\s+/g, '').replace(/-/g, '').trim() : null;
      const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;
      const cleanPassword = password ? String(password).trim() : '';
      const cleanRole = role ? String(role).trim() : 'doctor';
      
      // Basic validation
      if (!cleanName || (!cleanPhone && !cleanEmail) || !cleanPassword) {
        return res.status(400).json({ error: 'Name, Password, and either Email or Phone number are required' });
      }

      if (cleanEmail && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
        return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@hospital.com)' });
      }

      // Check if phone or email already registered
      const allUsers = await prisma.user.findMany();
      const existingUser = allUsers.find(u =>
        (cleanPhone && u.phone && phonesMatch(u.phone, cleanPhone)) ||
        (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
      );

      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email or phone number is already registered' });
      }

      const user = await prisma.user.create({
        data: {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          password: cleanPassword,
          role: cleanRole
        }
      });

      await logAction('system', 'Admin', `Registered account: ${cleanName} (${cleanRole})`, user.id, 'User');
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error?.code === 'P2002') {
        return res.status(400).json({ error: 'Email or phone number is already registered' });
      }
      res.status(500).json({ error: error.message || 'Registration failed. Please try again.' });
    }
  });

  // Wards & Beds
  app.post('/api/beds/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const bedId = req.params.id;
      
      const bed = await prisma.bed.update({
        where: { id: bedId },
        data: { status },
        include: { patient: true }
      });

      await logAction('system', 'System', `Bed ${bedId} status changed to ${status}`, bed.wardId, 'Ward');
      res.json(bed);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update bed status' });
    }
  });

  app.post('/api/wards/:id/beds', async (req, res) => {
    try {
      const { count } = req.body;
      const wardId = req.params.id;
      const numBeds = parseInt(count) || 1;

      const beds = await Promise.all(
        Array.from({ length: numBeds }).map(() => 
          prisma.bed.create({
            data: {
              wardId,
              status: 'vacant'
            }
          })
        )
      );

      await prisma.ward.update({
        where: { id: wardId },
        data: {
          capacity: { increment: numBeds }
        }
      });

      await logAction('system', 'System', `Added ${numBeds} beds to ward ${wardId}`, wardId, 'Ward');
      res.status(201).json(beds);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add beds' });
    }
  });

  // Patients
  app.post('/api/patients', requireRoles('admin', 'record', 'nurse', 'doctor'), async (req, res) => {
    try {
      const {
        name,
        gender,
        dob,
        age,
        bloodGroup,
        address,
        nextOfKinName,
        nextOfKinPhone,
        nextOfKinRelationship,
        photoUrl,
        fingerprint,
        status,
        workflowStatus
      } = req.body;

      // Basic validation for required fields
      if (!name || !gender || !dob) {
        return res.status(400).json({ error: 'Name, gender, and date of birth are required' });
      }

      const { triagePriority } = req.body;
      const patient = await prisma.patient.create({
        data: {
          name,
          gender,
          dob: new Date(dob),
          age: parseInt(age) || 0,
          bloodGroup,
          address,
          nextOfKinName,
          nextOfKinPhone,
          nextOfKinRelationship,
          photoUrl,
          fingerprint,
          status: status || 'outpatient',
          workflowStatus: workflowStatus || 'vitals',
          triagePriority: triagePriority || null
        }
      });
      await logAction('system', 'System', `Registered patient: ${patient.name}. Sent to Vitals.`, patient.id, 'Patient');
      broadcastEvent('patient_registered', { id: patient.id, name: patient.name, triagePriority });
      res.status(201).json(patient);
    } catch (error) {
      console.error('Patient registration error:', error);
      res.status(500).json({ error: 'Failed to register patient. Please check your data.' });
    }
  });

  app.patch('/api/patients/:id/workflow', async (req, res) => {
    try {
      const requesterRole = req.headers['x-user-role'];
      const allowedRoles = ['admin', 'doctor', 'nurse', 'record', 'pharmacy', 'pharmacy_admin', 'lab', 'radiology', 'scientist', 'radiographer', 'physiotherapist', 'physio'];
      if (!requesterRole || !allowedRoles.includes(requesterRole as string)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update workflow status.' });
      }

      const { workflowStatus } = req.body;
      const patient = await prisma.patient.update({
        where: { id: req.params.id },
        data: { workflowStatus }
      });
      await logAction((requesterRole as string) || 'system', 'Clinical Flow', `Moved patient ${patient.name} to ${workflowStatus}`, patient.id, 'Patient');
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  });

  app.delete('/api/patients/:id', async (req, res) => {
    try {
      const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      // If patient is in a bed, vacate it first
      if (patient.bedId) {
        await prisma.bed.update({
          where: { id: patient.bedId },
          data: { status: 'vacant', patientId: null }
        });
      }

      await prisma.patient.delete({ where: { id: req.params.id } });
      await logAction('system', 'Admin', `Deleted patient: ${patient.name}`, req.params.id, 'Patient');
      res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete patient' });
    }
  });

  app.get('/api/patients/fingerprint/:fingerprintId', async (req, res) => {
    try {
      const patient = await prisma.patient.findFirst({
        where: { fingerprint: req.params.fingerprintId }
      });
      if (!patient) return res.status(404).json({ error: 'No patient found with this fingerprint' });
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Fingerprint search failed' });
    }
  });

  app.post('/api/patients/:id/admit', async (req, res) => {
    try {
      const { wardId, bedId } = req.body;
      
      await prisma.bed.update({
        where: { id: bedId },
        data: { status: 'occupied', patientId: req.params.id }
      });

      const patient = await prisma.patient.update({
        where: { id: req.params.id },
        data: { 
          status: 'inpatient',
          wardId,
          bedId
        }
      });
      await logAction('system', 'System', `Admitted patient: ${patient.name} to ${wardId}`, patient.id, 'Patient');
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Admission failed' });
    }
  });

  app.post('/api/patients/:id/discharge', async (req, res) => {
    try {
      const { reason } = req.body;
      const patient = await prisma.patient.findUnique({
        where: { id: req.params.id }
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      if (patient.bedId) {
        await prisma.bed.update({
          where: { id: patient.bedId },
          data: { status: 'vacant', patientId: null }
        });

        // Calculate bed fees
        const admission = new Date(patient.admissionDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - admission.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        const pricing = await prisma.servicePricing.findUnique({ where: { name: 'bed_fee' } });
        if (pricing) {
          const totalBedFee = diffDays * pricing.price;
          const bill = await prisma.bill.findFirst({
            where: { patientId: req.params.id, status: 'pending' },
            orderBy: { createdAt: 'desc' }
          });
          if (bill) {
            await prisma.billItem.create({
              data: {
                billId: bill.id,
                description: `Bed Fees (${diffDays} days @ ${pricing.price}/day)`,
                amount: totalBedFee,
                type: 'ward'
              }
            });
            await prisma.bill.update({
              where: { id: bill.id },
              data: { totalAmount: { increment: totalBedFee } }
            });
          }
        }
      }

      const updated = await prisma.patient.update({
        where: { id: req.params.id },
        data: { 
          status: 'discharged',
          wardId: null,
          bedId: null,
          dischargeReason: reason
        }
      });

      await logAction(
        'system', 
        'System', 
        `Patient ${updated.name} (ID: ${updated.id}) discharged. Reason: ${reason || 'Not specified'}`, 
        updated.id, 
        'Patient'
      );

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Discharge failed' });
    }
  });

  app.patch('/api/patients/:id', async (req, res) => {
    try {
      const data = req.body;
      const patient = await prisma.patient.update({
        where: { id: req.params.id },
        data: {
          ...data,
          dob: data.dob ? new Date(data.dob) : undefined,
          nextVisit: data.nextVisit ? new Date(data.nextVisit) : undefined,
          age: data.age ? parseInt(data.age) : undefined
        }
      });
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update patient' });
    }
  });

  app.post('/api/patients/:id/vitals', requireRoles('admin', 'nurse', 'doctor'), async (req, res) => {
    try {
      const vitals = await prisma.vitalSign.create({
        data: {
          ...req.body,
          patientId: req.params.id
        }
      });
      await logAction(req.body.takenBy || 'unknown', req.body.takenBy || 'Nurse', `Recorded vitals for patient`, req.params.id, 'VitalSign');
      broadcastEvent('vitals_recorded', { patientId: req.params.id, vitals });
      
      // Auto-bill nurse fee
      const pricing = await prisma.servicePricing.findUnique({ where: { name: 'nurse_fee' } });
      const bill = await prisma.bill.findFirst({
        where: { patientId: req.params.id, status: 'pending' },
        orderBy: { createdAt: 'desc' }
      });
      if (bill && pricing) {
        await prisma.billItem.create({
          data: {
            billId: bill.id,
            description: `Nursing Service Fee`,
            amount: pricing.price,
            type: 'ward'
          }
        });
        await prisma.bill.update({
          where: { id: bill.id },
          data: { totalAmount: { increment: pricing.price } }
        });
      }
      
      res.status(201).json(vitals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record vitals' });
    }
  });

  app.post('/api/patients/:id/prescriptions', requireRoles('admin', 'doctor'), async (req, res) => {
    try {
      const { medication, dosage, frequency, duration, authorId, authorName } = req.body;
      const prescription = await prisma.prescription.create({
        data: {
          patientId: req.params.id,
          medication,
          dosage,
          frequency,
          duration,
          authorId,
          authorName: authorName || 'Unknown Doctor',
          status: 'active'
        }
      });
      await logAction(authorId, authorName || 'Doctor', `Prescribed ${medication}`, req.params.id, 'Prescription');
      res.status(201).json(prescription);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create prescription' });
    }
  });

  app.patch('/api/prescriptions/:id', requireRoles('admin', 'doctor', 'pharmacy', 'pharmacy_admin'), async (req, res) => {
    try {
      const { status } = req.body;
      const rx = await prisma.prescription.update({
        where: { id: req.params.id },
        data: { status }
      });
      await logAction('system', 'Pharmacy', `Updated prescription status: ${status}`, rx.patientId, 'Prescription');
      res.json(rx);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update prescription' });
    }
  });

  app.get('/api/prescriptions', async (req, res) => {
    try {
      const { status } = req.query;
      const prescriptions = await prisma.prescription.findMany({
        where: {
          ...(status && { status: status as string })
        },
        include: { patient: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
  });

  // Inventory Routes
  app.get('/api/inventory', async (req, res) => {
    try {
      const inventory = await prisma.inventory.findMany({
        orderBy: { name: 'asc' }
      });
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  app.post('/api/inventory', requireRoles('admin', 'pharmacy', 'pharmacy_admin'), async (req, res) => {
    try {
      const { name, category, stockLevel, unit, description, expiryDate, price } = req.body;
      const item = await prisma.inventory.create({
        data: { 
          name, 
          category, 
          stockLevel: parseInt(stockLevel) || 0, 
          price: parseFloat(price) || 0,
          unit, 
          description,
          expiryDate: expiryDate ? new Date(expiryDate) : null
        }
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item to inventory' });
    }
  });

  app.patch('/api/inventory/category/rename', requireRoles('admin', 'pharmacy', 'pharmacy_admin'), async (req, res) => {
    try {
      const { oldCategory, newCategory } = req.body;
      if (!oldCategory || !newCategory) {
        return res.status(400).json({ error: 'Both oldCategory and newCategory are required' });
      }
      const result = await prisma.inventory.updateMany({
        where: { category: oldCategory },
        data: { category: newCategory }
      });
      await logAction('system', 'Pharmacy', `Renamed inventory category from "${oldCategory}" to "${newCategory}"`, undefined, 'Inventory');
      res.json({ message: 'Category renamed successfully', count: result.count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to rename category' });
    }
  });

  app.patch('/api/inventory/:id', requireRoles('admin', 'pharmacy', 'pharmacy_admin'), async (req, res) => {
    try {
      const { name, category, stockLevel, unit, description, expiryDate, price } = req.body;
      const item = await prisma.inventory.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(category !== undefined && { category }),
          ...(stockLevel !== undefined && { stockLevel: parseInt(stockLevel) }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(unit !== undefined && { unit }),
          ...(description !== undefined && { description }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null })
        }
      });
      await logAction('system', 'Pharmacy', `Updated inventory item: ${item.name}`, item.id, 'Inventory');
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  });

  app.delete('/api/inventory/:id', requireRoles('admin', 'pharmacy', 'pharmacy_admin'), async (req, res) => {
    try {
      const item = await prisma.inventory.delete({
        where: { id: req.params.id }
      });
      await logAction('system', 'Pharmacy', `Deleted inventory item: ${item.name}`, item.id, 'Inventory');
      res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete inventory item' });
    }
  });

  app.patch('/api/investigations/:id', requireRoles('admin', 'doctor', 'lab', 'radiology', 'scientist', 'radiographer'), async (req, res) => {
    try {
      const { status, result, fileUrl } = req.body;
      const inv = await prisma.investigation.update({
        where: { id: req.params.id },
        data: { 
          ...(status && { status }),
          ...(result && { result }),
          ...(fileUrl && { fileUrl })
        }
      });
      await logAction('system', 'Diagnostic Unit', `Updated investigation ${inv.testName} to ${status}`, inv.patientId, 'Investigation');
      res.json(inv);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update investigation' });
    }
  });

  // Physiotherapy Endpoints
  app.get('/api/physiotherapy/referrals', async (req, res) => {
    try {
      const { status, patientId } = req.query;
      const referrals = await prisma.physiotherapyReferral.findMany({
        where: {
          ...(status && { status: status as string }),
          ...(patientId && { patientId: patientId as string }),
        },
        include: { patient: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch physiotherapy referrals' });
    }
  });

  app.post('/api/patients/:id/physiotherapy', requireRoles('admin', 'doctor'), async (req, res) => {
    try {
      const { referredBy, clinicalIndication, bodyRegion, treatmentType, sessionsRequested, priority, notes } = req.body;
      const referral = await prisma.physiotherapyReferral.create({
        data: {
          patientId: req.params.id,
          referredBy: referredBy || 'Doctor',
          clinicalIndication: clinicalIndication || 'Rehabilitation',
          bodyRegion: bodyRegion || 'General',
          treatmentType: treatmentType || 'Manual Therapy',
          sessionsRequested: parseInt(sessionsRequested) || 1,
          sessionsCompleted: 0,
          priority: priority || 'routine',
          status: 'pending',
          notes
        },
        include: { patient: true }
      });

      await logAction('system', referredBy || 'Doctor', `Referred patient to Physiotherapy for ${bodyRegion}`, req.params.id, 'Patient');
      res.status(201).json(referral);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create physiotherapy referral' });
    }
  });

  app.patch('/api/physiotherapy/referrals/:id', requireRoles('admin', 'doctor', 'physiotherapist', 'physio'), async (req, res) => {
    try {
      const { status, sessionsCompleted, notes } = req.body;
      const updated = await prisma.physiotherapyReferral.update({
        where: { id: req.params.id },
        data: {
          ...(status && { status }),
          ...(sessionsCompleted !== undefined && { sessionsCompleted: parseInt(sessionsCompleted) }),
          ...(notes && { notes })
        },
        include: { patient: true }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update physiotherapy referral' });
    }
  });

  // Investigations
  app.get('/api/investigations', async (req, res) => {
    try {
      const { type, status } = req.query;
      const investigations = await prisma.investigation.findMany({
        where: {
          ...(type && { type: type as string }),
          ...(status && { status: status as string }),
        },
        include: { patient: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(investigations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch investigations' });
    }
  });

  app.post('/api/patients/:id/investigations', requireRoles('admin', 'doctor', 'nurse'), async (req, res) => {
    try {
      const { type, category, testName, priority, requestedBy } = req.body;
      const inv = await prisma.investigation.create({
        data: {
          patientId: req.params.id,
          type,
          category,
          testName,
          priority,
          requestedBy,
          status: 'pending'
        }
      });

      // Auto-bill investigation
      const bill = await prisma.bill.findFirst({
        where: { patientId: req.params.id, status: 'pending' },
        orderBy: { createdAt: 'desc' }
      });

      if (bill) {
        // Try to find pricing
        const pricing = await prisma.servicePricing.findFirst({
          where: { name: testName }
        });
        const amount = pricing ? pricing.price : (type === 'laboratory' ? 2500 : 5000);

        await prisma.billItem.create({
          data: {
            billId: bill.id,
            description: `${testName} (${category})`,
            amount: amount,
            type: 'investigation'
          }
        });
        await prisma.bill.update({
          where: { id: bill.id },
          data: { totalAmount: { increment: amount } }
        });
      }

      await logAction('system', requestedBy, `Requested ${testName}`, req.params.id, 'Investigation');
      res.status(201).json(inv);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create investigation request' });
    }
  });

  // Billing
  app.get('/api/patients/:id/bills', async (req, res) => {
    try {
      const bills = await prisma.bill.findMany({
        where: { patientId: req.params.id },
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(bills);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bills' });
    }
  });

  app.post('/api/patients/:id/bills', async (req, res) => {
    try {
      const bill = await prisma.bill.create({
        data: {
          patientId: req.params.id,
          status: 'pending',
          totalAmount: 0
        },
        include: { items: true }
      });
      res.status(201).json(bill);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create bill' });
    }
  });

  app.post('/api/bills/:id/pay', async (req, res) => {
    try {
      const bill = await prisma.bill.update({
        where: { id: req.params.id },
        data: { status: 'paid' }
      });
      res.json(bill);
    } catch (error) {
      res.status(500).json({ error: 'Payment failed' });
    }
  });

  // Treatment Plans & Reviews
  app.post('/api/patients/:id/treatment-plans', async (req, res) => {
    try {
      const { content, authorId, authorName } = req.body;
      const plan = await prisma.treatmentPlan.create({
        data: {
          content,
          authorId,
          authorName,
          patientId: req.params.id
        }
      });
      await logAction(authorId, authorName, `Created treatment plan`, req.params.id, 'TreatmentPlan');
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create treatment plan' });
    }
  });

  app.post('/api/patients/:id/reviews', async (req, res) => {
    try {
      const { content, authorId, authorName } = req.body;
      const review = await prisma.review.create({
        data: {
          content,
          authorId,
          authorName,
          patientId: req.params.id
        }
      });
      await logAction(authorId, authorName, `Patient review recorded`, req.params.id, 'Review');

      // If a review is completed, maybe auto-bill consultation?
      const bill = await prisma.bill.findFirst({
        where: { patientId: req.params.id, status: 'pending' },
        orderBy: { createdAt: 'desc' }
      });

      const pricing = await prisma.servicePricing.findUnique({ where: { name: 'consultation' } });

      if (bill && pricing) {
        await prisma.billItem.create({
          data: {
            billId: bill.id,
            description: `Consultation Fee`,
            amount: pricing.price,
            type: 'consultation'
          }
        });
        await prisma.bill.update({
          where: { id: bill.id },
          data: { totalAmount: { increment: pricing.price } }
        });
      }

      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record review' });
    }
  });

  // Pricing Management
  app.get('/api/pricing', async (req, res) => {
    try {
      const pricing = await prisma.servicePricing.findMany({
        orderBy: { category: 'asc' }
      });
      res.json(pricing);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pricing' });
    }
  });

  // Global Billing for Admin
  app.get('/api/bills', async (req, res) => {
    try {
      const bills = await prisma.bill.findMany({
        include: { items: true, patient: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(bills);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch global bills' });
    }
  });

  app.post('/api/pricing', async (req, res) => {
    try {
      const { name, category, price } = req.body;
      const pricing = await prisma.servicePricing.upsert({
        where: { name },
        update: { category, price: parseFloat(price) },
        create: { name, category, price: parseFloat(price) }
      });
      res.status(201).json(pricing);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update pricing' });
    }
  });

  app.get('/api/patients', requireRoles('admin', 'doctor', 'nurse', 'record', 'pharmacy', 'pharmacy_admin', 'lab', 'radiology', 'scientist', 'radiographer', 'physiotherapist', 'physio'), async (req, res) => {
    try {
      const reqUserId = (req.headers['x-user-id'] as string) || 'system';
      const reqUserName = (req.headers['x-user-name'] as string) || (req.headers['x-user-role'] as string) || 'Staff';

      const patients = await prisma.patient.findMany({
        orderBy: { admissionDate: 'desc' }
      });
      await logAction(reqUserId, reqUserName, 'Accessed patient directory', undefined, 'Patient');
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  app.get('/api/patients/:id', requireRoles('admin', 'doctor', 'nurse', 'record', 'pharmacy', 'pharmacy_admin', 'lab', 'radiology', 'scientist', 'radiographer', 'physiotherapist', 'physio'), async (req, res) => {
    try {
      const reqUserId = (req.headers['x-user-id'] as string) || 'system';
      const reqUserName = (req.headers['x-user-name'] as string) || (req.headers['x-user-role'] as string) || 'Staff';

      const patient = await prisma.patient.findUnique({
        where: { id: req.params.id },
        include: { 
          notes: { orderBy: { createdAt: 'desc' } },
          prescriptions: { orderBy: { createdAt: 'desc' } },
          investigations: { orderBy: { createdAt: 'desc' } },
          vitals: { orderBy: { createdAt: 'desc' }, take: 10 },
          bills: { include: { items: true }, orderBy: { createdAt: 'desc' } },
          treatmentPlans: { orderBy: { createdAt: 'desc' } },
          reviews: { orderBy: { createdAt: 'desc' } },
          physiotherapyReferrals: { orderBy: { createdAt: 'desc' } },
          bed: true
        }
      });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      await logAction(reqUserId, reqUserName, `Viewed patient medical record: ${patient.name}`, patient.id, 'Patient');
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patient details' });
    }
  });

  // Appointments
  app.get('/api/appointments', async (req, res) => {
    try {
      const { patientId } = req.query;
      const appointments = await prisma.appointment.findMany({
        where: patientId ? { patientId: String(patientId) } : {},
        include: { patient: true },
        orderBy: { dateTime: 'asc' }
      });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  app.post('/api/appointments', async (req, res) => {
    try {
      const { patientId, doctorId, doctorName, dateTime, reason, type, status } = req.body;
      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          doctorId,
          doctorName,
          dateTime: new Date(dateTime),
          reason,
          type,
          status: status || 'scheduled'
        }
      });
      await logAction('system', 'System', `Booked appointment for patient ID: ${patientId}`, appointment.id, 'Appointment');
      res.status(201).json(appointment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  });

  app.patch('/api/appointments/:id', async (req, res) => {
    try {
      const { status, dateTime, reason, doctorName } = req.body;
      const appointment = await prisma.appointment.update({
        where: { id: req.params.id },
        data: { 
          status, 
          dateTime: dateTime ? new Date(dateTime) : undefined,
          reason,
          doctorName
        }
      });
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  });

  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      await prisma.appointment.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  });

  app.post('/api/patients/:id/notes', requireRoles('admin', 'doctor', 'nurse'), async (req, res) => {
    try {
      const { content, type, authorId, authorName, parentNoteId } = req.body;
      let version = 1;
      let targetType = type || 'physician';

      if (parentNoteId) {
        const parentNote = await prisma.clinicalNote.findUnique({
          where: { id: parentNoteId }
        });
        if (parentNote) {
          const countExisting = await prisma.clinicalNote.count({
            where: {
              OR: [
                { id: parentNoteId },
                { parentNoteId: parentNoteId }
              ]
            }
          });
          version = countExisting + 1;
          targetType = 'addendum';
        }
      }

      const note = await prisma.clinicalNote.create({
        data: {
          content,
          type: targetType,
          authorId,
          authorName,
          version,
          parentNoteId: parentNoteId || null,
          patientId: req.params.id
        }
      });
      await logAction(authorId, authorName, `Added ${targetType} note (v${version})`, req.params.id, 'ClinicalNote');
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create note' });
    }
  });

  // Immutability Guard: Reject PUT/PATCH/DELETE on ClinicalNote
  app.all('/api/patients/:patientId/notes/:noteId', (req, res) => {
    if (['PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ error: 'Clinical Notes are immutable and cannot be edited or deleted.' });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  });

  // HL7 FHIR R4 Interoperability Converters & Endpoints
  function toFhirPatient(p: any) {
    return {
      resourceType: 'Patient',
      id: p.id,
      active: p.status !== 'discharged',
      name: [{
        use: 'official',
        text: p.name,
        family: p.name.split(' ').slice(-1)[0] || '',
        given: p.name.split(' ').slice(0, -1)
      }],
      gender: p.gender === 'male' ? 'male' : p.gender === 'female' ? 'female' : 'other',
      birthDate: p.dob ? new Date(p.dob).toISOString().split('T')[0] : undefined,
      address: p.address ? [{ text: p.address }] : [],
      contact: p.nextOfKinName ? [{
        relationship: [{ text: p.nextOfKinRelationship || 'Emergency Contact' }],
        name: { text: p.nextOfKinName },
        telecom: p.nextOfKinPhone ? [{ system: 'phone', value: p.nextOfKinPhone }] : []
      }] : []
    };
  }

  function toFhirObservation(v: any) {
    const components: any[] = [];
    if (v.bp) {
      const parts = v.bp.split('/');
      if (parts.length === 2) {
        components.push({
          code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
          valueQuantity: { value: parseFloat(parts[0]), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
        });
        components.push({
          code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
          valueQuantity: { value: parseFloat(parts[1]), unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
        });
      }
    }
    if (v.temp) {
      components.push({
        code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }] },
        valueQuantity: { value: v.temp, unit: 'C', system: 'http://unitsofmeasure.org', code: 'Cel' }
      });
    }
    if (v.pulse) {
      components.push({
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
        valueQuantity: { value: v.pulse, unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' }
      });
    }
    if (v.spo2) {
      components.push({
        code: { coding: [{ system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation' }] },
        valueQuantity: { value: v.spo2, unit: '%', system: 'http://unitsofmeasure.org', code: '%' }
      });
    }

    return {
      resourceType: 'Observation',
      id: v.id,
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
      subject: { reference: `Patient/${v.patientId}` },
      effectiveDateTime: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
      performer: [{ display: v.takenBy || 'Nurse' }],
      component: components
    };
  }

  function toFhirMedicationRequest(rx: any) {
    return {
      resourceType: 'MedicationRequest',
      id: rx.id,
      status: rx.status === 'active' ? 'active' : rx.status === 'completed' ? 'completed' : 'stopped',
      intent: 'order',
      medicationCodeableConcept: {
        text: rx.medication
      },
      subject: { reference: `Patient/${rx.patientId}` },
      requester: { display: rx.authorName || 'Doctor' },
      dosageInstruction: [{
        text: `${rx.dosage} ${rx.frequency} for ${rx.duration}`
      }],
      authoredOn: rx.createdAt ? new Date(rx.createdAt).toISOString() : new Date().toISOString()
    };
  }

  function toFhirDiagnosticReport(inv: any) {
    return {
      resourceType: 'DiagnosticReport',
      id: inv.id,
      status: inv.status === 'completed' || inv.status === 'reviewed' ? 'final' : 'registered',
      code: { text: inv.testName },
      subject: { reference: `Patient/${inv.patientId}` },
      effectiveDateTime: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
      issued: inv.updatedAt ? new Date(inv.updatedAt).toISOString() : undefined,
      conclusion: inv.result || undefined,
      presentedForm: inv.fileUrl ? [{ url: inv.fileUrl }] : []
    };
  }

  function toFhirEncounter(p: any) {
    return {
      resourceType: 'Encounter',
      id: `enc-${p.id}`,
      status: p.status === 'inpatient' ? 'in-progress' : 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: p.status === 'inpatient' ? 'IMP' : 'AMB',
        display: p.status === 'inpatient' ? 'inpatient encounter' : 'ambulatory'
      },
      subject: { reference: `Patient/${p.id}`, display: p.name },
      period: {
        start: p.admissionDate ? new Date(p.admissionDate).toISOString() : undefined
      },
      location: p.wardId ? [{ location: { display: `Ward: ${p.wardId}, Bed: ${p.bedId || 'N/A'}` } }] : []
    };
  }

  app.get('/api/fhir/R4/Patient', async (req, res) => {
    try {
      const patients = await prisma.patient.findMany({ orderBy: { admissionDate: 'desc' } });
      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: patients.length,
        entry: patients.map(p => ({
          fullUrl: `${req.protocol}://${req.get('host')}/api/fhir/R4/Patient/${p.id}`,
          resource: toFhirPatient(p)
        }))
      };
      res.json(bundle);
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  app.get('/api/fhir/R4/Patient/:id', async (req, res) => {
    try {
      const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
      if (!patient) {
        return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found', diagnostics: 'Patient not found' }] });
      }
      res.json(toFhirPatient(patient));
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  app.get('/api/fhir/R4/Observation', async (req, res) => {
    try {
      const { patient } = req.query;
      const vitals = await prisma.vitalSign.findMany({
        where: patient ? { patientId: String(patient) } : {},
        orderBy: { createdAt: 'desc' }
      });
      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: vitals.length,
        entry: vitals.map(v => ({
          fullUrl: `${req.protocol}://${req.get('host')}/api/fhir/R4/Observation/${v.id}`,
          resource: toFhirObservation(v)
        }))
      };
      res.json(bundle);
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  app.get('/api/fhir/R4/MedicationRequest', async (req, res) => {
    try {
      const { patient } = req.query;
      const prescriptions = await prisma.prescription.findMany({
        where: patient ? { patientId: String(patient) } : {},
        orderBy: { createdAt: 'desc' }
      });
      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: prescriptions.length,
        entry: prescriptions.map(rx => ({
          fullUrl: `${req.protocol}://${req.get('host')}/api/fhir/R4/MedicationRequest/${rx.id}`,
          resource: toFhirMedicationRequest(rx)
        }))
      };
      res.json(bundle);
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  app.get('/api/fhir/R4/DiagnosticReport', async (req, res) => {
    try {
      const { patient } = req.query;
      const investigations = await prisma.investigation.findMany({
        where: patient ? { patientId: String(patient) } : {},
        orderBy: { createdAt: 'desc' }
      });
      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: investigations.length,
        entry: investigations.map(inv => ({
          fullUrl: `${req.protocol}://${req.get('host')}/api/fhir/R4/DiagnosticReport/${inv.id}`,
          resource: toFhirDiagnosticReport(inv)
        }))
      };
      res.json(bundle);
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  app.get('/api/fhir/R4/Encounter', async (req, res) => {
    try {
      const { patient } = req.query;
      const patients = await prisma.patient.findMany({
        where: patient ? { id: String(patient) } : {},
        orderBy: { admissionDate: 'desc' }
      });
      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: patients.length,
        entry: patients.map(p => ({
          fullUrl: `${req.protocol}://${req.get('host')}/api/fhir/R4/Encounter/enc-${p.id}`,
          resource: toFhirEncounter(p)
        }))
      };
      res.json(bundle);
    } catch (err: any) {
      res.status(500).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }] });
    }
  });

  // Seed Helper (for development)
  app.post('/api/dev/seed', async (req, res) => {
    try {
      // Create admin user
      const admin = await prisma.user.upsert({
        where: { phone: '08000000000' },
        update: {
          email: 'admin@hospital.com',
          password: 'admin',
          role: 'admin'
        },
        create: {
          name: 'Chief Admin',
          phone: '08000000000',
          email: 'admin@hospital.com',
          password: 'admin',
          role: 'admin'
        }
      });

      // Create a few wards if they don't exist
      const maternity = await prisma.ward.upsert({
        where: { id: 'maternity' },
        update: {},
        create: { id: 'maternity', name: 'Maternity Ward', capacity: 10 }
      });

      // Simple patient
      await prisma.patient.create({
        data: {
          name: 'Sarah Connor',
          gender: 'female',
          dob: new Date('1985-05-12'),
          bloodGroup: 'O+',
          status: 'inpatient',
          notes: {
            create: {
              content: 'Patient admitted for routine screening.',
              type: 'physician',
              authorId: 'dev-user',
              authorName: 'Dr. Smith'
            }
          }
        }
      });

      res.json({ message: 'Database seeded successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Middleware for Dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
