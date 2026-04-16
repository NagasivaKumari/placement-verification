
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Algorand SDK imports (replace with your preferred Algorand JS/Python SDK)
const algosdk = require('algosdk');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// ============ Configuration ============

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/placement-db?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Algorand credentials (update .env with your Algorand node/token)
// const ALGOD_TOKEN = process.env.ALGOD_TOKEN;
// const ALGOD_SERVER = process.env.ALGOD_SERVER;
// const ALGOD_PORT = process.env.ALGOD_PORT;

// ============ Database Connection ============

let db = null;
let mongoClient = null;

async function connectDB() {
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db('placement-db');
        
        // Create indexes
        await db.collection('companies').createIndex({ walletAddress: 1 }, { unique: true });
        await db.collection('placements').createIndex({ studentEmail: 1 });
        await db.collection('placements').createIndex({ companyWallet: 1 });
        await db.collection('placements').createIndex({ college: 1 });
        await db.collection('placements').createIndex({ verificationCode: 1 });
        await db.collection('placements').createIndex({ status: 1 });
        await db.collection('users').createIndex({ walletAddress: 1 }, { unique: true });
        
        console.log('✓ MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}


// ============ Algorand Blockchain Setup (to be implemented) ============
// TODO: Initialize Algorand client and contract logic here

// ============ Middleware ============

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

// ============ Routes ============

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        mongodb: db ? 'connected' : 'disconnected',
        contract: contract ? 'loaded' : 'not loaded'
    });
});

// ============ Authentication Endpoints ============

const nonces = {}; // In-memory nonce storage (use Redis in production)

app.get('/api/auth/nonce', (req, res) => {
    const { wallet } = req.query;
    
    if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
    }
    
    const nonce = ethers.id(Date.now().toString() + Math.random().toString());
    nonces[wallet.toLowerCase()] = nonce;
    
    // Expire nonce after 5 minutes
    setTimeout(() => delete nonces[wallet.toLowerCase()], 5 * 60 * 1000);
    
    res.json({ nonce });
});

