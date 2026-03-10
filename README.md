# AI Radar

Real-time AI Intelligence Dashboard that collects news from multiple sources, detects emerging trends, and generates actionable insights.

![Python](https://img.shields.io/badge/Python-3.13+-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Multi-Source Collection** - Aggregates AI news from 4 sources:
  - Hacker News (top AI stories)
  - GitHub Trending (AI/ML repositories)
  - arXiv (cs.AI, cs.LG, cs.CL papers)
  - AI Times (RSS feed)

- **Trend Detection** - Automatically identifies emerging AI topics with growth rate analysis across 5 domains (Models, Coding, Infrastructure, Research, Applications)

- **Expert Insights** - Discovers high-value content using keyword density scoring and engagement metrics

- **LLM-Powered Signals** - Generates concise intelligence briefings using Claude or GPT (works without API keys via mock mode)

- **Radar Visualization** - Interactive radar chart showing AI domain impact, growth, and activity levels

- **Auto-Collection** - Background scheduler runs the full pipeline every 30 minutes

- **Data Retention** - Automatic cleanup of data older than 30 days

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python, FastAPI, SQLite, APScheduler |
| Frontend | Next.js 15, React 19, TailwindCSS 4, Recharts |
| LLM | Anthropic Claude / OpenAI GPT (optional) |
| Deploy | Docker, Vercel + Render |

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 20+

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/ai-radar.git
cd ai-radar
cp .env.example .env
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and click **Collect** to start gathering data.

### Docker (Alternative)

```bash
docker compose up --build
```

## Configuration

Edit `.env` to add LLM API keys for higher quality signal generation:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Without API keys, the system uses mock signal generation based on trend analysis and source grouping.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System status & stats |
| GET | `/api/articles` | List collected articles |
| GET | `/api/signals` | List generated signals |
| GET | `/api/trends` | List detected trends |
| GET | `/api/experts` | List expert insights |
| POST | `/api/collect` | Trigger data collection |
| POST | `/api/generate` | Generate AI signals |

## Architecture

```
ai-radar/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── database.py          # SQLite (articles, signals, experts, trends)
│   ├── scheduler.py         # 30-min auto pipeline
│   ├── signal_generator.py  # LLM signal generation
│   ├── trend_detector.py    # Topic extraction & growth analysis
│   ├── expert_detector.py   # Expert insight scoring
│   └── collectors/          # 4 data source collectors
├── frontend/
│   ├── src/app/page.tsx     # Main dashboard
│   └── src/components/      # RadarMap, SignalCards, TrendList, ExpertInsights
├── docker-compose.yml
└── .env.example
```

### Pipeline Flow

```
Collect (4 sources) → Detect Trends → Detect Experts → Generate Signals → Cleanup
```

## Deployment

### Vercel (Frontend)

1. Import the `frontend/` directory on Vercel
2. Set `NEXT_PUBLIC_API_URL` to your backend URL

### Render (Backend)

1. Create a new Web Service pointing to `backend/`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env`

## License

MIT
