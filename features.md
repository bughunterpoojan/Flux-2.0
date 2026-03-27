# Farm-to-Market Marketplace: Current Features

A complete overview of the decentralized agricultural marketplace platform designed to bridge the gap between farmers and buyers.

## 🤝 Smart Negotiation System
- **Direct Price Bidding**: Buyers can propose their own prices on fresh produce instead of accepting fixed rates.
- **Farmer Control Panel**: Dedicated "Active Bids" tab for farmers to **Accept**, **Reject**, or send a **Counter Offer**.
- **Contextual Chat**: Integrated messaging system allowing parties to discuss quality, bulk volume, and delivery options directly.
- **Dynamic Checkout**: Once an offer is accepted, the buyer's cart automatically updates to the negotiated price.

## 🚚 AI-Driven Logistics Engine
- **Load-Aware Quotes**: Automatically distinguishes between **Shared Parcel** (for cost-effective small loads) and **Dedicated Vehicles** (for bulk loads).
- **Fair Pricing Caps**: Implemented a mandatory **40% subtotal cap** on shipping for small orders to ensure delivery costs never exceed product value.
- **Geolocation Power**: Real-time distance calculation between the farm and the delivery address using the Haversine formula.
- **Tiered Freight**: Optimized rates (₹6-12 per km) based on the vehicle type and cargo weight.

## 💳 Secure Checkout & Payments
- **Razorpay Integration**: Seamless checkout flow using the official Razorpay SDK.
- **Double-Order Prevention**: Advanced state management in the frontend to prevent accidental duplicate payments.
- **Dynamic Keys**: Securely loads environment-specific API keys from the backend on request.

## 🚜 Farmer Empowerment
- **GSTIN Verification**: Integrated **AppyFlow API** for instant verification of business credentials.
- **Inventory Management**: Full CRUD (Create, Read, Update, Delete) capability for crops with image support.
- **Live Sales Dashboard**:
    - Real-time tracking of monthly revenue.
    - Status lifecycle management (Pending ➔ Shipped ➔ Delivered).
    - Automated "Farm Location" population based on registered farm address.

## 🛒 Premium Buyer Experience
- **Discovery**: Location-aware product browsing showing products closest to the user first.
- **Transparency**: High-definition product images, detailed descriptions, and unit-based pricing (kg, ton, quintal).
- **Order Tracking**: Multi-stage tracking for active purchases in the "My Orders" tab.

## 🛠 Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Django REST Framework, SimpleJWT, OpenAI API (Logistics AI).
- **Database**: PostgreSQL / SQLite with complex aggregations for statistics.
- **External APIs**: AppyFlow (GST), Razorpay (Payments), OpenAI (Logistics).
