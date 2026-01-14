# PDF Marketplace - Frontend

A modern, premium SaaS-style PDF marketplace with an author dashboard and public website. Built with React, Tailwind CSS, and Supabase.

## 🎨 Features

### Author Dashboard
- **Dashboard Overview**: KPI cards, sales charts, recent orders, and uploads
- **Upload PDF**: Drag & drop file upload with cover image support
- **My PDFs**: Manage all PDFs with search, filters, and bulk actions
- **Subjects & Categories**: Full CRUD management with enable/disable toggles
- **Orders**: Track all orders with status filters
- **Users**: View buyer statistics and purchase history
- **Settings**: Configure store, profile, and payout settings

### Public Website
- **Homepage**: Professional landing with subject filtering and search
- **PDF Cards**: Beautiful card-based layout with cover images
- **PDF Detail Page**: Full details, purchase flow, and download functionality
- **User Account**: View purchased PDFs and order history
- **Responsive Design**: Mobile-first, works on all devices

### Technical Highlights
- ✅ **Skeleton Loading Everywhere** - No spinners, only professional skeleton placeholders
- ✅ **Modern SaaS Design** - Clean, minimal, professional UI like Stripe/Notion
- ✅ **Fully Responsive** - Mobile, tablet, and desktop optimized
- ✅ **Author Controlled** - All content managed through dashboard
- ✅ **No Hardcoded Data** - Everything dynamic from Supabase

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase project created (tables, auth, storage configured)

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env and add your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── badge.jsx
│   │   │   └── skeleton.jsx    # ⭐ Skeleton loaders
│   │   └── dashboard/        # Dashboard layout components
│   │       ├── sidebar.jsx
│   │       └── dashboard-layout.jsx
│   ├── pages/
│   │   ├── dashboard/         # Author dashboard pages
│   │   │   ├── overview.jsx
│   │   │   ├── upload-pdf.jsx
│   │   │   ├── my-pdfs.jsx
│   │   │   ├── subjects.jsx
│   │   │   ├── categories.jsx
│   │   │   ├── orders.jsx
│   │   │   ├── users.jsx
│   │   │   └── settings.jsx
│   │   └── home/             # Public website pages
│   │       ├── homepage.jsx
│   │       ├── pdf-detail.jsx
│   │       └── account.jsx
│   ├── lib/
│   │   └── supabase.js       # Supabase client configuration
│   ├── App.jsx                # Main app with routing
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── index.html
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## 🎯 Key Design Principles

### Skeleton Loading (CRITICAL)
Every data-driven screen shows skeleton loaders while loading:
- KPI cards
- Analytics charts
- Tables and rows
- PDF cards
- Homepage sections
- Subject/category lists
- Order history
- User lists

**❌ Never use spinners or "loading..." text**
**✅ Always use skeleton placeholders matching final layout**

### UI/UX Standards
- Clean typography with consistent spacing
- Soft shadows and subtle borders
- Smooth hover effects and micro-interactions
- No clutter or raw error messages
- Mobile-first responsive design
- Professional color palette with primary accent

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (1 column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: > 1024px (3-4 columns)

## 🔐 Authentication

The app integrates with Supabase Auth. Users can:
- Sign up/login (public users)
- Access dashboard (author/admin)
- View purchases (buyers)

## 📊 Database Schema (Used)

The frontend uses these Supabase tables:
- `pdfs` - PDF documents with metadata
- `subjects` - Subject categories
- `categories` - Sub-categories under subjects
- `orders` - Purchase orders
- `users` - User profiles
- `storage` - PDF and image uploads

**Note**: The backend folder contains the existing backend code. Database schema should NOT be changed.

## 🎨 Customization

### Colors
Edit `frontend/src/index.css` to customize the color scheme:
```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Blue */
  --background: 0 0% 100%;          /* White */
  --foreground: 222.2 84% 4.9%;      /* Dark gray */
  /* ... more colors */
}
```

### Theme
The app uses Tailwind CSS with custom CSS variables. Modify `tailwind.config.js` for extensive customization.

## 🚀 Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 TODO / Future Enhancements

- [ ] Integrate payment gateway (Stripe)
- [ ] Add real-time notifications
- [ ] Implement drag & drop reordering for subjects/categories
- [ ] Add advanced analytics charts
- [ ] Implement user reviews/ratings
- [ ] Add search history and recommendations
- [ ] Implement dark mode toggle
- [ ] Add email notifications

## 🐛 Troubleshooting

### Supabase Connection Issues
- Verify `.env` file exists with correct credentials
- Check Supabase project is active
- Ensure RLS policies allow access

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear browser cache

### Skeletons Not Showing
- Check that `loading` state is properly set before data fetch
- Verify skeleton components are imported correctly

## 📄 License

This project is part of a PDF marketplace system.

## 🤝 Support

For issues or questions, please refer to the backend documentation or contact the development team.