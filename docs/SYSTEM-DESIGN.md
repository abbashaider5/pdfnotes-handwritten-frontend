# System Design Document - PDF Notes Handwritten Platform

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [System Components](#system-components)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Authentication & Authorization](#authentication--authorization)
7. [Payment Processing](#payment-processing)
8. [File Storage & Distribution](#file-storage--distribution)
9. [Email System](#email-system)
10. [Security Considerations](#security-considerations)
11. [Scalability & Performance](#scalability--performance)
12. [Deployment Architecture](#deployment-architecture)

---

## Overview

### Purpose
A marketplace platform for buying and selling handwritten PDF study materials, featuring multi-gateway payment processing, author management, and content organization by subjects and categories.

### Key Features
- **Content Management**: Organize PDFs by subjects and categories
- **Multi-Role System**: Admin, User, and Author roles
- **Dual Payment Gateways**: Razorpay and Stripe support
- **Guest Checkout**: Allow purchases without account creation
- **Author Verification**: Application and approval workflow
- **Payout System**: Author earnings management and payout requests
- **Analytics Dashboard**: Revenue, sales, and engagement metrics
- **Email Notifications**: Transactional emails for users and authors

### Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (PDFs and images)
- **Authentication**: Supabase Auth
- **Payment Gateways**: Razorpay, Stripe
- **Email**: Resend API
- **Deployment**: Vercel (frontend), Render (backend)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │  Mobile Web  │  │    Tablet    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    Frontend Layer (Vite)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Application                        │  │
│  │  - React Router (Client-side routing)                 │  │
│  │  - State Management (React Hooks/Context)             │  │
│  │  - UI Components (Reusable component library)        │  │
│  │  - Auth Guards (Route protection)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     API Gateway Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js Backend Server               │  │
│  │  - RESTful API endpoints                              │  │
│  │  - Payment processing logic                           │  │
│  │  - Email dispatch                                     │  │
│  │  - File download management                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼──────────┐ ┌────▼──────┐ ┌────────▼─────────┐
│  Supabase Database │ │  Razorpay │ │      Stripe      │
│  (PostgreSQL)      │ │  API      │ │      API         │
└────────────────────┘ └───────────┘ └──────────────────┘
┌───────────────────────────────────────────────────────────┐
│              Supabase Storage (File System)                │
│  - PDFs bucket (Study materials)                           │
│  - Images bucket (Cover images)                            │
└───────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│                 Email Service (Resend)                     │
│  - Transactional emails                                    │
│  - Notifications                                           │
└───────────────────────────────────────────────────────────┘
```

### Data Flow

#### User Purchase Flow
```
1. User browses PDFs → Frontend fetches from Supabase
2. User clicks "Buy" → Frontend displays payment options
3. User selects gateway → Frontend calls /api/create-order
4. Backend creates order → Payment gateway creates payment
5. User completes payment → Frontend calls verify endpoint
6. Backend verifies → Updates order status in Supabase
7. Backend triggers → Download email sent
8. User receives → Download link with signed URL
```

#### Author Payout Flow
```
1. Author requests payout → Backend checks balance
2. Backend calculates → Via PostgreSQL RPC function
3. Request created → In author_payout_requests table
4. Admin reviews → Dashboard shows pending requests
5. Admin approves → Backend updates status
6. Payment processed → Admin adds payment reference
7. Author notified → Email sent with details
```

---

## System Components

### Frontend Components

#### 1. Authentication System
- **Location**: `src/pages/auth/`
- **Components**:
  - `login.jsx` - User authentication
  - `register.jsx` - New user registration
- **Features**:
  - Email/password authentication
  - Google OAuth (via Supabase)
  - Session persistence
  - Protected routes
- **Auth Guards**:
  - `RequireAuth` - Logged-in users only
  - `RequireAdmin` - Admin role only
  - `RequireUser` - Regular user role only
  - `RedirectIfAuthenticated` - Public only

#### 2. Public Pages
- **Location**: `src/pages/home/`
- **Components**:
  - `homepage.jsx` - Main landing page
  - `pdf-detail.jsx` - Individual PDF details
  - `about-us.jsx` - Company information
  - `account.jsx` - User account page
- **Features**:
  - PDF browsing by subject/category
  - Search functionality
  - Product cards with images
  - Guest and logged-in purchase options

#### 3. Dashboard System
- **Location**: `src/pages/dashboard/`
- **Components**:
  - `overview.jsx` - Admin dashboard summary
  - `upload-pdf.jsx` - PDF content management
  - `my-pdfs.jsx` - PDF library management
  - `subjects.jsx` - Subject management
  - `categories.jsx` - Category management
  - `orders.jsx` - Order management
  - `users.jsx` - User management
  - `author-requests.jsx` - Author applications
  - `admin-payouts.jsx` - Payout management
  - `analytics.jsx` - Business analytics
  - `settings.jsx` - System settings
- **Features**:
  - CRUD operations for all entities
  - Real-time data updates
  - Filtering and sorting
  - Bulk actions

#### 4. User Dashboard
- **Location**: `src/pages/user/`
- **Components**:
  - `user-dashboard.jsx` - User home
  - `author-dashboard.jsx` - Author-specific features
  - `user-orders.jsx` - Purchase history
  - `user-profile.jsx` - Profile management
- **Features**:
  - View purchased PDFs
  - Download purchased content
  - Manage author profile
  - Request payouts
  - Track earnings

#### 5. UI Component Library
- **Location**: `src/components/ui/`
- **Components**:
  - `button.jsx` - Reusable button
  - `input.jsx` - Form input fields
  - `card.jsx` - Card layout component
  - `badge.jsx` - Status badges
  - `modal.jsx` - Dialog component
  - `skeleton.jsx` - Loading placeholder
- **Features**:
  - Consistent design system
  - Accessibility compliant
  - Tailwind CSS styling
  - Reusable across application

### Backend Components

#### 1. Payment Processing Service
- **Location**: `server/payment-backend.js`
- **Responsibilities**:
  - Order creation for both gateways
  - Payment verification (Razorpay & Stripe)
  - Signature validation
  - Payment status tracking
- **Key Functions**:
  ```javascript
  - createOrder() // Initialize payment
  - verifyRazorpayPayment() // Razorpay verification
  - verifyStripePayment() // Stripe verification
  - initializePaymentGateways() // Dynamic gateway setup
  ```

#### 2. Email Service
- **Location**: `server/utils/sendEmail.js`
- **Responsibilities**:
  - Send transactional emails
  - Handle email templates
  - Graceful degradation on failures
- **Email Types**:
  - Welcome email (new user registration)
  - PDF download email (purchase confirmation)
  - Author application email (to admin)
  - Author approval email
  - Author rejection email
- **Features**:
  - HTML email templates
  - Dynamic content injection
  - Error handling and logging

#### 3. Analytics Service
- **Location**: `server/payment-backend.js` (API endpoint)
- **Responsibilities**:
  - Calculate revenue metrics
  - Track sales by PDF/category/subject
  - Payment gateway breakdown
  - Guest vs User analysis
- **Metrics Tracked**:
  - Total revenue
  - Total sales count
  - Best-selling PDFs
  - Category performance
  - Subject performance
  - Gateway distribution

#### 4. Payout Management System
- **Location**: `server/payment-backend.js`
- **Responsibilities**:
  - Calculate author balances
  - Process payout requests
  - Admin payout management
  - Payment reference tracking
- **Workflow**:
  1. Author requests payout
  2. System verifies balance
  3. Request created in 'requested' status
  4. Admin reviews and approves
  5. Payment processed and updated
  6. Author receives notification

---

## Database Design

### Schema Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    subjects     │────>│   categories    │────>│      pdfs       │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                      │
                                                      v
                                              ┌───────────────┐
                                              │    orders     │
                                              └───────┬───────┘
                                                      │
                                                      v
                                              ┌───────────────┐
                                              │  auth.users   │
                                              └───────────────┘

┌─────────────────┐     ┌─────────────────┐
│    profiles     │────>│  author_payout  │
└─────────────────┘     │    _requests    │
                        └─────────────────┘
```

### Tables

#### 1. `pdfs`
**Purpose**: Store PDF document metadata

```sql
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  card_image TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'published')),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  category_id UUID REFERENCES categories(id),
  author_id UUID REFERENCES profiles(id),
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes**:
- `idx_pdfs_subject` ON subject_id
- `idx_pdfs_category` ON category_id
- `idx_pdfs_author` ON author_id
- `idx_pdfs_status` ON status, enabled
- `idx_pdfs_search` ON title, description (GIN for full-text search)

#### 2. `subjects`
**Purpose**: Top-level subject categories

```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `categories`
**Purpose**: Sub-categories under subjects

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, name)
);
```

#### 4. `orders`
**Purpose**: Track purchase transactions

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  pdf_id UUID NOT NULL REFERENCES pdfs(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  client_secret TEXT,
  payment_gateway VARCHAR(20),
  purchase_type VARCHAR(20) CHECK (purchase_type IN ('user', 'guest')),
  guest_email VARCHAR(255),
  payment_amount DECIMAL(10, 2),
  payment_completed_at TIMESTAMP WITH TIME ZONE,
  payment_failed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_orders_user` ON user_id
- `idx_orders_pdf` ON pdf_id
- `idx_orders_status` ON payment_status
- `idx_orders_created` ON created_at DESC

#### 5. `profiles`
**Purpose**: Extended user profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'author')),
  is_author BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### 6. `author_payout_requests`
**Purpose**: Author payout requests

```sql
CREATE TABLE author_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'processing', 'paid')),
  admin_id UUID REFERENCES profiles(id),
  admin_note TEXT,
  payment_reference TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. `payment_settings`
**Purpose**: Payment gateway configuration

```sql
CREATE TABLE payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payments_enabled BOOLEAN DEFAULT true,
  razorpay_enabled BOOLEAN DEFAULT true,
  stripe_enabled BOOLEAN DEFAULT true,
  razorpay_key_id VARCHAR(255),
  razorpay_key_secret TEXT,
  stripe_secret_key TEXT,
  stripe_publishable_key VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'INR'
);
```

### PostgreSQL Functions

#### Author Balance Calculation
```sql
CREATE OR REPLACE FUNCTION get_author_balance(p_author_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_earned DECIMAL;
  v_paid DECIMAL;
  v_balance DECIMAL;
BEGIN
  -- Calculate total earned from completed orders
  SELECT COALESCE(SUM(o.amount * 0.7), 0)  -- 70% author share
  INTO v_earned
  FROM orders o
  JOIN pdfs p ON o.pdf_id = p.id
  WHERE p.author_id = p_author_id
    AND o.payment_status = 'success';

  -- Calculate total paid in completed payouts
  SELECT COALESCE(SUM(amount), 0)
  INTO v_paid
  FROM author_payout_requests
  WHERE author_id = p_author_id
    AND status IN ('paid', 'processing', 'approved');

  -- Calculate balance
  v_balance := v_earned - v_paid;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS) Policies

#### pdfs Table
```sql
-- Enable RLS
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;

-- Public: Read published and enabled PDFs
CREATE POLICY "Public can view published PDFs"
ON pdfs FOR SELECT
USING (status = 'published' AND enabled = true);

-- Admin: Full access
CREATE POLICY "Admin can manage all PDFs"
ON pdfs FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Author: Read and update own PDFs
CREATE POLICY "Author can manage own PDFs"
ON pdfs FOR ALL
USING (author_id = auth.uid());
```

#### orders Table
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- User: View own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (user_id = auth.uid());

-- User: Create orders
CREATE POLICY "Users can create orders"
ON orders FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admin: View all orders
CREATE POLICY "Admin can view all orders"
ON orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));
```

---

## API Design

### RESTful API Endpoints

#### Public Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| GET | `/api/payment-settings` | Get public payment config | No |
| POST | `/api/create-order` | Create payment order | No |
| POST | `/api/verify-razorpay-payment` | Verify Razorpay payment | No |
| POST | `/api/verify-stripe-payment` | Verify Stripe payment | No |
| GET | `/api/download-pdf` | Download purchased PDF | No (via order_id) |

#### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/send-welcome-email` | Send welcome email | No (public) |
| GET | `/api/author/earnings` | Get author balance | Yes |
| POST | `/api/author/payout-request` | Request payout | Yes |
| GET | `/api/author/payout-requests` | Get payout history | Yes |

#### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders` | Get all orders | Admin |
| GET | `/api/analytics` | Get analytics data | Admin |
| GET | `/api/admin/payout-requests` | Get all payout requests | Admin |
| PUT | `/api/admin/payout-requests/:id` | Update payout request | Admin |
| PUT | `/api/admin/authors/:id/verify` | Toggle author verification | Admin |
| POST | `/api/send-author-application-email` | Notify admin of application | No |
| POST | `/api/send-author-approval-email` | Send approval email | Admin |
| POST | `/api/send-author-rejection-email` | Send rejection email | Admin |

#### System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/reload-gateways` | Reload payment gateway config | Admin |

### API Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Key API Workflows

#### 1. Create Order Flow

```javascript
// Request
POST /api/create-order
{
  "pdf_id": "uuid",
  "amount": 199.00,
  "purchase_type": "user", // or "guest"
  "guest_email": "guest@example.com", // if guest
  "user_id": "uuid", // if user
  "payment_gateway": "razorpay" // or "stripe"
}

// Response
{
  "order_id": "uuid",
  "amount": 199.00,
  "payment_gateway": "razorpay",
  "razorpay_order_id": "order_xxxxx",
  "stripe_payment_intent_id": null,
  "client_secret": null
}
```

#### 2. Verify Payment Flow

