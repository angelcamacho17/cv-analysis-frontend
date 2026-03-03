# CV Analysis Application

A white-label React application for AI-powered CV/resume analysis. Upload candidate data via Excel and optional PDF CVs to receive automated scoring, categorization, and detailed evaluations powered by Claude AI.

## 🚀 Features

- **AI-Powered Analysis**: Uses Claude AI (Anthropic) to analyze candidate CVs and survey responses
- **Real-time Progress**: Server-Sent Events (SSE) provide live updates during analysis
- **Comprehensive Scoring**: 0-100 score with categorization (Interview, Maybe, Discard)
- **Detailed Insights**: Strengths, red flags, consistency checks, and suggested interview questions
- **Candidate Search**: Search and filter candidates across all analyses
- **Analysis History**: View and manage all previous analyses with pagination
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## 📋 Prerequisites

- Node.js (v20.19+ recommended, but v20.10+ works)
- npm or yarn
- Access to the CV Analysis API backend

## 🛠️ Installation

1. **Clone or navigate to the project**:
   ```bash
   cd cv-analysis-react
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Copy `.env.example` to `.env` and update with your settings:
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   VITE_API_URL=https://mv-whatsapp-backend.onrender.com/api
   VITE_ADMIN_TOKEN=your-admin-token-here
   ```

## 🚦 Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
```
Output will be in the `dist/` folder

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── cv-analysis/
│   │   └── CVAnalysisPage.tsx        # Upload and analyze CVs
│   ├── candidates/
│   │   ├── CandidatesDashboard.tsx   # Search and view candidates
│   │   └── AnalysisDetail.tsx        # View specific analysis
│   └── layout/
│       ├── Navbar.tsx                # Navigation bar
│       └── Layout.tsx                # Layout wrapper
├── services/
│   ├── cv-analysis.service.ts        # CV analysis API
│   └── analyses.service.ts           # Analyses management API
├── types/
│   ├── cv-analysis.ts                # CV analysis types
│   └── analyses.ts                   # Analyses types
├── context/
│   └── AuthContext.tsx               # Authentication context
├── config/
│   └── environment.ts                # Environment config
├── App.tsx                           # Router setup
└── main.tsx                          # Entry point
```

## 🎯 Usage

### 1. Upload and Analyze CVs

Navigate to the home page (`/`) to upload files:

1. **Select Excel File** (Required):
   - Google Forms export with candidate responses
   - Formats: `.xlsx`, `.xls`, `.csv`
   - Should contain: name, email, phone, and survey responses

2. **Upload PDF CVs** (Optional):
   - Multiple PDF resumes
   - Improves analysis accuracy
   - Checks consistency with survey responses

3. **Start Analysis**:
   - Click "Analizar Candidatos"
   - Watch real-time progress (0-100%)
   - View detailed progress log

4. **Review Results**:
   - Executive summary with statistics
   - Top 3 candidates
   - Filter by category (Interview/Maybe/Discard)
   - Detailed candidate cards with all analysis

### 2. View Candidates Dashboard

Navigate to `/candidates` to:

- **View Statistics**: Total analyses, candidates, interview-ready candidates, average score
- **Top Candidates**: See top 10 highest-scoring candidates globally
- **Search**: Advanced filters by name, email, category, score range
- **History**: Browse all previous analyses with pagination

### 3. Analysis Detail

Click on any analysis to see:

- Complete summary and top 3 candidates
- All candidates from that analysis
- Filter, search, and sort candidates
- Metadata (CVs processed, errors, prompt size)

## 🔧 Configuration

### API Endpoints

All endpoints use the base URL from `VITE_API_URL`:

- `POST /cv-analysis/analyze-stream` - Analyze CVs with progress (SSE)
- `POST /cv-analysis/analyze` - Analyze CVs without progress
- `GET /cv-analysis/analyses` - List all analyses (paginated)
- `GET /cv-analysis/analyses/:id` - Get analysis detail
- `GET /cv-analysis/candidates/search` - Search candidates
- `GET /cv-analysis/candidates/top` - Get top candidates
- `GET /cv-analysis/statistics` - Get global statistics

### Authentication

The app uses a simple token-based authentication:

1. Token is loaded from environment variable `VITE_ADMIN_TOKEN`
2. Stored in `localStorage` for persistence
3. Can be manually set via `useAuth().login(token)`

## 🎨 Customization

### Branding

Update branding in:
- `src/components/layout/Navbar.tsx` - Application name and logo
- `index.html` - Page title and meta tags
- `public/` - Add your favicon and assets

### Styling

Uses Tailwind CSS v4. Customize in:
- `tailwind.config.js` - Theme colors, fonts, etc.
- `src/index.css` - Global styles

### API URL

Change the backend URL in `.env`:
```env
VITE_API_URL=https://your-backend-url.com/api
```

## 🔒 Security Notes

1. **Environment Variables**: Never commit `.env` to version control
2. **API Token**: Keep `VITE_ADMIN_TOKEN` secret
3. **CORS**: Ensure backend allows requests from your domain
4. **HTTPS**: Use HTTPS in production

## 📦 Deployment

### Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

Or use Netlify CLI:
```bash
netlify deploy --prod --dir=dist
```

### Vercel

```bash
npm run build
vercel --prod
```

### Static Hosting

Build and upload the `dist/` folder to any static hosting service:
- AWS S3 + CloudFront
- Azure Static Web Apps
- Google Cloud Storage
- GitHub Pages

## 🧪 Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## 📊 Data Flow

```
User uploads files
      ↓
CVAnalysisPage component
      ↓
analyzeCVWithProgress() service
      ↓
SSE Stream from backend
      ↓
Progress events → UI updates
      ↓
Final result → Display results
      ↓
Analysis saved to database
      ↓
View in Candidates Dashboard
```

## 🔍 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Styling
- **Fetch API** - HTTP requests & SSE
- **Claude AI** - Backend AI analysis (via API)

## 🐛 Troubleshooting

### Build Warnings

If you see Node.js version warnings, they're safe to ignore if using Node v20.10+. For best results, upgrade to v20.19+.

### CORS Errors

Ensure the backend API has CORS enabled for your domain.

### SSE Connection Issues

Check that your backend supports Server-Sent Events and doesn't timeout connections.

### Environment Variables Not Loading

Make sure your `.env` file uses `VITE_` prefix for all variables.

## 📝 License

This is a white-label application extracted from the mv-admin Angular project.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Contact your backend administrator

## 🎉 Credits

Extracted and adapted from the Victoria Poggioli Admin Dashboard (Angular) CV Analysis feature.

---

**Built with ❤️ using React, TypeScript, and Claude AI**
# cv-analysis-frontend
