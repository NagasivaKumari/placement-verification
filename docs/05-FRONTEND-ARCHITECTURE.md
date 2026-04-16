# Frontend Architecture & UI Specifications

## Tech Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Web3 Integration**: wagmi or ethers.js
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand or Redux Toolkit
- **API Client**: Axios
- **Form Handling**: React Hook Form + Zod validation
- **Deployment**: Vercel or Netlify

---

## Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── WalletConnect.jsx
│   │   │   ├── CompanyRegister.jsx
│   │   │   └── SignatureVerify.jsx
│   │   ├── Company/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProfileEditor.jsx
│   │   │   ├── PostPlacement.jsx
│   │   │   └── PlacementList.jsx
│   │   ├── Verification/
│   │   │   ├── StudentVerify.jsx
│   │   │   ├── VerificationResult.jsx
│   │   │   └── ShareCertificate.jsx
│   │   ├── Directory/
│   │   │   ├── CompanyDirectory.jsx
│   │   │   ├── CompanyCard.jsx
│   │   │   └── SearchBar.jsx
│   │   └── Common/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── ErrorBoundary.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── CompanyDashboard.jsx
│   │   ├── VerifyPlacement.jsx
│   │   ├── CompanyDirectory.jsx
│   │   └── NotFound.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── web3.js
│   │   └── localStorage.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCompany.js
│   │   └── usePlacements.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── config/
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── vite.config.js
├── package.json
└── tailwind.config.js
```

---

## Page Flows & Components

### 1. Home Page (Landing)
**Path**: `/`
**Components**:
- Hero section with project overview
- Problem statement
- CTA buttons: "For Companies" | "Verify Placement" | "Browse Directory"
- Features section
- FAQ section

```jsx
// components/Home/Hero.jsx
export const Hero = () => (
  <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-5xl font-bold mb-4">Verified Placements, Zero Deception</h1>
      <p className="text-xl mb-8">On-chain verification of college placements</p>
      <button>Connect Company Wallet</button>
      <button>Verify Your Placement</button>
    </div>
  </div>
);
```

---

### 2. Company Registration & Login Flow
**Path**: `/company/login` → `/company/register` → `/company/dashboard`

#### Step 1: Wallet Connection
```jsx
// components/Auth/WalletConnect.jsx
import { useAccount, useConnect } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

export const WalletConnect = () => {
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });
  const { address, isConnected } = useAccount();
  
  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
      {!isConnected ? (
        <button onClick={() => connect()} className="bg-blue-600 text-white px-6 py-2 rounded">
          Connect MetaMask
        </button>
      ) : (
        <p className="text-green-600">Connected: {address}</p>
      )}
    </div>
  );
};
```

#### Step 2: Sign Message for Verification
```jsx
// components/Auth/SignatureVerify.jsx
const SignatureVerify = ({ walletAddress }) => {
  const { signMessageAsync } = useSignMessage();
  const [nonce, setNonce] = useState('');
  
  const handleSignIn = async () => {
    // 1. Get nonce from backend
    const res = await fetch(`/api/auth/nonce?wallet=${walletAddress}`);
    const { nonce } = await res.json();
    setNonce(nonce);
    
    // 2. Sign message
    const signature = await signMessageAsync({ message: nonce });
    
    // 3. Verify signature on backend
    const authRes = await fetch('/api/auth/verify-signature', {
      method: 'POST',
      body: JSON.stringify({ wallet: walletAddress, message: nonce, signature })
    });
    const { token } = await authRes.json();
    
    // 4. Store JWT
    localStorage.setItem('authToken', token);
    // Redirect to register or dashboard
  };
  
  return <button onClick={handleSignIn}>Sign Message to Login</button>;
};
```

#### Step 3: Company Registration Form
```jsx
// components/Auth/CompanyRegister.jsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(3, 'Company name required'),
  registrationNumber: z.string().min(5, 'Registration number required'),
  industry: z.string().min(3, 'Industry required'),
  website: z.string().url('Valid URL required').optional()
});

export const CompanyRegister = ({ walletAddress, token }) => {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(registerSchema)
  });
  
  const onSubmit = async (data) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      // Redirect to dashboard
      window.location.href = '/company/dashboard';
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register('name')} placeholder="Company Name" className="w-full border p-2" />
      <input {...register('registrationNumber')} placeholder="Reg. Number" className="w-full border p-2" />
      <input {...register('industry')} placeholder="Industry" className="w-full border p-2" />
      <input {...register('website')} placeholder="Website (optional)" className="w-full border p-2" />
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Register</button>
    </form>
  );
};
```

---

### 3. Company Dashboard
**Path**: `/company/dashboard`
**Components**:
- Profile summary
- Placement posting form
- Placements list (recent)
- Analytics/stats

```jsx
// pages/CompanyDashboard.jsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const CompanyDashboard = () => {
  const token = localStorage.getItem('authToken');
  
  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await axios.get('/api/company/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.data;
    }
  });
  
  const { data: stats } = useQuery({
    queryKey: ['company-stats'],
    queryFn: async () => {
      const res = await axios.get('/api/company/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.data;
    }
  });
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{company.name}</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Placements" value={stats.totalPlacements} />
        <StatCard label="Avg. Salary" value={`$${stats.avgSalary}`} />
        <StatCard label="Placement Rate" value={stats.placementRate} />
      </div>
      
      {/* Post Placement Form */}
      <PostPlacementForm token={token} />
      
      {/* Recent Placements */}
      <PlacementsList token={token} />
    </div>
  );
};
```

---

### 4. Post Placement Form
**Path**: `/company/dashboard` (embedded component)

```jsx
// components/Company/PostPlacement.jsx
import { useForm } from 'react-hook-form';
import { useState } from 'react';

