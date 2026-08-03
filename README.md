# MedFinder

MedFinder is a full-stack medicine discovery and order-management platform designed for patients and pharmacies in Sri Lanka. Patients can find medicines across partnered pharmacies, submit reservations, upload prescriptions for review, request urgent medicines, and follow order progress. Pharmacy staff manage inventory and reservations, while administrators oversee platform activity.

## Project scope

### Patient experience

- Search and browse medicines by name, category, availability, or pharmacy.
- View pharmacy information, including location, contact details, and opening hours.
- Reserve medicines for pickup or delivery and add notes where required.
- Upload prescription data for pharmacist review.
- Submit and track emergency medicine requests.
- Follow reservation statuses from pending through approval, packing, pickup, delivery, cancellation, or rejection.
- Sign in with an email OTP and manage profile information and order history.
- Ask the AI assistant about medicines, pharmacies, availability, stock, and nearby options.

### Pharmacy operations

- Maintain medicine inventory with stock, price, category, description, usage, dosage, and availability.
- Review incoming reservations and update order statuses.
- Review emergency requests related to the pharmacy's inventory.
- Manage pharmacy location, opening hours, telephone number, and profile information.

### Administration

- View system-wide medicines, pharmacies, reservations, emergency orders, and contact messages.
- Manage pharmacy and medicine records.
- Process or override reservation and emergency-order statuses when required.

## Technology

- **Frontend:** React 19, React Router, Tailwind CSS, Lucide React, AOS, and Recharts
- **Backend:** Node.js and Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** Email OTP, JWT sessions, and role-based authorization
- **AI assistant:** Dify and OpenAI integrations with application-level fallback handling

## Repository structure

```text
rad/
├── medfinder/       React frontend
│   ├── public/       Static assets
│   └── src/          Pages, components, routing, API client, and utilities
├── server/           Express API
│   └── src/
│       ├── routes/   Authentication, pharmacies, medicines, orders, AI, and contact APIs
│       ├── models/   MongoDB schemas
│       ├── middleware/Authentication and authorization middleware
│       └── utils/    OTP, email, and validation helpers
└── package.json      Root workspace scripts
```

## Local development

### Prerequisites

- Node.js 18 or later
- A MongoDB database, local or hosted

### Setup

1. Install dependencies from the repository root:

   ```bash
   npm install
   npm install --prefix medfinder
   npm install --prefix server
   ```

2. Create `server/.env` using the required values for MongoDB, JWT, email delivery, and AI services. Set `CLIENT_ORIGIN=http://localhost:3000` for local development.

3. Start the API in one terminal:

   ```bash
   npm start --prefix server
   ```

4. Start the React application in another terminal:

   ```bash
   npm start --prefix medfinder
   ```

The frontend runs at `http://localhost:3000` and the API runs at `http://localhost:4000` by default.

## Root scripts

From the repository root:

```bash
npm start    # Start the frontend
npm run build # Build the frontend for production
npm test     # Run frontend tests
```

The backend also provides `npm run dev --prefix server` for development with automatic restarts.

## API areas

The Express server exposes APIs under `/api` for authentication and profiles, pharmacies, medicines, reservations, emergency orders, AI assistant queries, and contact messages. Protected routes use JWT authentication and apply patient, pharmacy, or administrator permissions as appropriate.

## Important note

MedFinder provides medicine search, reservation, and pharmacy coordination features. It does not replace a qualified healthcare professional's advice or a pharmacist's prescription review.
