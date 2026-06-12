# QR Ordering System 🍔📱

A modern, responsive, and seamless QR-code-based food ordering system designed for restaurants, cafes, and bars. Built with **React**, **Vite**, and **Supabase**, this platform allows customers to scan a QR code at their table, browse a beautiful digital menu, and place orders directly from their phones.

## ✨ Features

### 👨‍🍳 Admin Dashboard
- **Menu Management**: Easily add, edit, or delete menu items. Assign image URLs, prices, categories, and descriptions.
- **Real-Time Orders**: Monitor incoming orders in real-time as customers place them from their tables.
- **Order Processing**: Track orders by table number, calculate totals instantly, mark bills as "Paid," or delete canceled orders.
- **Session Control**: Secure admin access with the ability to clear inactive table sessions.
- **Staff Mode**: A dedicated `/staff` route that automatically logs in a read-only staff user (`staff@restaurant.com`) so floor staff can monitor live orders, view the menu, and manage QR table links — without the ability to add, edit, or delete data.

### 🍽️ Customer Interface
- **Frictionless Ordering**: No app download required. Customers simply scan a table-specific QR code to begin.
- **Beautiful Digital Menu**: A highly responsive, mobile-first menu grid. Easily filter items by category chips.
- **Interactive Cart**: Select item quantities, view a floating cart with total bills in real-time, and place orders instantly.
- **Call Waiter**: A prominent 🔔 "Call Waiter" button in the table header lets customers instantly alert floor staff. Staff receive a real-time animated notification banner with a "Done" dismiss button. A 30-second cooldown prevents duplicate alerts.
- **Modern UI**: Smooth animations, glassmorphism elements, and a dynamic interface tailored specifically for mobile usability.

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Styling**: Vanilla CSS (Custom properties, responsive flexbox/grid, modern UI aesthetics)
- **Backend & Database**: Supabase (PostgreSQL) for real-time data syncing and table management.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sauch0/QR-Ordering-System.git
   cd "QR - Ordering - System"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Set up the database:**
   Open the Supabase SQL Editor and run the full contents of `supabase/schema.sql`. This creates all tables (including `waiter_calls`), RLS policies, triggers, and seed data.

5. **Create admin & staff users** in your Supabase project under **Authentication → Users**:

   | Role  | Email | Password | Route |
   |-------|-------|----------|-------|
   | Admin | *(your email)* | *(your password)* | `/admin` |
   | Staff | `staff@restaurant.com` | `staffpassword` | `/staff` |

   > The `/staff` route auto-logs in using these credentials, so floor staff just open the link.

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. **Open in browser:**
   Navigate to `http://localhost:5173` to view the application locally.

## 📱 Mobile Responsiveness
The UI has been highly optimized for mobile devices. The menu dynamically scales from multi-column desktop views down to a crisp, two-column layout on smaller screens. Action buttons and quantity selectors automatically adjust their flexbox wrapping to prevent any text cropping or overlap on extremely narrow devices.

## 👷 Staff Mode
Floor staff can access a read-only view of the system by visiting `/staff`. The page automatically logs in using the `staff@restaurant.com` credentials — no manual login required. Staff can:
- 📋 Monitor live orders in real-time
- 🔔 Receive instant **Call Waiter** notifications from customer tables (animated alert bar with a dismiss button)
- 🍽️ Browse the current menu
- 🪑 View QR table links and copy them

Staff **cannot** add, edit, or delete any menu items, categories, or tables.

## 🔔 Call Waiter Feature
Customers see a **🔔 Call Waiter** button at the top of their table page. When tapped:
1. A `waiter_calls` record is inserted into Supabase.
2. The Staff dashboard receives a **real-time push notification** (orange animated banner) showing which table needs attention.
3. Staff tap **✓ Done** to dismiss the alert.
4. A **30-second cooldown** prevents accidental duplicate calls from the same table.