```javascript
// Razorpay
POST /api/verify-razorpay-payment
{
  "order_id": "uuid",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "hash_xxxxx"
}

// Stripe
POST /api/verify-stripe-payment
{
  "order_id": "uuid",
  "payment_intent_id": "pi_xxxxx"
}

// Response
{
  "success": true,
  "message": "Payment verified successfully"
}
```

#### 3. Author Payout Flow

```javascript
// Request Payout
POST /api/author/payout-request
{
  "user_id": "uuid",
  "amount": 5000.00
}

// Response
{
  "success": true,
  "payout_request": {
    "id": "uuid",
    "amount": 5000.00,
    "status": "requested"
  },
  "message": "Payout request submitted successfully"
}
```

---

## Authentication & Authorization

### Authentication Flow

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       │ 1. Request Login
       v
┌──────────────┐
│  Frontend    │
│  (React)     │
└──────┬───────┘
       │
       │ 2. Call Supabase Auth
       v
┌──────────────┐
│  Supabase    │
│  Auth        │
└──────┬───────┘
       │
       │ 3. Return Session/Token
       v
┌──────────────┐
│  Frontend    │
│  Store Token │
└──────┬───────┘
       │
       │ 4. Include in API calls
       v
┌──────────────┐
│   Backend    │
│  (Express)   │
└──────────────┘
```

### Role-Based Access Control (RBAC)

#### Roles
1. **Admin**
   - Full system access
   - Manage all users and content
   - View all orders and analytics
   - Approve/reject author requests
   - Process payouts

2. **Author**
   - Upload and manage own PDFs
   - View earnings
   - Request payouts
   - View own sales analytics

3. **User**
   - Browse and purchase PDFs
   - View purchase history
   - Download purchased content
   - Apply for author status

#### Auth Guards Implementation

```javascript
// src/lib/auth.jsx
export const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export const RequireAdmin = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export const RequireUser = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user || user.role === 'admin') return <Navigate to="/" replace />;
  return children;
};
```

### Session Management

- **Token Storage**: Browser localStorage/cookies
- **Token Type**: JWT (issued by Supabase)
- **Session Duration**: Configurable (default: 1 week)
- **Refresh Token**: Automatic refresh via Supabase client
- **Logout**: Clear session from Supabase and local storage

---

## Payment Processing

### Dual Gateway Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Payment Service                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Gateway Manager                      │  │
│  │  - Dynamic initialization                        │  │
│  │  - Gateway switching                             │  │
│  │  - Fallback handling                             │  │
│  └──────────────────────────────────────────────────┘  │
└────┬──────────────────────────────┬───────────────────────┘
     │                              │
     v                              v
┌──────────────┐           ┌──────────────┐
│   Razorpay   │           │    Stripe    │
│  Integration  │           │ Integration   │
└──────────────┘           └──────────────┘
```