export const PostPlacementForm = ({ token }) => {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await fetch('/api/placements/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        setSuccess(true);
        // Clear form, show success message
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error posting placement:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-2xl font-bold mb-4">Post New Placement</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <input {...register('studentName')} placeholder="Student Name" required />
        <input {...register('studentEmail')} placeholder="Student Email" required type="email" />
        <input {...register('role')} placeholder="Job Role" required />
        <input {...register('salary')} placeholder="Salary (USD)" required type="number" />
        <input {...register('joiningDate')} type="date" required />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Posting...' : 'Post Placement'}
      </button>
      
      {success && <p className="text-green-600 mt-2">✓ Placement posted on-chain!</p>}
    </form>
  );
};
```

---

### 5. Placement Verification Page
**Path**: `/verify`
**Public page** (no login required)

```jsx
// pages/VerifyPlacement.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export const VerifyPlacement = () => {
  const { register, handleSubmit } = useForm();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await fetch('/api/verify/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      setResult(result);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Verify Your Placement</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow mb-6">
        <input 
          {...register('studentName')} 
          placeholder="Full Name" 
          className="w-full border p-2 mb-4"
          required 
        />
        <input 
          {...register('studentEmail')} 
          placeholder="Email Address" 
          type="email"
          className="w-full border p-2 mb-4"
          required 
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Placement'}
        </button>
      </form>
      
      {result && (
        <VerificationResult result={result} />
      )}
    </div>
  );
};

// components/Verification/VerificationResult.jsx
export const VerificationResult = ({ result }) => {
  if (!result.found) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
        <p className="text-red-600 font-bold">No placements found</p>
        <p className="text-red-500 text-sm">This student is not registered with any company</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <p className="text-green-600 font-bold">✓ Verified Placements Found</p>
      </div>
      
      {result.placements.map((placement, idx) => (
        <div key={idx} className="bg-white border p-4 rounded-lg">
          <h3 className="font-bold text-lg">{placement.companyName}</h3>
          <p className="text-gray-600">{placement.role}</p>
          <p className="text-sm text-gray-500 mt-2">
            Salary: ${placement.salary} | Joining: {placement.joiningDate}
          </p>
          <button className="mt-4 text-blue-600">Download Certificate</button>
        </div>
      ))}
    </div>
  );
};
```

---

### 6. Company Directory
**Path**: `/directory`
**Public page**

```jsx
// pages/CompanyDirectory.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const CompanyDirectory = () => {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  
  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', { search, industry }],
    queryFn: async () => {
      const res = await axios.get('/api/companies/directory', {
        params: { q: search, industry }
      });
      return res.data.companies;
    }
  });
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Registered Companies</h1>
      
      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="flex-1 border p-2 rounded"
        />
        <select 
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Industries</option>
          <option value="IT">IT Services</option>
          <option value="Finance">Finance</option>
        </select>
      </div>
      
      {/* Company Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <LoadingSpinner /> : (
          companies?.map(company => (
            <CompanyCard key={company.companyId} company={company} />
          ))
        )}
      </div>
    </div>
  );
};

// components/Directory/CompanyCard.jsx
export const CompanyCard = ({ company }) => (
  <div className="bg-white border rounded-lg p-4 hover:shadow-lg transition">
    <h3 className="font-bold text-lg">{company.name}</h3>
    <p className="text-sm text-gray-600">{company.industry}</p>
    
    <div className="grid grid-cols-2 gap-2 my-4 text-sm">
      <div>
        <p className="text-gray-600">Placements</p>
        <p className="font-bold">{company.totalPlacements}</p>
      </div>
      <div>
        <p className="text-gray-600">Avg Salary</p>
        <p className="font-bold">${company.avgSalary}</p>
      </div>
    </div>
    
    <a href={company.website} target="_blank" className="text-blue-600 text-sm">
      {company.website}
    </a>
    
    <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded text-sm">
      View Details
    </button>
  </div>
);
```

---

## Custom Hooks

### useAuth.js
```javascript
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### useCompany.js
```javascript
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from './useAuth';

export const useCompany = () => {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ['company', token],
    queryFn: () => api.get('/api/company/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  });
};
```

---

## Environment Variables (.env)
```
VITE_API_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=71
```

---

## Key UI/UX Patterns

1. **Empty States**: Show helpful messages when no data
2. **Loading States**: Skeleton loaders, spinners
3. **Error Handling**: Toast notifications for errors
4. **Success Feedback**: Toast or confirmation dialogs
5. **Responsive Design**: Mobile-first with Tailwind breakpoints
6. **Accessibility**: ARIA labels, semantic HTML

---

## Next Steps
1. Set up React project with Vite
2. Install UI library (shadcn/ui)
3. Set up routing (React Router)
4. Implement auth context and hooks
5. Create components and pages
6. Connect to backend API
7. Test all flows
