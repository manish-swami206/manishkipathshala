# Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud)
- Cloudinary account (free: cloudinary.com)
- Clerk account (free: clerk.com)

### 2. Clone & Install
```bash
cd Exam-platform
pnpm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Get from your PostgreSQL provider
DATABASE_URL=postgresql://user:pass@localhost:5432/exam_db?sslmode=require

# Get from cloudinary.com dashboard
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Get from clerk.com dashboard
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 4. Initialize Database
```bash
pnpm drizzle-kit push
```

### 5. Start Servers
```bash
# Terminal 1: API Server
cd src/api-server && pnpm dev

# Terminal 2: Frontend
cd src/exam-platform && pnpm dev
```

### 6. Access the App
- **Frontend:** http://localhost:8080
- **Admin Panel:** http://localhost:8080/admin
- **NCERT Books:** http://localhost:8080/ncert-books
- **PYP Papers:** http://localhost:8080/pyp

### 7. First Admin Setup
1. Navigate to http://localhost:8080/admin
2. You'll see a PIN entry screen
3. Enter any 4+ character PIN (this becomes your admin password)
4. PIN is now set and required for all file uploads

## Admin Tasks

### Upload NCERT Books
1. Go to http://localhost:8080/admin/ncert
2. Fill: Title, Subject, Class
3. Select a PDF or DOCX file
4. Click "Upload NCERT PDF"
5. Book appears in public `/ncert-books` page

### Upload Previous Year Papers
1. Go to http://localhost:8080/admin/pyp
2. Fill: Title, Subject, Year, Exam Type
3. Select a PDF or DOCX file
4. Click "Upload PYP"
5. Paper appears in public `/pyp` page

### Change Admin PIN
1. Go to http://localhost:8080/admin/settings
2. Enter current PIN
3. Enter new PIN (4+ chars)
4. Click "Update PIN"

## Architecture

```
Frontend (port 8080)  →  API Server (port 4000)  →  PostgreSQL
                              ↓
                          Cloudinary CDN
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Build all packages
pnpm build

# Start dev servers (from root)
pnpm -r run dev

# Database migration
pnpm drizzle-kit push

# View database schema
pnpm drizzle-kit studio
```

## Important Endpoints

### Public API
- `GET /api/document-ncert` - List NCERT books
- `GET /api/document-pyp` - List PYP papers

### Admin API (requires `x-admin-pin` header)
- `POST /api/document-ncert/upload` - Upload NCERT
- `DELETE /api/document-ncert/:id` - Delete NCERT
- `POST /api/document-pyp/upload` - Upload PYP
- `DELETE /api/document-pyp/:id` - Delete PYP
- `POST /api/document-admin/verify-pin` - Verify PIN
- `POST /api/document-admin/set-pin` - Change PIN

## Pages

### Public Pages
- `/` - Home
- `/ncert-books` - Browse NCERT textbooks
- `/pyp` - Browse previous year papers
- `/quizzes` - Quizzes (existing)
- `/mock-tests` - Mock exams (existing)

### Admin Pages (PIN-protected)
- `/admin` - Dashboard
- `/admin/ncert` - NCERT management
- `/admin/pyp` - PYP management
- `/admin/settings` - Change PIN

## Troubleshooting

### "Connect ECONNREFUSED" Error
- API server not running on port 4000
- Start API server: `cd src/api-server && pnpm dev`

### "Invalid admin PIN"
- PIN was never set (first time)
- Wrong PIN entered
- Navigate to `/admin/settings` to change PIN

### Cloudinary Upload Fails
- Invalid credentials in `.env`
- File exceeds 50MB
- Only PDF/DOCX supported

### Database Connection Error
- `DATABASE_URL` not set in `.env`
- PostgreSQL not running
- Connection string is invalid

## File Limits
- Max file size: 50MB
- Allowed formats: PDF, DOCX
- Storage: Cloudinary (free tier: 1GB)

## Need Help?

1. Check `.env` is properly configured
2. Verify both servers running
3. Check console for error messages
4. See full README.md for detailed docs

---

**Ready to go!** Your exam platform is now running.