### Razorpay Integration

#### Flow
1. Frontend requests order creation
2. Backend creates Razorpay order
3. Frontend opens Razorpay checkout
4. User completes payment
5. Razorpay returns payment_id and signature
6. Backend verifies signature
7. Updates order status
8. Sends download email

#### Key Features
- HMAC signature verification
- Payment status verification
- Webhook support (optional)
- Currency: INR
- Minimum amount: ₹50

### Stripe Integration

#### Flow
1. Frontend requests order creation
2. Backend creates Stripe Payment Intent
3. Frontend confirms payment using Stripe.js
4. Stripe processes payment
5. Frontend receives confirmation
6. Backend verifies with Stripe API
7. Updates order status
8. Sends download email

#### Key Features
- Payment Intent API
- 3D Secure support
- Currency: INR
- Client-side confirmation
- Automatic handling of payment methods

### Payment Settings Management

#### Dynamic Configuration
- Payment gateway credentials stored in database
- Gateway keys can be updated without code changes
- Gateway enable/disable via admin dashboard
- Reload endpoint to refresh configuration

```javascript
// Initialize payment gateways from database
async function initializePaymentGateways() {
  const settings = await fetchPaymentSettings();
  
  if (settings.razorpay_key_id && settings.razorpay_key_secret) {
    razorpay = new Razorpay({
      key_id: settings.razorpay_key_id,
      key_secret: settings.razorpay_key_secret,
    });
  }
  
  if (settings.stripe_secret_key) {
    stripe = Stripe(settings.stripe_secret_key);
  }
}
```

