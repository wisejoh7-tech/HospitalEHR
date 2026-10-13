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
} else if (process.env.DATABASE_URL.includes('@dpg-') && !process.env.DATABASE_URL.includes('.render.com')) {
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

  // Configurable admin credentials via environment variables
  const adminName = process.env.ADMIN_NAME || 'System Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hospital.com';
  const adminPhone = process.env.ADMIN_PHONE || '08000000000';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  // Ensure default admin exists
  const ensureAdmin = async () => {
    try {
      const existingAdminByEmail = await prisma.user.findFirst({
        where: { email: adminEmail }
      });
      const existingAdminByPhone = await prisma.user.findFirst({
        where: { phone: adminPhone }
      });

      if (existingAdminByEmail && existingAdminByPhone && existingAdminByEmail.id !== existingAdminByPhone.id) {
        // Resolve duplicate admin entries safely before update
        await prisma.user.delete({ where: { id: existingAdminByPhone.id } });
      }

      if (existingAdminByEmail) {
        await prisma.user.update({
          where: { id: existingAdminByEmail.id },
          data: {
            name: adminName,
            email: adminEmail,
            phone: adminPhone,
            password: adminPassword,
            role: 'admin'
          }
        });
      } else if (existingAdminByPhone) {
        await prisma.user.update({
          where: { id: existingAdminByPhone.id },
          data: {
            name: adminName,
            email: adminEmail,
            phone: adminPhone,
            password: adminPassword,
            role: 'admin'
          }
        });
      } else {
        await prisma.user.create({
          data: {
            name: adminName,
            phone: adminPhone,
            email: adminEmail,
            password: adminPassword,
            role: 'admin'
          }
        });
      }
      console.log(`✅ Default admin account verified (${adminPhone} or ${adminEmail})`);
    } catch (err) {
      console.error('Failed to ensure default admin:', err);
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
      const rawIdentifier = (identifier || phone || email || '').toString().trim();
      const cleanPassword = password ? String(password).trim() : '';

      if (!cleanPassword || !rawIdentifier) {
        return res.status(401).json({ error: 'Invalid email/phone or password' });
      }

      const allUsers = await prisma.user.findMany();

      let user = allUsers.find(u => {
        const matchesEmail = u.email && u.email.toLowerCase() === rawIdentifier.toLowerCase();
        const matchesPhone = u.phone && phonesMatch(u.phone, rawIdentifier);
        const matchesEmailPrefix = u.email && !rawIdentifier.includes('@') && u.email.toLowerCase().startsWith(rawIdentifier.toLowerCase() + '@');
        const matchesName = u.name && u.name.toLowerCase() === rawIdentifier.toLowerCase();
        return Boolean(matchesEmail || matchesPhone || matchesEmailPrefix || matchesName);
      }) || null;

      // Fallback: If searching for admin credentials specifically
      if (
        !user &&
        (
          rawIdentifier.toLowerCase() === adminEmail.toLowerCase() ||
          phonesMatch(rawIdentifier, adminPhone) ||
          rawIdentifier.toLowerCase() === adminName.toLowerCase() ||
          rawIdentifier.toLowerCase() === 'admin@hospital.com' ||
          phonesMatch(rawIdentifier, '08000000000') ||
          rawIdentifier.toLowerCase() === 'admin'
        )
      ) {
        user = allUsers.find(u =>
          (u.email && u.email.toLowerCase() === adminEmail.toLowerCase()) ||
          (u.phone && phonesMatch(u.phone, adminPhone)) ||
          (u.name && u.name.toLowerCase() === adminName.toLowerCase()) ||
          u.role === 'admin'
        ) || null;
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email/phone or password' });
      }

      if (user.password !== cleanPassword) {
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
        return res.status(400).json({ error: 'Email or phone number is already registered' });
      }
      res.status(500).json({ error: error.message || 'Registration failed. Please try again.' });
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
  app.post('/api/patients', async (req, res) => {
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
          workflowStatus: workflowStatus || 'vitals'
        }
      });
      await logAction('system', 'System', `Registered patient: ${patient.name}. Sent to Vitals.`, patient.id, 'Patient');
      res.status(201).json(patient);
    } catch (error) {
      console.error('Patient registration error:', error);
      res.status(500).json({ error: 'Failed to register patient. Please check your data.' });
    }
  });

  app.patch('/api/patients/:id/workflow', async (req, res) => {
    try {
      const { workflowStatus } = req.body;
      const patient = await prisma.patient.update({
        where: { id: req.params.id },
        data: { workflowStatus }
      });
      await logAction('system', 'Clinical Flow', `Moved patient ${patient.name} to ${workflowStatus}`, patient.id, 'Patient');
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

  app.post('/api/patients/:id/vitals', async (req, res) => {
    try {
      const vitals = await prisma.vitalSign.create({
        data: {
          ...req.body,
          patientId: req.params.id
        }
      });
      await logAction(req.body.takenBy || 'unknown', req.body.takenBy || 'Nurse', `Recorded vitals for patient`, req.params.id, 'VitalSign');
      
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

  app.post('/api/patients/:id/prescriptions', async (req, res) => {
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

  app.patch('/api/prescriptions/:id', async (req, res) => {
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

  app.post('/api/inventory', async (req, res) => {
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

  app.patch('/api/inventory/:id', async (req, res) => {
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

  app.patch('/api/investigations/:id', async (req, res) => {
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

  app.post('/api/patients/:id/investigations', async (req, res) => {
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

  app.get('/api/patients', async (req, res) => {
    try {
      const patients = await prisma.patient.findMany({
        orderBy: { admissionDate: 'desc' }
      });
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  app.get('/api/patients/:id', async (req, res) => {
    try {
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
          bed: true
        }
      });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
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

  app.post('/api/patients/:id/notes', async (req, res) => {
    try {
      const { content, type, authorId, authorName } = req.body;
      const note = await prisma.clinicalNote.create({
        data: {
          content,
          type,
          authorId,
          authorName,
          patientId: req.params.id
        }
      });
      await logAction(authorId, authorName, `Added ${type} note`, req.params.id, 'ClinicalNote');
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create note' });
    }
  });

  // Seed Helper (for development)
  app.post('/api/dev/seed', async (req, res) => {
    try {
      // Create admin user
      const admin = await prisma.user.upsert({
        where: { phone: '08000000000' },
        update: {},
        create: {
          name: 'Chief Admin',
          phone: '08000000000',
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
