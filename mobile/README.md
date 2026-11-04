# Royal Delivery Management System - Mobile Application

A cross-platform mobile application for **Royal Delivery Management System** built with **Expo SDK 51**, **Expo Router**, and **React Native**.

---

## 🎨 Theme & Language

- **Primary Color:** `#F5A623` (Warm parcel yellow / box color theme)
- **Primary Language:** မြန်မာဘာသာ (Burmese / Myanmar Unicode)
- **Platform Compatibility:** Android & iOS (Tested & bundled with Hermes)

---

## 🚀 Key Features

### 1. အကောင့်ဝင်ရောက်ခြင်း (Authentication & Authorization)
- Multi-role support: **Admin (အက်ဒ်မင်)**, **Manager (မန်နေဂျာ)**, **Delivery Staff (ပို့ဆောင်ရေးဝန်ထမ်း)**, **Accountant (စာရင်းကိုင်)**
- Secure token storage via `expo-secure-store`
- Auto login and session expiration handling

### 2. ပင်မစာမျက်နှာ (Dashboard)
- **Admin/Manager View:**
  - Real-time parcel statistics (Received, In Transit, Delivered, Failed, COD totals)
  - Delivery success rate and trend analysis
  - Quick action buttons to create parcels or assign deliveries
- **Delivery Staff View:**
  - Active assignments count
  - Today's completed and failed attempts
  - Direct quick link to assignments

### 3. ပါဆယ်များ စီမံခန့်ခွဲမှု (Parcels Management)
- **Parcels List (`/parcels`):**
  - Search by tracking number, recipient name, or phone number
  - Filter pills by status (Received, Verified, In Transit, Delivered, Failed, Damaged)
  - Pull-to-refresh & pagination
- **Parcel Detail (`/parcels/[id]`):**
  - Tracking status timeline history
  - Customer contact actions (One-tap phone calling)
  - Status transition modal (Received -> In Transit -> Delivered/Failed)
  - Staff assignment modal for dispatchers
- **Create Parcel (`/parcels/create`):**
  - Sender and recipient details with phone validation
  - Priority selector (Normal, High, Urgent)
  - Township/area picker
  - Cash On Delivery (COD) amount toggle & delivery fee calculation
- **Edit Parcel (`/parcels/edit/[id]`):**
  - Pre-populated form to update parcel data

### 4. ပို့ဆောင်မှုနှင့် လုပ်ငန်းတာဝန်များ (Deliveries & Assignments)
- **All Deliveries (`/deliveries`):** For Admin & Manager to monitor assignments and workload
- **My Assignments (`/my-assignments`):** Dedicated tab for Delivery Staff
  - Direct "Record Attempt" button
  - Call customer shortcut
  - Address navigation
- **Delivery Detail (`/deliveries/[id]`):**
  - Complete assignment overview
  - Attempt history
- **Record Attempt (`/deliveries/attempt/[id]`):**
  - Result selection: **Delivered (အောင်မြင်စွာ ပို့ဆောင်ပြီး)** or **Failed (မအောင်မြင်ပါ)**
  - Failure reasons dropdown: Recipient Unavailable, Phone Unreachable, Wrong Address, Customer Refused, Rescheduled, Other
  - Recipient name input & notes

### 5. ဝန်ထမ်း/အသုံးပြုသူ စီမံခန့်ခွဲမှု (Users Management)
- **Users List (`/users`):** Search, role filter, active/inactive toggle
- **User Detail & Edit (`/users/[id]`):** Profile overview, edit name/email/phone/role/password, activate/deactivate account
- **Create User (`/users/create`):** Add new system users with role assignment

### 6. ကိုယ်ရေးအချက်အလက် (Profile Screen)
- Current user profile details and role badge
- Language settings display
- Secure logout with confirmation

---

## 📁 Directory Structure

```text
mobile/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout & providers
│   ├── login.tsx                 # Login screen
│   ├── (tabs)/                   # Bottom tab screens
│   │   ├── _layout.tsx           # Role-based dynamic tabs
│   │   ├── index.tsx             # Dashboard
│   │   ├── parcels.tsx           # Parcels list
│   │   ├── deliveries.tsx        # Deliveries list (Admin/Manager)
│   │   ├── my-assignments.tsx    # My assignments (Staff)
│   │   ├── users.tsx             # Users list (Admin)
│   │   └── profile.tsx           # Profile & settings
│   ├── parcels/
│   │   ├── [id].tsx              # Parcel detail & actions
│   │   ├── create.tsx            # New parcel form
│   │   └── edit/[id].tsx         # Edit parcel form
│   ├── deliveries/
│   │   ├── [id].tsx              # Delivery detail
│   │   └── attempt/[id].tsx      # Record delivery attempt
│   └── users/
│       ├── [id].tsx              # User detail & edit
│       └── create.tsx            # Create user form
├── assets/                       # App icons, splash screens, favicon
├── src/
│   ├── constants/                # Colors, statuses, Burmese translations
│   ├── context/                  # AuthContext & state
│   └── services/                 # Axios API clients & service endpoints
├── app.json                      # Expo application manifest
├── babel.config.js               # Babel configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## 🛠️ Development & Running

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Backend API URL
Open `src/constants/index.ts` and set `API_BASE_URL` to your backend server URL (e.g. your local IP like `http://192.168.1.X:8000/api/v1` or production URL).

### 3. Start development server
```bash
npm start
```

### 4. Run on Android or iOS
```bash
# Android emulator or connected device:
npm run android

# iOS simulator (macOS only):
npm run ios
```

### 5. Type-check & Production Export
```bash
# Type check
./node_modules/.bin/tsc --noEmit

# Export static Hermes bundles for production
npx expo export
```

