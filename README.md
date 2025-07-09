# Stock Market Simulation Platform

A full-stack, real-time stock market simulation app with a modern React frontend and Node.js/Express backend. Simulate trading, view live prices and charts, and manage a virtual portfolio with professional UI/UX.

---

## Features

- **Live Market Data:**
  - Real-time stock prices and candlestick charts (AMCharts)
  - Technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands
  - Drawing tools: trendline, ray, arrow, ellipse, rectangle, text
- **Professional Dashboard UI:**
  - Two-column layout: left for stock list/search, right for details/chart
  - Glassmorphic, dark-themed, responsive design
- **Trading Simulation (Buy/Sell):**
  - Buy/sell modal with live price, quantity selector, and instant portfolio updates
  - Simulated trades update holdings, cash, and P&L in real time
  - New users start with ₹5 crore virtual cash
  - All trades are simulated—no real money or market orders are placed
- **Robust Backend:**
  - Node.js/Express with MongoDB for user/portfolio management
  - Symbol conversion for NSE/BSE and Twelve Data API
  - Error handling and clear feedback for malformed/missing data
- **Polling:**
  - Live prices and chart data update every 5 seconds

---

## Quick Start

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (local or Atlas)
- [Twelve Data API key](https://twelvedata.com/)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd stock
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Usage

- **Login/Register:** Create an account to start trading.
- **Browse Stocks:** Use the left panel to search and select stocks.
- **View Details:** See live prices, company info, and interactive charts.
- **Trade (Buy/Sell):**
  - Click the **Buy** or **Sell** button next to any stock in the left panel.
  - A modal will appear showing the current live price and a quantity selector.
  - Enter the quantity and confirm your trade.
  - Your portfolio, cash balance, and P&L update instantly to reflect the simulated trade.
  - All trades are virtual and do not affect real markets.
- **Portfolio:** Track holdings, cash, and P&L in real time.

---

## Buy/Sell Simulation Details

- **How it works:**
  - The buy/sell modal allows you to simulate buying or selling shares at the current market price.
  - When you confirm a trade, the frontend sends a request to the backend to update your virtual portfolio.
  - The backend validates the order, updates your holdings and cash, and returns the new portfolio state.
- **Backend endpoint:**
  - `POST /api/order` — Place a simulated buy or sell order (authentication required)
  - The request should include the stock symbol, action (buy/sell), and quantity.
- **Portfolio logic:**
  - New users start with ₹5 crore virtual cash.
  - All trades update holdings, cash, and P&L in real time.
  - You cannot buy more than your available cash or sell more than you hold.
- **Note:**
  - This is a simulation only. No real money or actual stock market orders are placed.

---

## API Endpoints (Backend)

- `GET /api/market/stocks` — List of available stocks
- `GET /api/market/quote?symbols=...` — Live prices for one or more symbols
- `GET /api/market/candles/:symbol` — Candle data for charting
- `GET /api/market/stock/:symbol` — Details for a single stock
- `POST /api/order` — Place a simulated order (auth required)
- ...and more (see `backend/src/routes/`)

---

## Symbol Format
- Supported: `NSE_EQ|TCS`, `NSE:TCS`, `BSE:TCS`
- Backend converts to Twelve Data format: `TCS.NSE`, `TCS.BSE`

---

## Troubleshooting

- **No live prices or charts?**
  - Check your `.env` for a valid `TWELVE_DATA_API_KEY`.
  - Restart the backend after editing `.env`.
  - Check browser network tab for `/api/market/quote` errors.
- **CORS errors?**
  - Make sure your frontend port is allowed in backend CORS config.
- **MongoDB errors?**
  - Ensure MongoDB is running and URI is correct in `.env`.
- **API rate limits?**
  - Free Twelve Data keys have limits. Upgrade or use fewer symbols if needed.

---

## Customization
- Edit `backend/src/data/nse_stocks.json` to change the available stocks.
- Tweak frontend styles in `frontend/src/pages/Market.jsx` and `App.css`.
- Add more technical indicators or chart features in `frontend/src/components/AmChartCandle.jsx`.

---

## License
MIT 
