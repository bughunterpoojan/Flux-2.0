# 🌿 Agro Sync: Smart Farm-to-Market Ecosystem

Agro Sync is a high-performance, full-stack platform designed to bridge the gap between farmers and buyers. By eliminating middlemen and leveraging AI for pricing and logistics, Agro Sync ensures fair trade, transparency, and efficiency in the agricultural supply chain.

## 🏗 Project Architecture

The ecosystem consists of three integrated components:

- **`backend/`**: Django REST Framework API powering business logic, secure authentication (JWT), and AI integrations (OpenAI, AppyFlow, Razorpay).
- **`web/`**: A premium React.js dashboard for buyers and farmers, featuring real-time analytics and voice-enabled search.
- **`mobile/`**: A cross-platform Flutter application providing on-the-field access for both farmers and buyers with offline-first considerations.

---

## 🚀 Key Features

### 🎙 Next-Gen Search & Accessibility
- **AI Voice Search**: Integrated Web Speech API allows buyers to search for produce using voice commands in both **English** and **Hindi**.
- **Full Localization**: Complete UI localization (i18n) supporting English and Hindi across Web and Mobile platforms to empower local farmers.

### 🤝 Smart Negotiation & Trade
- **Real-Time Bidding**: Secure negotiation flow allowing direct price proposals and counter-offers between parties.
- **Contextual Chat**: Persistent messaging system for discussing produce quality, delivery slots, and bulk discounts.
- **Automated Invoicing**: Instant PDF invoice generation for all successful transactions.

### 🚚 AI-Driven Logistics
- **Load-Aware Quotes**: Intelligent logistics engine that calculates fees based on distance and load type (Shared vs. Dedicated).
- **Secure Delivery (POD)**: 4-digit Proof-of-Delivery (POD) verification system to ensure goods are received before payment release.

### 📊 Farmer Analytics & Profit Planning
- **Real-Time Profit Dashboard**: Advanced analytics for farmers to track revenue, actual crop-specific profit margins, and sales trends.
- **AI Price Suggestions**: Market-aware pricing recommendations to help farmers stay competitive.

---

## 🛠 Tech Stack

- **Backend**: Python, Django, DRF, SimpleJWT, SQLite/PostgreSQL.
- **Web**: React (Vite), Tailwind CSS, Lucide Icons, Recharts, i18next.
- **Mobile**: Flutter, Google Fonts, FL Chart.
- **Payments**: Razorpay Integration.
- **Verification**: AppyFlow (GSTIN/Business Identity).

---

## 🛠 Getting Started

### Backend Setup
1. `cd backend`
2. `pip install -r requirements.txt`
3. Initialize Database: `python manage.py migrate`
4. **Seed Demo Data**: `python backend/seed_demo_data.py` (Optional: Populates the system with sample crops and users)
5. Start Server: `python manage.py runserver 0.0.0.0:8000`

### Web Frontend Setup
1. `cd web`
2. `npm install`
3. `npm run dev`

### Mobile Setup
1. `cd mobile`
2. `flutter pub get`
3. `flutter run`

---

## 📄 Documentation
For the full feature specification and project vision, refer to [features.md](file:///c:/coding/project/FLux%20Hackathon/features.md).
