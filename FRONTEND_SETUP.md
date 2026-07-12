# TransitOps Frontend - Quick Setup Guide

## 🎯 For the Frontend Developer

Hi! Here's everything you need to connect your React frontend to the TransitOps backend.

---

## 📡 Backend API Information

### Local Development
**Base URL**: `http://localhost:8000`

### Starting the Backend
```bash
cd transitops-backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend will run at: http://localhost:8000

---

## 🔑 Test Accounts (Already Created)

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Fleet Manager** | fleetmanager@transitops.com | password123 | Full access (manage vehicles, drivers, trips, maintenance) |
| **Driver** | driver@transitops.com | password123 | View dashboard, manage own trips |
| **Safety Officer** | safety@transitops.com | password123 | Manage drivers, view license alerts |
| **Financial Analyst** | finance@transitops.com | password123 | View analytics and reports |

---

## ⚡ Quick Start - React Integration

### 1. Install Axios
```bash
npm install axios
```

### 2. Create API Client (`src/api/client.js`)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Create Auth Service (`src/services/authService.js`)

```javascript
import api from '../api/client';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { access_token, user };
  },

  async signup(email, password, full_name, role) {
    const response = await api.post('/auth/signup', {
      email,
      password,
      full_name,
      role
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};
```

### 4. Example Login Component

```javascript
import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login to TransitOps</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div>
        <h4>Quick Test Login:</h4>
        <button onClick={() => {
          setEmail('fleetmanager@transitops.com');
          setPassword('password123');
        }}>
          Use Fleet Manager Account
        </button>
      </div>
    </div>
  );
}

export default Login;
```

---

## 📋 All Available API Endpoints

### Authentication
- `POST /auth/login` - Login and get token
- `POST /auth/signup` - Create new account
- `GET /auth/me` - Get current user info

### Vehicles
- `GET /vehicles` - List all vehicles (with filters)
- `GET /vehicles/available/pool` - Get available vehicles (for dropdowns)
- `GET /vehicles/{id}` - Get single vehicle
- `POST /vehicles` - Create vehicle (fleet_manager only)
- `PUT /vehicles/{id}` - Update vehicle (fleet_manager only)
- `DELETE /vehicles/{id}` - Delete vehicle (fleet_manager only)

### Drivers
- `GET /drivers` - List all drivers
- `GET /drivers/available/pool` - Get available drivers (for dropdowns)
- `GET /drivers/expiring-licenses?days=30` - Get drivers with expiring licenses
- `GET /drivers/{id}` - Get single driver
- `POST /drivers` - Create driver
- `PUT /drivers/{id}` - Update driver
- `DELETE /drivers/{id}` - Delete driver

### Trips
- `GET /trips` - List all trips (with filters)
- `GET /trips/{id}` - Get single trip
- `POST /trips` - Create trip (Draft status)
- `POST /trips/{id}/dispatch` - Dispatch trip
- `POST /trips/{id}/complete` - Complete trip
- `POST /trips/{id}/cancel` - Cancel trip

### Maintenance
- `GET /maintenance` - List maintenance records
- `GET /maintenance/{id}` - Get single record
- `POST /maintenance` - Create maintenance
- `POST /maintenance/{id}/close` - Close maintenance

### Analytics
- `GET /analytics/dashboard` - Get dashboard KPIs
- `GET /analytics/vehicles` - Get vehicle analytics
- `GET /analytics/vehicles/{id}` - Get single vehicle analytics
- `GET /analytics/vehicles/export/csv` - Download CSV report
- `GET /analytics/vehicles/export/pdf` - Download PDF report

### Fuel & Expenses
- `GET /fuel-logs` - List fuel logs
- `POST /fuel-logs` - Create fuel log
- `GET /expenses` - List expenses
- `POST /expenses` - Create expense

### Documents
- `GET /documents/vehicle/{vehicle_id}` - List vehicle documents
- `POST /documents/upload/{vehicle_id}` - Upload document
- `GET /documents/download/{document_id}` - Download document
- `PUT /documents/{document_id}` - Update document
- `DELETE /documents/{document_id}` - Delete document

---

## 🔍 Example API Calls

### Get Dashboard Data
```javascript
import api from './api/client';

async function fetchDashboard() {
  const response = await api.get('/analytics/dashboard');
  console.log(response.data);
  // Returns: { active_vehicles: 5, available_vehicles: 3, ... }
}
```

### Get All Vehicles
```javascript
async function fetchVehicles() {
  const response = await api.get('/vehicles?status=Available&sort_by=created_at');
  console.log(response.data);
  // Returns array of vehicles
}
```

### Create a Trip
```javascript
async function createTrip(tripData) {
  const response = await api.post('/trips', {
    source: 'Mumbai',
    destination: 'Pune',
    vehicle_id: 1,
    driver_id: 1,
    cargo_weight: 1200,
    planned_distance: 150,
    revenue: 18000
  });
  console.log(response.data);
}
```

---

## 🎨 Status Values (for styling)

### Vehicle Status
- `Available` - Green badge
- `On Trip` - Blue badge
- `In Shop` - Orange badge
- `Retired` - Gray badge

### Driver Status
- `Available` - Green badge
- `On Trip` - Blue badge
- `Off Duty` - Gray badge
- `Suspended` - Red badge

### Trip Status
- `Draft` - Gray badge
- `Dispatched` - Blue badge
- `Completed` - Green badge
- `Cancelled` - Red badge

---

## 📖 Full Documentation

For complete details, code examples, TypeScript types, and advanced features, see:
**`FRONTEND_INTEGRATION_GUIDE.md`**

---

## ❓ Common Issues

### Issue: "Network Error"
**Solution**: Make sure the backend is running at http://localhost:8000

### Issue: "401 Unauthorized"
**Solution**: Check that the token is being sent in the Authorization header

### Issue: "403 Forbidden"
**Solution**: The logged-in user doesn't have permission for this action. Check the user's role.

### Issue: "CORS Error"
**Solution**: The backend already has CORS configured for `http://localhost:3000` and `http://localhost:5173` (Vite)

---

## ✅ Testing Checklist

- [ ] Login with fleet manager account works
- [ ] Dashboard shows 8 KPI cards
- [ ] Vehicle list loads and displays correctly
- [ ] Can create a new vehicle (fleet manager only)
- [ ] Available vehicles show in dropdown
- [ ] Can create a trip in Draft status
- [ ] Can dispatch a trip (changes status)
- [ ] Can complete a trip (calculates distance)
- [ ] Analytics page shows vehicle performance
- [ ] Export CSV/PDF works

---

## 🚀 You're All Set!

The backend is **production-ready** with all security fixes applied. Just connect your React app and start building!

**Questions?** Refer to `FRONTEND_INTEGRATION_GUIDE.md` for detailed examples and TypeScript types.

---

*Backend Status: ✅ Secure & Ready | API Version: 1.0.0*