### Revenue Sharing Model

```
Purchase Amount: ₹100
├── Platform (30%): ₹30
└── Author (70%): ₹70

Author Earnings Calculation:
- Total Sales × 70%
- Minus Already Paid Out
- = Available Balance
```

---

## File Storage & Distribution

### Storage Architecture

```
┌─────────────────────────────────────────────────┐
│           Supabase Storage                      │
│  ┌──────────────────────────────────────────┐  │
│  │           Bucket: pdfs                   │  │
│  │  - Private access by default            │  │
│  │  - Signed URLs for downloads            │  │
│  │  - Size limits enforced                 │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │           Bucket: images                 │  │
│  │  - Public access for card images        │  │
│  │  - CDN enabled                          │  │
│  │  - Image optimization                   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### File Upload Process

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Select File
     v
┌──────────────────┐
│   Frontend       │
│   Upload Form    │
└────┬─────────────┘
     │
     │ 2. Generate presigned URL
     v
┌──────────────────┐
│   Backend        │
│   /api/upload    │
└────┬─────────────┘
     │
     │ 3. Return upload URL
     v
┌──────────────────┐
│   Frontend       │
│   Direct Upload  │
└────┬─────────────┘
     │
     │ 4. Upload to Supabase Storage
     v
┌──────────────────┐
│  Supabase        │
│  Storage         │
└────┬─────────────┘
     │
     │ 5. Return file URL
     v
┌──────────────────┐
│   Database       │
│   Store metadata │
└──────────────────┘
```

### Download Security

#### Signed URL Approach
- URLs expire after 10 minutes
- Generated on-demand
- Single-use (recommended)
- Prevents unauthorized sharing

```javascript
// Generate signed URL
const { data, error } = await supabase.storage
  .from('pdfs')
  .createSignedUrl(filePath, 600); // 10 minutes

// Redirect to download
res.redirect(302, data.signedUrl);
```

#### Access Control
1. Verify order exists
2. Check payment status = 'success'
3. Validate PDF belongs to order
4. Generate signed URL
5. Redirect user to download

### File Size Limits
- **PDF Files**: 50MB maximum
- **Images**: 10MB maximum
- **Storage Quota**: Configurable per account

---

## Email System

### Email Service Architecture

