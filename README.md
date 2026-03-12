# AI Radar

AI Information Scanning Service - Lightweight AI news and article scanner.

Collects AI information from trusted sources, classifies into News/Articles, extracts keywords, and generates issue summaries.

## Data Sources

| Source | Type | Method |
|--------|------|--------|
| AI Times | News | RSS Feed |
| Hacker News | News | JSON API |
| arXiv | Article | XML API |
| GitHub Trending | Article | Web Scraping |

## Tech Stack

- **Backend**: Python FastAPI + SQLite
- **Frontend**: Next.js + TailwindCSS + TypeScript
- **AI**: Anthropic Claude / OpenAI (with mock fallback)

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 10000
```

API at http://localhost:10000 | Docs at http://localhost:10000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:10000
```

Dashboard at http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats | News/Article/Total counts |
| GET | /api/keywords | Top extracted keywords |
| GET | /api/issues | Issue summaries |
| GET | /api/top-news | Top 10 news |
| GET | /api/top-articles | Top 10 articles |
| POST | /api/collect | Collect data + extract keywords + generate issues |
| POST | /api/generate | Regenerate dashboard stats |

## Usage

1. Start the backend server
2. Start the frontend dev server
3. Open http://localhost:3000
4. Click **"Collect"** to gather data from all sources
5. Click **"Generate"** to update dashboard stats

## Deploy

### Backend (Render)

- Root Directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port 10000`

### Frontend (Vercel)

- Root Directory: `frontend`
- Framework: Next.js
- Env: `NEXT_PUBLIC_API_URL` = Render backend URL

## Project Structure

```
ai-radar/
  backend/
    main.py               # FastAPI server + 7 endpoints
    database.py            # SQLite - single content table
    collector.py           # All 4 source collectors
    keyword_extractor.py   # Keyword frequency analysis
    issue_generator.py     # LLM issue summaries
    requirements.txt
  frontend/
    src/
      app/page.tsx         # Dashboard UI
      components/
        StatsHeader.tsx    # News/Articles/Total cards
        KeywordPanel.tsx   # Top keywords with bars
        IssuePanel.tsx     # Issue summaries
        TopNews.tsx        # Top 10 news (clickable)
        TopArticles.tsx    # Top 10 articles (clickable)
    package.json
```
