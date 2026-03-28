# 🌿 AgriMarket: Decentralized Farm-to-Market Platform

A high-performance codebase for a decentralized agricultural marketplace bridging the gap between farmers and buyers. Built with a focus on fair negotiation, AI-driven logistics, and secure verification.

## 🏗 Project Structure

The project is divided into three main components:

- **`backend/`**: Django REST Framework API handles business logic, authentication, and integration with external APIs (OpenAI, AppyFlow, Razorpay).
- **`web/`**: Modern React.js dashboard for buyers and farmers using Tailwind CSS and Lucide icons.
- **`mobile/`**: Flutter-based mobile application for on-the-field access (WIP).

---

## 🚀 Key Features

### 🤝 Smart Negotiation System
- **Direct Price Bidding**: Buyers can propose their own prices instead of accepting fixed rates.
- **Farmer Control Panel**: Dedicated bids management (Accept, Reject, or Counter Offer).
- **Contextual Chat**: Integrated messaging to discuss quality and logistics directly.
- **Dynamic Checkout**: Carts update automatically to negotiated prices upon acceptance.

### 🚚 AI-Driven Logistics Engine
- **Load-Aware Quotes**: Automatically distinguishes between **Shared Parcel** and **Dedicated Vehicles**.
- **Fair Pricing Caps**: 40% subtotal cap on shipping protect buyers from extreme fees.
- **Geolocation Power**: Real-time distance calculation between farms and delivery points.

### 💳 Secure Checkout & Payments
- **Razorpay Integration**: Seamless and secure payment flow.
- **Verification System**: Integrated **AppyFlow API** for instant GSTIN / Owner verification.

### 🚜 Farmer Empowerment
- **Live Sales Dashboard**: Real-time tracking of monthly revenue and active listings.
- **Inventory Management**: Full CRUD capability for crops with AI-assisted price suggestions.

---

## 🛠 Tech Stack

- **Backend**: Python 3.x, Django, Django REST Framework, SimpleJWT.
- **Frontend**: React, Tailwind CSS, Lucide React, Recharts.
- **Mobile**: Flutter (Dart).
- **Database**: PostgreSQL / SQLite.
- **External Services**:
  - **OpenAI API**: Market validation and price analysis.
  - **AppyFlow API**: GST/Business identity verification.
  - **Razorpay**: Payment gateway.

---

## 🛠 Getting Started

### Backend Setup
1. `cd backend`
2. `pip install -r requirements.txt`
3. Create a `.env` file from the placeholder.
4. `python manage.py migrate`
5. `python manage.py runserver 0.0.0.0:8000`

### Web Frontend Setup
1. `cd web`
2. `npm install`
3. `npm run dev`

---

## 📄 Documentation
For a detailed feature list, see [features.md](file:///c:/coding/project/FLux%20Hackathon/features.md).