```
┌─────────────────────────────────────────────────┐
│              Email Service (Resend)             │
│  ┌──────────────────────────────────────────┐  │
│  │         Email Template Engine             │  │
│  │  - Welcome Email                         │  │
│  │  - Download Email                        │  │
│  │  - Author Application                     │  │
│  │  - Approval/Rejection                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │         Delivery Manager                 │  │
│  │  - Queue management                     │  │
│  │  - Retry logic                          │  │
│  │  - Bounce handling                      │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Email Types

#### 1. Welcome Email
- **Trigger**: New user registration
- **Content**: Welcome message, getting started tips
- **Timing**: Immediate

#### 2. PDF Download Email
- **Trigger**: Successful payment verification
- **Content**: Download link, order details, support info
- **Timing**: Immediate after payment

#### 3. Author Application Email (to Admin)
- **Trigger**: New author application
- **Content**: Applicant details, experience, subjects
- **Timing**: Immediate

#### 4. Author Approval Email
- **Trigger**: Admin approves author
- **Content**: Welcome message, dashboard access
- **Timing**: Immediate

#### 5. Author Rejection Email
- **Trigger**: Admin rejects author
- **Content**: Rejection reason, feedback
- **Timing**: Immediate

### Email Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Responsive email styles */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="logo.png" alt="Logo">
    </div>
    <div class="content">
      <!-- Dynamic content -->
    </div>
    <div class="footer">
      <!-- Contact info, unsubscribe link -->
    </div>
  </div>
</body>
</html>
```

### Error Handling
- Graceful degradation if email fails
- Payment completes even if email fails
- Retry mechanism for transient failures
- Logging for debugging

---

## Security Considerations

### Authentication Security

#### Token Management
- JWT tokens with short expiration
- Refresh tokens with longer expiration
- Secure storage (httpOnly cookies preferred)
- Token invalidation on logout

#### Password Security
- Minimum 8 characters
- Email verification required
- Reset password via email link
- Rate limiting on auth attempts

### API Security

#### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### Rate Limiting
- Implement rate limiting per IP
- Login attempt limits
- API call limits per user
- DDoS protection

#### Input Validation
- Validate all user inputs
- Sanitize data before storage
- Prevent SQL injection
- Use parameterized queries

### Payment Security

#### Razorpay Security
- HMAC signature verification
- Server-side order creation
- Amount validation
- Currency enforcement

#### Stripe Security
- Webhook signature verification
- Payment Intent validation
- Server-side confirmation
- 3D Secure enforcement

#### Best Practices
- Never store full payment details
- Use payment gateway tokens
- Log all payment events
- Implement fraud detection

### Data Protection

#### Encryption
- TLS 1.3 for all communications
- Database encryption at rest
- Backup encryption
- API key encryption

#### Privacy
- GDPR compliance
- User consent management
- Data retention policies
- Right to be forgotten

### File Security

#### Upload Security
- File type validation
- Size limits
- Virus scanning (optional)
- Private storage by default

#### Download Security
- Signed URLs with expiration
- Order verification
- Payment status check
- Access logging

### Environment Security

#### Secrets Management
- Never commit .env files
- Use environment-specific configs
- Rotate secrets regularly
- Least privilege access

#### Dependency Security
- Regular security updates
- Vulnerability scanning
- Dependabot alerts
- Lock file verification

---

## Scalability & Performance

### Frontend Optimization

#### Code Splitting
- Lazy loading routes
- Component-level splitting
- Vendor chunking
- Dynamic imports

```javascript
const PDFDetail = lazy(() => import('./pages/home/pdf-detail'));
```

#### Asset Optimization
- Image compression and lazy loading
- Bundle size analysis
- Tree shaking
- Minification

#### Caching Strategy
- Service Worker for offline access
- CDN for static assets
- Browser caching headers
- API response caching

### Backend Optimization

#### Database Optimization
- Query optimization
- Proper indexing
- Connection pooling
- Read replicas (future)

#### API Optimization
- Response compression (gzip)
- Request batching
- GraphQL alternative (future)
- API rate limiting

#### Caching Strategy
- Redis for session storage
- Database query caching
- API response caching
- Static file caching

### Horizontal Scaling

#### Load Balancing
- Nginx reverse proxy
- Multiple backend instances
- Health checks
- Auto-scaling policies

#### Database Scaling
- Connection pooling
- Query optimization
- Database sharding (future)
- Read replicas (future)

### Performance Metrics

#### Frontend
- First Contentful Paint (FCP) < 1.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1
- Lighthouse score > 90

