import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// Dashboard Pages
import { AdminPayouts } from './pages/dashboard/admin-payouts';
import { Analytics } from './pages/dashboard/analytics';
import { AuthorPayouts } from './pages/dashboard/author-payouts';
import { AuthorRequestsPage } from './pages/dashboard/author-requests';
import { Categories } from './pages/dashboard/categories';
import { MyPDFs } from './pages/dashboard/my-pdfs';
import { Orders } from './pages/dashboard/orders';
import { DashboardOverview } from './pages/dashboard/overview';
import { Settings } from './pages/dashboard/settings';
import { Subjects } from './pages/dashboard/subjects';
import { UploadPDF } from './pages/dashboard/upload-pdf';
import { Users } from './pages/dashboard/users';

// Public Pages
import { AboutUs } from './pages/home/about-us';
import { Account } from './pages/home/account';
import { Homepage } from './pages/home/homepage';
import { PDFDetail } from './pages/home/pdf-detail';

// Auth Pages
import { LoginPage } from './pages/auth/login';
import { RegisterPage } from './pages/auth/register';

// Auth Guards
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth, RequireUser } from './lib/auth';

// User Pages
import { AuthorDashboard } from './pages/user/author-dashboard';
import { UserDashboard } from './pages/user/user-dashboard';
import { UserOrders } from './pages/user/user-orders';
import { UserProfile } from './pages/user/user-profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/pdf/:id" element={<PDFDetail />} />
        <Route path="/browse" element={<Homepage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
        <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
        <Route path="/signup" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
        
        {/* User Routes */}
        <Route path="/user/dashboard" element={<RequireUser><UserDashboard /></RequireUser>} />
        <Route path="/user/author" element={<RequireUser><AuthorDashboard /></RequireUser>} />
        <Route path="/user/orders" element={<RequireUser><UserOrders /></RequireUser>} />
        <Route path="/user/profile" element={<RequireUser><UserProfile /></RequireUser>} />
        
        {/* Author Payout Route */}
        <Route path="/dashboard/payouts" element={<RequireAuth><AuthorPayouts /></RequireAuth>} />
        
        {/* Dashboard Routes (Admin Only) */}
        <Route path="/dashboard" element={<RequireAdmin><DashboardOverview /></RequireAdmin>} />
        <Route path="/dashboard/upload" element={<RequireAdmin><UploadPDF /></RequireAdmin>} />
        <Route path="/dashboard/pdfs" element={<RequireAdmin><MyPDFs /></RequireAdmin>} />
        <Route path="/dashboard/subjects" element={<RequireAdmin><Subjects /></RequireAdmin>} />
        <Route path="/dashboard/categories" element={<RequireAdmin><Categories /></RequireAdmin>} />
        <Route path="/dashboard/orders" element={<RequireAdmin><Orders /></RequireAdmin>} />
        <Route path="/dashboard/users" element={<RequireAdmin><Users /></RequireAdmin>} />
        <Route path="/dashboard/author-requests" element={<RequireAdmin><AuthorRequestsPage /></RequireAdmin>} />
        <Route path="/dashboard/admin-payouts" element={<RequireAdmin><AdminPayouts /></RequireAdmin>} />
        <Route path="/dashboard/analytics" element={<RequireAdmin><Analytics /></RequireAdmin>} />
        <Route path="/dashboard/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
