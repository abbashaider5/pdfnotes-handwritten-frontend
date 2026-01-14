# Database Schema Documentation

This document describes the database schema assumed and used by the frontend implementation.

---

## Table: `pdfs`

**Purpose**: Stores all PDF documents with their metadata and upload information

| Column Name | Data Type | Nullable | Purpose |
|-------------|-----------|----------|---------|
| id | UUID | No | Primary key, unique identifier |
| title | VARCHAR/TEXT | No | Display name of the PDF |
| description | TEXT | Yes | Detailed description of the PDF content |
| pdf_url | VARCHAR/TEXT | No | Storage URL for the actual PDF file |
| card_image | VARCHAR/TEXT | Yes | Cover image URL displayed on cards |
| price | DECIMAL/NUMERIC | Yes | Purchase price (0 for free) |
| status | VARCHAR/ENUM | No | 'draft' or 'published' |
| subject_id | UUID (FK) | No | Foreign key to subjects table |
| category_id | UUID (FK) | Yes | Foreign key to categories table |
| views | INTEGER | Yes | Number of times PDF was viewed |
| purchases | INTEGER | Yes | Number of purchases made |
| enabled | BOOLEAN | No | Whether PDF is visible to users |
| order_index | INTEGER | Yes | Display order for sorting |
| created_at | TIMESTAMP | No | Record creation timestamp |
| updated_at | TIMESTAMP | Yes | Last update timestamp |

**REQUIRED fields for UI**: id, title, pdf_url, status, subject_id, enabled
**OPTIONAL enhancements**: description, card_image, price, views, purchases, order_index

---

## Table: `subjects`

**Purpose**: Top-level subject categories for organizing PDFs

| Column Name | Data Type | Nullable | Purpose |
|-------------|-----------|----------|---------|
| id | UUID | No | Primary key, unique identifier |
| name | VARCHAR/TEXT | No | Subject name (e.g., "Mathematics") |
| description | TEXT | Yes | Detailed description of the subject |
| enabled | BOOLEAN | No | Whether subject is visible on frontend |
| order_index | INTEGER | Yes | Display order for sorting subjects |
| created_at | TIMESTAMP | No | Record creation timestamp |

**REQUIRED fields for UI**: id, name, enabled
**OPTIONAL enhancements**: description, order_index

---

## Table: `categories`

**Purpose**: Sub-categories grouped under subjects

| Column Name | Data Type | Nullable | Purpose |
|-------------|-----------|----------|---------|
| id | UUID | No | Primary key, unique identifier |
| name | VARCHAR/TEXT | No | Category name (e.g., "Calculus") |
| description | TEXT | Yes | Detailed description of the category |
| subject_id | UUID (FK) | No | Foreign key to subjects table |
| enabled | BOOLEAN | No | Whether category is visible on frontend |
| order_index | INTEGER | Yes | Display order for sorting categories |
| created_at | TIMESTAMP | No | Record creation timestamp |

**REQUIRED fields for UI**: id, name, subject_id, enabled
**OPTIONAL enhancements**: description, order_index

---

## Table: `orders`

**Purpose**: Records all purchase transactions

| Column Name | Data Type | Nullable | Purpose |
|-------------|-----------|----------|---------|
| id | UUID | No | Primary key, unique identifier |
| user_id | UUID (FK) | No | Foreign key to users table (who purchased) |
| pdf_id | UUID (FK) | No | Foreign key to pdfs table (what was purchased) |
| amount | DECIMAL/NUMERIC | No | Payment amount |
| payment_status | VARCHAR/ENUM | Yes | 'completed', 'pending', or 'failed' |
| payment_id | VARCHAR/TEXT | Yes | Payment gateway transaction ID |
| created_at | TIMESTAMP | No | Record creation timestamp |

**REQUIRED fields for UI**: id, user_id, pdf_id, amount, payment_status
**OPTIONAL enhancements**: payment_id

---

## Table: `users`

**Purpose**: User profiles and authentication (typically auth.users in Supabase)

| Column Name | Data Type | Nullable | Purpose |
|-------------|-----------|----------|---------|
| id | UUID | No | Primary key, matches auth.users.id |
| email | VARCHAR/TEXT | No | User email address |
| created_at | TIMESTAMP | No | Account creation timestamp |

**REQUIRED fields for UI**: id, email
**OPTIONAL enhancements**: Additional profile fields (name, avatar, etc.)

---

## Storage Buckets

### Bucket: `pdfs`
**Purpose**: Stores uploaded PDF files
**Access**: Public or authenticated depending on requirements

### Bucket: `images`
**Purpose**: Stores cover/card images for PDFs
**Access**: Public (images need to be displayed on homepage and cards)

---

## Foreign Key Relationships

- `pdfs.subject_id` → `subjects.id`
- `pdfs.category_id` → `categories.id`
- `orders.user_id` → `users.id`
- `orders.pdf_id` → `pdfs.id`

---

## Critical Requirements for UI Functionality

### MUST HAVE (Core Functionality)
1. **pdfs table** with: id, title, pdf_url, status, subject_id, enabled
2. **subjects table** with: id, name, enabled
3. **categories table** with: id, name, subject_id, enabled
4. **orders table** with: id, user_id, pdf_id, amount, payment_status
5. **users table** (auth.users) with: id, email
6. **Storage buckets** for PDFs and images

### SHOULD HAVE (Enhanced Experience)
1. **pdfs.card_image** - Critical for professional card appearance
2. **pdfs.price** - Required for marketplace functionality
3. **pdfs.description** - Important for detail page
4. **subjects.description**, **categories.description** - Helpful for context
5. **order_index** fields - For custom ordering

### NICE TO HAVE (Advanced Features)
1. **pdfs.views**, **pdfs.purchases** - For analytics
2. **orders.payment_id** - For payment integration
3. Additional user profile fields - For personalization

---

## Notes

- All timestamps should be in UTC
- UUIDs should be generated by database or application
- Enabled flags control visibility on public-facing pages
- Status field in pdfs allows for draft/published workflow
- Storage bucket permissions must allow uploads and public reads where appropriate
- Row Level Security (RLS) policies should be configured for proper access control