#### Backend
- API response time < 200ms (p50)
- API response time < 500ms (p95)
- Uptime > 99.9%
- Error rate < 0.1%

### Monitoring

#### Application Monitoring
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring
- Log aggregation

#### Database Monitoring
- Query performance
- Connection pool usage
- Replication lag
- Storage usage

---

## Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────┐
│                    DNS Layer                           │
│              Cloudflare / Route 53                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌────────────────┴────────────────────────────────────────┐
│                CDN Layer (Vercel)                       │
│         - Static asset delivery                        │
│         - Edge caching                                 │
│         - Global distribution                          │
└────────┬───────────────────────┬───────────────────────┘
         │                       │
         v                       v
┌──────────────────┐     ┌──────────────────┐
│   Frontend       │     │    Backend       │
│   (Vercel)       │     │   (Render)       │
│  - React App     │     │  - Express.js    │
│  - SPA Routing   │     │  - API Server    │
│  - Auto-scaling  │     │  - Workers       │
└────────┬─────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     v
         ┌───────────────────────┐
         │     Supabase          │
         │  - Database (PG)     │
         │  - Auth Service      │
         │  - Storage           │
         │  - Realtime          │
         └───────────────────────┘
                     │
                     v
         ┌───────────────────────┐
         │       Resend          │
         │    Email Service      │
         └───────────────────────┘
```

### Frontend Deployment (Vercel)

#### Configuration
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### Deployment Process
1. Push to GitHub
2. Vercel webhook triggers
3. Build process runs
4. Assets deployed to CDN
5. SSL certificate auto-provisioned
6. Custom domain configured

### Backend Deployment (Render)

#### Configuration
- Runtime: Node.js 18+
- Build command: `npm install`
- Start command: `node server/payment-backend.js`
- Environment variables configured in dashboard
- Health check: `/api/health`
- Auto-deploy from Git

#### Deployment Process
1. Push to GitHub
2. Render webhook triggers
3. Dependencies installed
4. Application starts
5. Health checks pass
6. URL becomes available

### Database Deployment (Supabase)

#### Configuration
- Managed PostgreSQL
- Automatic backups
- Point-in-time recovery
- Row Level Security enabled
- Connection pooling
- Real-time subscriptions enabled

#### Migration Management
- Use Supabase migration files
- Version control all schema changes
- Test migrations in staging
- Rollback procedures documented

### CI/CD Pipeline

#### Frontend (GitHub Actions)
```yaml
name: Frontend CI/CD
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
```

#### Backend (Render Auto-Deploy)
- Automated on push to master
- Pre-deploy health checks
- Post-deploy smoke tests
- Rollback on failure

### Environment Variables

#### Frontend (.env.production)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=https://your-backend.onrender.com
```

#### Backend (.env.production)
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.onrender.com
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com
CURRENCY=INR
```

### Backup Strategy

#### Database Backups
- Automated daily backups (Supabase)
- Point-in-time recovery (30 days)
- Export to external storage (weekly)
- Backup verification (monthly)

#### File Backups
- Supabase Storage replicas
- Archive old files
- Backup metadata to database

### Disaster Recovery

#### Recovery Procedures
1. Identify incident scope
2. Switch to backup systems
3. Restore from last known good state
4. Verify data integrity
5. Gradual traffic restoration
6. Post-incident analysis

#### Recovery Time Objectives
- RTO (Recovery Time): 4 hours
- RPO (Recovery Point): 15 minutes

---

## Conclusion

This system design provides a comprehensive overview of the PDF Notes Handwritten Platform, covering all major components, their interactions, and best practices for security, scalability, and maintainability.

### Key Strengths
- Modular architecture for easy maintenance
- Dual payment gateway for flexibility
- Comprehensive RBAC for security
- Scalable design for future growth
- Comprehensive monitoring and logging

### Future Enhancements
- Add mobile app (React Native)
- Implement real-time notifications
- Add recommendation engine
- Multi-language support
- Advanced analytics dashboard
- API rate limiting and quotas
- GraphQL API alternative
- WebSocket support for real-time features
- Advanced fraud detection
- Multi-currency support

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Development Team