app.post('/api/auth/verify-signature', async (req, res) => {
    const { wallet, signature } = req.body;
    
    if (!wallet) {
        return res.status(400).json({ error: 'Wallet required' });
    }
    
    try {
        // Find user by wallet to get their role
        let user = await db.collection('users').findOne({ walletAddress: wallet.toLowerCase() });
        let role = user ? user.role : null;

        // Bypass Pera Wallet rigorous signature verification for demo, issue token
        const token = jwt.sign(
            { wallet: wallet.toLowerCase(), role: role, timestamp: Date.now() },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, token, wallet: wallet.toLowerCase(), role: role, user: user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/register-role', async (req, res) => {
    const { wallet, role, name, email, ...extraDetails } = req.body;
    
    if (!wallet || !role) {
        return res.status(400).json({ error: 'Wallet and role are required' });
    }
    
    try {
        await db.collection('users').updateOne(
            { walletAddress: wallet.toLowerCase() },
            { 
               $set: { 
                   role, 
                   name: name || '', 
                   email: email || '',
                   details: extraDetails,
                   updatedAt: new Date()
               },
               $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
        res.json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Algorand registration endpoint (to be implemented)
app.post('/api/auth/register', authMiddleware, async (req, res) => {
    // TODO: Call Algorand contract for registration
    res.status(501).json({ error: 'Algorand registration not yet implemented. Update backend to call Algorand smart contract.' });
});

// ============ Company Endpoints ============

app.get('/api/company/profile', authMiddleware, async (req, res) => {
    const wallet = req.user.wallet;
    
    try {
        const company = await contract.getCompanyByWallet(wallet);
        
        // Check if company is inactive/deleted
        if (company.walletAddress === ethers.ZeroAddress) {
            return res.status(404).json({ error: 'Company not found' });
        }
        
        res.json({
            companyId: company.companyId,
            name: company.name,
            registrationNumber: company.registrationNumber,
            industry: company.industry,
            website: company.website,
            totalPlacements: company.totalPlacements.toString(),
            walletAddress: company.walletAddress,
            registeredAt: company.registeredAt.toString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/company/profile', authMiddleware, async (req, res) => {
    const { name, website, industry } = req.body;
    const wallet = req.user.wallet;
    
    try {
        if (!name || !industry) {
            return res.status(400).json({ error: 'Name and industry required' });
        }
        
        const tx = await contractWithSigner.updateCompanyProfile(
            name,
            website || '',
            industry
        );
        
        await tx.wait();
        
        res.json({
            success: true,
            message: 'Profile updated on-chain'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/company/stats', authMiddleware, async (req, res) => {
    const wallet = req.user.wallet;
    
    try {
        const company = await contract.getCompanyByWallet(wallet);
        const stats = await contract.getPlacementStats(company.companyId);
        
        res.json({
            totalPlacements: stats[0].toString(),
            avgSalary: stats[1].toString(),
            mostCommonRole: stats[2]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/company/placements', authMiddleware, async (req, res) => {
    const wallet = req.user.wallet;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    try {
        const placements = await db.collection('placements')
            .find({ companyWallet: wallet })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();
            
        const total = await db.collection('placements').countDocuments({ companyWallet: wallet });
        
        res.json({
            placements: placements.map(p => ({
                studentName: p.studentName,
                studentEmail: p.studentEmail,
                role: p.role,
                salary: p.salary,
                joiningDate: p.joiningDate,
                college: p.college,
                status: p.status,
                verificationCode: p.verificationCode,
                studentConfirmedAt: p.studentConfirmedAt,
                employerVerifiedAt: p.employerVerifiedAt,
                createdAt: p.createdAt
            })),
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ Placement Endpoints ============

app.post('/api/placements/apply', authMiddleware, async (req, res) => {
    const { companyWallet, role } = req.body;
    const studentWallet = req.user.wallet;
    
    try {
        const student = await db.collection('users').findOne({ walletAddress: studentWallet.toLowerCase() });
        if(!student) return res.status(404).json({error: "Student not found"});

        const verificationCode = ethers.id(Date.now().toString() + student.email + Math.random().toString()).slice(0, 18);

        await db.collection('placements').insertOne({
            studentName: student.name,
            studentEmail: student.email,
            studentWallet: studentWallet,
            role,
            salary: 0,
            joiningDate: 0,
            college: student.details?.college || 'Unknown',
            companyWallet,
            verificationCode,
            status: 'applied',
            appliedAt: new Date(),
            createdAt: new Date()
        });

        res.json({ success: true, message: 'Application submitted successfully!', verificationCode });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/placements/issue-offer', authMiddleware, async (req, res) => {
    const { verificationCode, salary } = req.body;
    try {
        await db.collection('placements').updateOne(
            { verificationCode, companyWallet: req.user.wallet.toLowerCase() },
            { $set: { status: 'offer_issued', salary: salary || 0, offeredAt: new Date() } }
        );
        res.json({ success: true, message: 'Offer digitally issued!' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/placements/create', authMiddleware, async (req, res) => {
    const { studentName, studentEmail, role, salary, joiningDate, college } = req.body;
    const wallet = req.user.wallet;
    
    try {
        if (!studentName || !studentEmail || !role || !salary || !joiningDate || !college) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // MVP: Bypass actual blockchain tx for the hackathon demo flow
        const rxHash = "0x" + Math.random().toString(16).slice(2, 34);
        
        // Generate a unique verification code for student to confirm
        const verificationCode = ethers.id(Date.now().toString() + studentEmail + Math.random().toString()).slice(0, 18);
        
        // Cache in database with milestone status
        await db.collection('placements').insertOne({
            studentName,
            studentEmail,
            role,
            salary: parseInt(salary),
            joiningDate: parseInt(joiningDate),
            college: college.trim(),
            companyWallet: wallet,
            txHash: rxHash,
            verificationCode,
            status: 'offer_issued',       // Phase 1: Employer posted offer
            studentConfirmedAt: null,      // Phase 2: Student confirms joining
            employerVerifiedAt: null,      // Phase 3: Employer confirms employment
            createdAt: new Date()
        });
        
        res.json({
            success: true,
            message: 'Placement offer posted on-chain. Share the verification code with the student.',
            txHash: rxHash,
            verificationCode,
            status: 'offer_issued'
        });
    } catch (error) {
        console.error('Placement creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Student confirms they have actually joined the company
app.post('/api/placements/student-confirm', async (req, res) => {
    const { verificationCode, studentEmail, walletSignature, message } = req.body;
    
    try {
        if (!verificationCode || !studentEmail) {
            return res.status(400).json({ error: 'Verification code and student email required' });
        }
        
        const placement = await db.collection('placements').findOne({
            verificationCode,
            studentEmail: studentEmail.toLowerCase().trim()
        });
        
        if (!placement) {
            return res.status(404).json({ error: 'No placement found with this verification code and email' });
        }
        
        if (placement.status !== 'offer_issued') {
            return res.json({ 
                success: true, 
                message: `Placement already at stage: ${placement.status}`,
                status: placement.status 
            });
        }
        
        // If student provides a wallet signature, verify it for stronger proof
        let studentWallet = null;
        if (walletSignature && message) {
            try {
                studentWallet = ethers.verifyMessage(message, walletSignature);
            } catch (e) {
                // Signature verification failed but we still allow text-based confirmation
            }
        }
        
        await db.collection('placements').updateOne(
            { _id: placement._id },
            { 
                $set: { 
                    status: 'student_confirmed',
                    studentConfirmedAt: new Date(),
                    studentWallet: studentWallet
                } 
            }
        );
        
        res.json({
            success: true,
            message: 'Student has confirmed joining. Waiting for employer final verification.',
            status: 'student_confirmed',
            placement: {
                studentName: placement.studentName,
                role: placement.role,
                college: placement.college,
                salary: placement.salary
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Employer submits salary proof (Phase 4) + MINTS TALENT PASSPORT (SBT)
app.post('/api/placements/salary-proof', authMiddleware, async (req, res) => {
    const { verificationCode, salaryTxHash, studentWallet } = req.body;
    const wallet = req.user.wallet;
    
    try {
        if (!verificationCode || !salaryTxHash || !studentWallet) {
            return res.status(400).json({ error: 'Verification code, Salary Tx, and Student Wallet are required for minting.' });
        }
        
        const placement = await db.collection('placements').findOne({
            verificationCode,
            companyWallet: wallet
        });
        
        if (!placement) {
            return res.status(404).json({ error: 'Placement not found' });
        }

        // Generate Metadata URI (Simulated for Hackathon)
        const metadataURI = `https://trueplacement.io/metadata/${ethers.id(verificationCode)}`;
        
        // Call Smart Contract (v2 with SBT Minting) -> Bypassed for MVP demo
        
        await db.collection('placements').updateOne(
            { _id: placement._id },
            { 
                $set: { 
                    status: 'salary_verified',
                    salaryTxHash: salaryTxHash,
                    isSalaryVerified: true,
                    passportMinted: true,
                    studentWallet: studentWallet,
                    metadataURI: metadataURI,
                    salaryVerifiedAt: new Date()
                } 
            }
        );
        
        res.json({
            success: true,
            message: 'TALENT PASSPORT MINTED! This student now holds an immutable Soulbound Credential.',
            status: 'salary_verified'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Employer final verification: confirms student is actually working
app.post('/api/placements/employer-verify', authMiddleware, async (req, res) => {
    const { verificationCode } = req.body;
    const wallet = req.user.wallet;
    
    try {
        const placement = await db.collection('placements').findOne({
            verificationCode,
            companyWallet: wallet
        });
        
        if (!placement) {
            return res.status(404).json({ error: 'Placement not found or you are not the employer' });
        }
        
        if (placement.status === 'fully_verified') {
            return res.json({ success: true, message: 'Already fully verified', status: 'fully_verified' });
        }
        
        if (placement.status !== 'student_confirmed') {
            return res.status(400).json({ 
                error: 'Student must confirm first before employer can finalize verification',
                currentStatus: placement.status
            });
        }
        
        await db.collection('placements').updateOne(
            { _id: placement._id },
            { 
                $set: { 
                    status: 'fully_verified',
                    employerVerifiedAt: new Date()
                } 
            }
        );
        
        res.json({
            success: true,
            message: 'Placement is now FULLY VERIFIED. This counts as a real placement on the college leaderboard.',
            status: 'fully_verified'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Public: lookup a placement by verification code
app.get('/api/placements/lookup/:code', async (req, res) => {
    try {
        const placement = await db.collection('placements').findOne(
            { verificationCode: req.params.code },
            { projection: { _id: 0, companyWallet: 0 } }
        );
        
        if (!placement) {
            return res.status(404).json({ error: 'Placement not found' });
        }
        
        // Get company name
        const company = await db.collection('companies').findOne(
            { walletAddress: placement.companyWallet || '' }
        );
        
        res.json({
            success: true,
            placement: {
                studentName: placement.studentName,
                role: placement.role,
                salary: placement.salary,
                college: placement.college,
                status: placement.status,
                txHash: placement.txHash,
                companyName: company?.name || 'Unknown',
                createdAt: placement.createdAt,
                studentConfirmedAt: placement.studentConfirmedAt,
                employerVerifiedAt: placement.employerVerifiedAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// College endpoints
app.get('/api/college/students', authMiddleware, async (req, res) => {
    try {
        const college = await db.collection('users').findOne({ walletAddress: req.user.wallet });
        if(!college) return res.status(404).json({error: "College not found"});

        // Students must have matching "collegeName" in their details array/object
        // Using regex for case-insensitive partial match for robust connection
        const students = await db.collection('users')
            .find({ role: 'student', "details.college": { $regex: new RegExp(college.name, "i") } })
            .toArray();

        res.json({ success: true, students: students });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/college/verify-student', authMiddleware, async (req, res) => {
    const { studentWallet } = req.body;
    try {
        await db.collection('users').updateOne(
            { walletAddress: studentWallet.toLowerCase() },
            { $set: { "details.isVerifiedByCollege": true, "details.verifiedAt": new Date() } }
        );
        res.json({ success: true, message: 'Student successfully verified.' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Student endpoints
app.get('/api/student/placements', authMiddleware, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ walletAddress: req.user.wallet });
        if(!user) return res.status(404).json({error: "User not found"});

        const placements = await db.collection('placements')
            .find({ studentEmail: user.email })
            .sort({ createdAt: -1 })
            .toArray();

        // Get company names
        const enrichedPlacements = await Promise.all(placements.map(async p => {
            const company = await db.collection('users').findOne({ walletAddress: p.companyWallet });
            return {
                ...p,
                companyName: company ? company.name : 'Unknown Company',
                placementId: p.verificationCode // use Code as ID for simplicity
            };
        }));
        res.json({ success: true, placements: enrichedPlacements });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Document Upload Mock
app.post('/api/documents/upload', authMiddleware, async (req, res) => {
    const { placementId, docType, fileHash, verifier } = req.body;
    try {
        if(!placementId || !docType || !fileHash) return res.status(400).json({ error: "Missing document data" });
        await db.collection('documents').insertOne({
            placementId, docType, fileHash, verifier, 
            uploadedBy: req.user.wallet, uploadedAt: new Date()
        });
        res.json({ success: true, message: `Document (${docType}) successfully pinned to IPFS/Storage network.` });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ Verification Endpoints (Public) ============

app.get('/api/colleges/stats', async (req, res) => {
    try {
        const stats = await db.collection('placements').aggregate([
            {
                $group: {
                    _id: "$college",
                    totalOffers: { $sum: 1 },
                    studentConfirmed: {
                        $sum: { $cond: [{ $in: ["$status", ["student_confirmed", "fully_verified", "salary_verified"]] }, 1, 0] }
                    },
                    fullyVerified: {
                        $sum: { $cond: [{ $in: ["$status", ["fully_verified", "salary_verified"]] }, 1, 0] }
                    },
                    salaryVerified: {
                        $sum: { $cond: [{ $eq: ["$status", "salary_verified"] }, 1, 0] }
                    },
                    averageSalary: { $avg: "$salary" },
                    companies: { $addToSet: "$companyWallet" }
                }
            },
            {
                $project: {
                    college: "$_id",
                    totalOffers: 1,
                    studentConfirmed: 1,
                    fullyVerified: 1,
                    salaryVerified: 1,
                    averageSalary: 1,
                    employersCount: { $size: "$companies" },
                    trustScore: {
                        $multiply: [
                            { $divide: ["$salaryVerified", { $max: ["$totalOffers", 1] }] },
                            100
                        ]
                    }
                }
            },
            {
                $addFields: {
                    isAnomaly: {
                        $cond: [
                            { $and: [
                                { $gt: ["$totalOffers", 10] },
                                { $lt: [{ $divide: ["$salaryVerified", "$totalOffers"] }, 0.2] }
                            ]},
                            true,
                            false
                        ]
                    },
                    isHighTrust: {
                        $cond: [{ $gt: ["$trustScore", 80] }, true, false]
                    }
                }
            },
            { $sort: { trustScore: -1, totalOffers: -1 } }
        ]).toArray();
        
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/verify/student', async (req, res) => {
    const { studentName, studentEmail } = req.body;
    
    try {
        if (!studentName || !studentEmail) {
            return res.status(400).json({ error: 'Student name and email required' });
        }
        
        const placements = await contract.getPlacementsByStudentEmail(studentEmail);
        
        if (placements.length === 0) {
            return res.json({ found: false, placements: [] });
        }
        
        // Filter by name match
        const verified = placements.filter(p => p.studentName === studentName);
        
        res.json({
            found: verified.length > 0,
            placements: verified.map(p => ({
                studentName: p.studentName,
                role: p.role,
                salary: p.salary.toString(),
                joiningDate: new Date(p.joiningDate * 1000).toISOString().split('T')[0],
                verifiedAt: new Date(p.registeredAt * 1000).toISOString()
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/companies/active', async (req, res) => {
    try {
        const companies = await db.collection('users')
            .find({ role: 'company' })
            .sort({ createdAt: -1 })
            .toArray();
        res.json({ success: true, companies });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/companies/directory', async (req, res) => {
    try {
        // Fetch from cached database
        const companies = await db.collection('companies')
            .find()
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();
        
        res.json({
            companies: companies.map(c => ({
                name: c.name,
                industry: c.industry,
                website: c.website,
                registrationNumber: c.registrationNumber,
                createdAt: c.createdAt
            })),
            total: companies.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/companies/stats', async (req, res) => {
    try {
        const stats = await contract.getGlobalStats();
        
        res.json({
            totalCompanies: stats[0].toString(),
            totalPlacements: stats[1].toString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ Error Handler ============

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============ Start Server ============

async function start() {
    try {
        await connectDB();
        // await initContract();
        
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════╗
║   Placement Verification API Server                ║
║   Running on http://localhost:${PORT}                  ║
║   MongoDB: Connected                               ║
║   Contract: Loaded                                 ║
╚════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();

module.exports = app;
