# Project Development Prompt: Royal's Myawaddy Delivery Management System

## 1. Project Overview

Build a complete, modern, secure, and responsive web-based delivery management system for **Royal's Myawaddy Delivery Office**.

The business receives parcels from Mae Sot, Thailand, processes them at the Myawaddy office, sorts and assigns them to delivery staff, and delivers them to customers.

The main focus is managing daily operations at the Myawaddy office. The system does not need to manage the entire Mae Sot office.

The system must support four user roles:

1. Admin / CEO

2. Manager

3. Accountant

4. Delivery Staff

The application must be built as a web application first. In the future, I plan to build Expo React Native mobile applications that reuse the same backend API.

**Important requirements:**

- The frontend must support both Myanmar and English languages.

- The interface must be easy to use for staff with different levels of technical knowledge.

- The system must provide accurate parcel tracking and financial records.

- All permissions and business rules must be enforced by the backend.

- Build a functional application, not just a UI prototype or static dashboard.

## 2. Technology Stack

### Frontend

Use the following technologies:

- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui

- Lucide React icons

- React Router

- TanStack Query

- Axios

- React Hook Form

- Zod

- i18next

- react-i18next

- Recharts for dashboard charts

Use reusable components and a clear feature-based architecture.

### Backend

Use:

- PHP

- Laravel

- Laravel REST API

- Laravel Sanctum for API authentication

- Laravel Policies and Gates for authorization

- Laravel Form Requests for validation

- Eloquent ORM

Build a RESTful API that can serve the React web application now and Expo React Native applications in the future.

### Database

Use PostgreSQL as the primary database.

Use Laravel migrations, seeders, model relationships, indexes, and database constraints where appropriate.

### Development Environment

The application must run locally before being deployed online.

Use environment variables for configuration. Provide `.env.example` files for both frontend and backend where needed.

Do not commit passwords, API keys, tokens, or other secrets.

## 3. Bilingual Frontend: Myanmar and English

The entire frontend must support two languages:

- English

- မြန်မာ

This is a core requirement, not an optional enhancement.

### Language Switching

Add a language switcher to the application header or user profile menu.

Display the options as:

- English

- မြန်မာ

Requirements:

- English is the default language for the initial setup.

- Users can switch languages without reloading the entire application.

- Save the selected language in local storage.

- Restore the selected language when the user returns to the application.

- Ensure all four user roles can use both languages.

- Make the language switcher accessible on desktop and mobile screens.

### Translation Coverage

Translate all user-facing frontend content, including:

- Login and logout pages

- Navigation menus

- Dashboard titles and statistics

- Buttons and action labels

- Forms and placeholders

- Validation messages

- Tables and table column headings

- Search fields, filters, and pagination

- Parcel statuses and tracking history

- User roles and permission labels

- Delivery assignments

- Customer information labels

- Financial transactions and reports

- Charts and legends

- Notifications and toast messages

- Confirmation dialogs

- Empty states and loading states

- Error messages

- Profile and settings pages

Do not translate only the dashboard. Every frontend page must support both languages.

### Internationalization Architecture

Use `i18next` and `react-i18next`.

Create separate translation files, for example:

- `frontend/src/locales/en.json`

- `frontend/src/locales/my.json`

Organize translation keys consistently by feature.

Avoid hardcoding user-facing text directly inside React components.

Keep backend status codes, role identifiers, database values, and API field names language-independent. Translate only their display labels in the frontend.

For example, store the parcel status as `OUT_FOR_DELIVERY` and translate its displayed label into English or Myanmar.

Do not translate tracking numbers, parcel IDs, database identifiers, API field names, or other machine-readable values.

### Myanmar Font and Layout

Use a Unicode-compatible Myanmar font, preferably Noto Sans Myanmar, with suitable fallback fonts.

Ensure:

- Myanmar characters render correctly.

- Line height and letter spacing are appropriate.

- Buttons and form controls accommodate Myanmar text.

- Navigation items do not overflow.

- Tables remain readable.

- Dialogs and dropdowns can accommodate longer labels.

- Responsive layouts work with both languages.

Test the application using real Myanmar text, not just placeholder English text.

### Localization of Dates and Numbers

Use a consistent date and number formatting strategy.

- Use English date and number formatting when English is selected.

- Use an appropriate Myanmar-language display format when Myanmar is selected.

- Keep timestamps stored consistently in the backend.

- Keep financial calculations independent of the display locale.

- Do not change stored business data simply because the language changes.

The business currency must be configurable. Support MMK as the initial currency configuration if that is the office's confirmed operating currency.

## 4. Role-Based Access Control

Implement four distinct roles with different permissions.

The backend must enforce permissions on every protected endpoint. Hiding a button in the frontend is not sufficient security.

### Role 1: Admin / CEO

The Admin / CEO has access to overall system management.

Features:

- View the overall dashboard.

- View total parcels and delivery statistics.

- View financial summaries and reports.

- Create, edit, activate, and deactivate users.

- Assign roles and manage access permissions.

- View all parcels and parcel tracking histories.

- View all delivery staff and their performance.

- View all financial records and cash handovers.

- View audit logs and important system activities.

- Configure business settings.

- View operational and financial reports.

- Export permitted reports.

The system must prevent unauthorized users from granting themselves elevated permissions.

### Role 2: Manager

The Manager handles daily parcel operations at the Myawaddy office.

Features:

- View incoming parcels.

- Receive and verify parcels arriving from Mae Sot.

- Register new parcels.

- Generate unique tracking numbers.

- Search and filter parcels.

- View parcel details and tracking history.

- Sort parcels by destination, delivery area, or other configurable criteria.

- Assign parcels to delivery staff.

- Reassign parcels when necessary.

- Monitor assigned and in-progress deliveries.

- Review failed delivery attempts.

- Process parcels returned to the office.

- Manage parcel damage and missing-parcel reports.

- Coordinate redelivery or return-to-sender workflows.

- View operational reports.

- View delivery staff workload and performance.

The Manager should not be able to modify finalized accounting transactions unless explicitly authorized through a controlled correction process.

### Role 3: Accountant

The Accountant manages financial records and reconciliation.

Features:

- View delivery fees.

- Record customer payments.

- Manage Cash on Delivery (COD) amounts when applicable.

- Record income and expenses.

- View outstanding payments.

- Track cash collected by delivery staff.

- Record cash handovers from delivery staff.

- Verify and reconcile cash handovers.

- View daily financial summaries.

- Perform daily closing procedures.

- Generate financial reports.

- Filter transactions by date, staff member, payment method, and transaction type.

- Export financial reports.

- View financial transaction histories.

Financial requirements:

- Separate delivery fees from COD amounts.

- Do not automatically treat COD as company income.

- Clearly distinguish collected, pending, handed-over, and reconciled amounts.

- Prevent duplicate payment records.

- Do not silently edit or delete finalized financial transactions.

- Use a controlled reversal or adjustment process for corrections.

- Keep an audit trail of financial changes.

- Use precise decimal-based monetary storage rather than floating-point calculations.

- Prevent unauthorized financial actions.

### Role 4: Delivery Staff

Delivery Staff handle assigned deliveries.

Features:

- View their own assigned parcels.

- View parcel tracking numbers.

- View recipient names and contact information.

- View delivery addresses and delivery instructions.

- Open addresses in Google Maps when coordinates or usable addresses are available.

- Mark a parcel as out for delivery.

- Record delivery attempts.

- Mark parcels as delivered.

- Record failed delivery reasons.

- Record parcels returned to the office.

- Upload or record proof of delivery when supported.

- Record recipient confirmation.

- Record COD and delivery fee collections.

- View their own delivery history.

- View their own collected amounts.

- Submit cash handover records.

- View cash handover status.

Delivery Staff must not view other staff members' private assignments or financial information unless explicitly authorized.

A Delivery Staff member must not be able to mark an arbitrary parcel as delivered without an authorized assignment and valid status transition.

## 5. Core Parcel Management Workflow

Implement the following business workflow.

### Step 1: Receive Parcels

Parcels arrive from Mae Sot, Thailand, at the Myawaddy office.

The Manager or authorized staff member records:

- Tracking number

- Sender name and contact information, if available

- Recipient name

- Recipient phone number

- Delivery address

- Delivery area or township

- Parcel description

- Parcel quantity or package count

- Parcel notes

- Delivery fee

- COD amount, if applicable

- Received date and time

- Received by

- Initial parcel condition

Support manual tracking-number entry and automatic tracking-number generation.

Tracking numbers must be unique.

### Step 2: Verify and Sort

The Manager verifies parcel information and checks parcel condition.

The Manager can sort parcels using:

- Delivery area

- Destination

- Arrival date

- Delivery priority

- Parcel status

- Assigned staff member

Record damaged or missing parcels using a documented process.

### Step 3: Assign Delivery Staff

The Manager selects one or more eligible parcels and assigns them to a Delivery Staff member.

Each assignment must record:

- Parcel

- Assigned staff member

- Assigned by

- Assignment date and time

- Assignment notes

- Assignment status

Maintain assignment history when parcels are reassigned.

### Step 4: Deliver Parcels

The Delivery Staff member views assigned parcels and starts delivery.

For each delivery attempt, record:

- Parcel

- Staff member

- Attempt date and time

- Delivery result

- Failure reason, if applicable

- Recipient confirmation

- Proof of delivery, if available

- Amount collected

- Notes

Only allow valid status transitions.

### Step 5: Handle Failed Deliveries

Support configurable failure reasons, such as:

- Recipient unavailable

- Recipient phone unreachable

- Incorrect address

- Recipient refused parcel

- Customer requested rescheduling

- Other

A failed delivery must retain its history.

The Manager can review the failed delivery and choose an authorized next action, such as redelivery, return to office, or return to sender.

### Step 6: Manage Cash and Payments

Record delivery fees and COD amounts separately.

Record who collected the money, when it was collected, and the related parcel or transaction.

Delivery Staff can submit cash handover records to the Accountant.

The Accountant verifies the handover and records discrepancies where applicable.

Prevent duplicate collection and reconciliation records.

### Step 7: Complete and Track

Maintain a complete parcel timeline from receiving through final delivery or return.

Authorized users can view parcel history, delivery attempts, assignments, and related payment records.

Do not permanently delete historical parcel events.

## 6. Parcel Statuses and Transitions

Create a consistent parcel status system.

Suggested statuses:

- `RECEIVED_AT_MYAWADDY`

- `READY_FOR_DELIVERY`

- `ASSIGNED`

- `OUT_FOR_DELIVERY`

- `DELIVERED`

- `DELIVERY_FAILED`

- `RETURN_TO_OFFICE`

- `RETURNED_TO_SENDER`

- `DAMAGED`

- `MISSING`

Review whether additional statuses are necessary for the final business workflow.

Requirements:

- Store stable status codes in the database.

- Translate status labels in the frontend.

- Validate status transitions in the backend.

- Record the previous status, new status, user, timestamp, and reason.

- Prevent unauthorized status changes.

- Preserve historical events.

- Use database transactions when an operation updates multiple related records.

- Make terminal statuses and reopening rules explicit.

- Do not allow arbitrary status updates through unrestricted API requests.

## 7. Required Frontend Pages

Build complete, functional pages for the following sections.

### Authentication

- Login

- Logout

- Current user profile

- Unauthorized access page

- Session expiration handling

### Dashboard

Create a dashboard appropriate to each role.

Admin / CEO dashboard:

- Total parcels

- Parcels received today

- Parcels in progress

- Delivered parcels

- Failed deliveries

- Delivery success rate

- Total collected delivery fees

- Outstanding COD

- Financial summaries

- Recent activities

- Delivery performance charts

Manager dashboard:

- Incoming parcels

- Parcels waiting for assignment

- Assigned parcels

- Parcels out for delivery

- Failed deliveries

- Parcels returned to office

- Staff workload

- Recent operational activities

Accountant dashboard:

- Today's collections

- Delivery fee collections

- COD collections

- Pending cash handovers

- Reconciled handovers

- Outstanding payments

- Income and expenses

- Daily closing summary

Delivery Staff dashboard:

- Assigned parcels

- Today's deliveries

- Delivered parcels

- Pending deliveries

- Failed delivery attempts

- Cash collected

- Pending cash handover

Calculate dashboard statistics from actual backend data. Do not hardcode fake statistics in production pages.

### Parcel Management

- Parcel list

- Register parcel

- Parcel details

- Edit permitted parcel information

- Parcel tracking timeline

- Parcel assignment

- Delivery attempts

- Failed delivery management

- Return-to-office management

- Return-to-sender management

- Damaged and missing parcel reports

### Delivery Management

- Delivery assignment list

- Staff workload

- Staff-specific delivery list

- Delivery attempt details

- Proof of delivery

- Delivery history

- Redelivery workflow

### User Management

- User list

- Create user

- Edit user

- Activate or deactivate user

- Assign role

- User profile

- Access-denied states

Only authorized roles can access user management features.

### Finance and Accounting

- Financial dashboard

- Payment records

- Delivery fee records

- COD records

- Income and expenses

- Cash handovers

- Handover verification

- Reconciliation

- Outstanding balances

- Daily closing

- Financial reports

- Transaction details and audit history

### Reports

- Parcel summary report

- Delivery performance report

- Staff performance report

- Failed delivery report

- Returned parcel report

- Delivery fee report

- COD report

- Cash handover report

- Income and expense report

Support appropriate date filters and permitted exports.

### Settings

- Language preference

- Business information

- Currency configuration

- Delivery settings

- Parcel tracking settings

- User profile settings

Only authorized users can modify system-wide settings.

## 8. UI/UX Design Requirements

Create a clean, professional, modern dashboard for an internal delivery management business.

Use a desktop-first layout that remains responsive on tablets and mobile browsers.

### Design System

Use the following preferred colors:

- Main background: `#0A0B09`

- Surface: `#161814`

- Primary accent: `#C7FF24`

- Primary text: `#FFFFFF`

- Secondary text: `#C7C7C7`

- Border: `#2F332B`

Use the accent color selectively for primary actions, important highlights, and active navigation states.

Avoid excessive gradients, unnecessary animations, oversized cards, and decorative visual effects.

Use:

- Sidebar navigation on desktop

- Responsive navigation on smaller screens

- Clear page titles and breadcrumbs where useful

- Searchable and filterable data tables

- Pagination for large datasets

- Consistent status badges

- Reusable forms and dialogs

- Loading indicators

- Empty states

- Error states

- Success and error toast notifications

- Confirmation dialogs for destructive or high-impact actions

- Accessible labels and keyboard navigation

Use Lucide React icons consistently.

Do not use browser `alert()` for normal application notifications.

Ensure buttons have meaningful labels and proper loading/disabled states.

### Bilingual Layout Requirements

Test the entire design in both English and Myanmar.

Do not assume translated text will have the same length in both languages.

Prevent text clipping, broken layouts, and horizontal overflow.

## 9. Suggested Database Design

Design a normalized relational database. Refine this list when necessary to support correct relationships and business rules.

### Core Tables

 1. `users`

 2. `roles`

 3. `permissions`, if fine-grained permissions are needed

 4. `role_permissions`, if fine-grained permissions are needed

 5. `parcels`

 6. `parcel_status_histories`

 7. `delivery_assignments`

 8. `delivery_attempts`

 9. `proof_of_deliveries`, if stored separately

10. `payments`

11. `financial_transactions`

12. `cash_handovers`

13. `cash_handover_items`, if individual collections need to be reconciled

14. `expenses`

15. `activity_logs`

16. `business_settings`

Add additional tables where needed for payment methods, delivery areas, attachment metadata, or other reusable entities.

### Database Requirements

- Use primary keys and foreign keys.

- Add appropriate indexes for tracking numbers, statuses, dates, assignments, and common search filters.

- Enforce tracking-number uniqueness.

- Use appropriate nullable fields and validation rules.

- Use decimal or integer minor-unit representations for money, not floating-point types.

- Store timestamps consistently and display them in the appropriate local timezone.

- Use database transactions for operations that must succeed or fail together.

- Apply soft deletion only where appropriate.

- Preserve important parcel, delivery, and financial history.

- Add created and updated timestamps.

- Record the user responsible for important business operations.

Do not store duplicated or derivable financial totals unnecessarily. Define how financial totals are calculated and reconciled.

## 10. REST API Requirements

Use a versioned API prefix such as `/api/v1`.

Design clear, consistent REST endpoints.

Example endpoints:

### Authentication

- `POST /api/v1/auth/login`

- `POST /api/v1/auth/logout`

- `GET /api/v1/auth/me`

### Dashboard

- `GET /api/v1/dashboard`

- `GET /api/v1/dashboard/parcel-statistics`

- `GET /api/v1/dashboard/financial-statistics`

Return only data that the authenticated role is authorized to see.

### Users

- `GET /api/v1/users`

- `POST /api/v1/users`

- `GET /api/v1/users/{id}`

- `PUT /api/v1/users/{id}`

- `PATCH /api/v1/users/{id}/status`

### Parcels

- `GET /api/v1/parcels`

- `POST /api/v1/parcels`

- `GET /api/v1/parcels/{id}`

- `PUT /api/v1/parcels/{id}`

- `GET /api/v1/parcels/{id}/tracking`

- `POST /api/v1/parcels/{id}/assignments`

- `POST /api/v1/parcels/{id}/status-transitions`

### Deliveries

- `GET /api/v1/deliveries/my-assignments`

- `GET /api/v1/deliveries/{id}`

- `POST /api/v1/deliveries/{id}/attempts`

- `POST /api/v1/deliveries/{id}/proof-of-delivery`

- `POST /api/v1/deliveries/{id}/cash-collections`

### Finance

- `GET /api/v1/finance/payments`

- `POST /api/v1/finance/payments`

- `GET /api/v1/finance/transactions`

- `POST /api/v1/finance/expenses`

- `GET /api/v1/finance/cash-handovers`

- `POST /api/v1/finance/cash-handovers`

- `POST /api/v1/finance/cash-handovers/{id}/verify`

- `GET /api/v1/finance/reports`

### Reports

- `GET /api/v1/reports/parcels`

- `GET /api/v1/reports/deliveries`

- `GET /api/v1/reports/staff-performance`

- `GET /api/v1/reports/financial`

These are examples, not a requirement to use every endpoint exactly as written. Adjust endpoint names and structures to create a consistent API.

For all endpoints:

- Validate request data.

- Enforce authentication and authorization.

- Return consistent JSON responses.

- Use appropriate HTTP status codes.

- Support pagination and filtering for list endpoints.

- Avoid exposing sensitive information.

- Document request and response formats.

- Return useful validation errors.

- Prevent duplicate operations where appropriate.

## 11. Security Requirements

Implement security from the beginning.

- Hash passwords securely using Laravel's supported password hashing.

- Use Laravel Sanctum for authentication.

- Protect all private API endpoints.

- Enforce role-based authorization on the backend.

- Validate all input on the server.

- Protect against unauthorized object access and IDOR vulnerabilities.

- Prevent users from viewing or modifying unauthorized parcels and financial records.

- Apply appropriate rate limiting to authentication and sensitive endpoints.

- Keep secrets in environment variables.

- Restrict file upload types and sizes.

- Validate uploaded files.

- Avoid exposing passwords, tokens, and unnecessary personal information in logs.

- Use HTTPS in production.

- Apply secure CORS settings.

- Use safe database access through Eloquent or parameterized queries.

- Maintain audit logs for important operations.

Do not trust role names, amounts, user IDs, parcel statuses, or permission claims supplied by the frontend.

The backend must determine the authenticated user and verify authorization independently.

## 12. Financial Integrity and Audit Trail

Financial records require special care.

Implement the following rules:

 1. Delivery fees and COD amounts must remain separate.

 2. Every collection must reference its relevant parcel and responsible user when applicable.

 3. A payment must not be recorded twice for the same collection event.

 4. Cash handovers must identify the submitting staff member and verifying accountant.

 5. Record expected cash, submitted cash, verified cash, and discrepancies where applicable.

 6. Record timestamps and responsible users for financial actions.

 7. Finalized transactions must not be silently edited or deleted.

 8. Corrections must use an auditable adjustment or reversal workflow.

 9. Daily closing must summarize relevant transactions and handovers consistently.

10. Prevent unauthorized changes to closed accounting periods, unless an authorized reopening process is implemented.

11. Define how outstanding balances are calculated.

12. Make reports consistent with the underlying financial records.

Do not treat all money collected from customers as company income. Define accounting treatment for COD and other pass-through amounts according to the business's actual rules.

## 13. File Uploads and Proof of Delivery

Support proof of delivery when practical.

Possible evidence includes:

- Recipient confirmation

- Recipient name

- Delivery notes

- Delivery timestamp

- Photo or signature, if required by the business

Store files using a suitable storage abstraction so local development storage can later be replaced with compatible object storage.

Protect access to private delivery evidence.

Do not expose private uploaded files through unrestricted public URLs.

Record the user, parcel, and delivery attempt associated with each proof-of-delivery record.

## 14. Testing Requirements

Write meaningful tests for both backend and frontend.

### Backend Tests

Test:

- Login and authentication

- Role-based permissions

- User management restrictions

- Parcel registration

- Unique tracking numbers

- Parcel assignment

- Valid and invalid status transitions

- Delivery attempts

- Failed delivery handling

- Duplicate payment prevention

- Cash handover creation and verification

- Financial reconciliation

- Unauthorized API requests

- Data validation

- Audit trail creation

### Frontend Tests

Test:

- Login and logout flows

- Role-based navigation

- Language switching

- Translation coverage in English and Myanmar

- Language preference persistence

- Form validation

- Parcel search and filtering

- Assignment workflows

- Delivery status updates

- Finance forms

- Loading, empty, and error states

### Manual Testing

Verify the complete business workflow:

 1. Register a parcel.

 2. Verify and prepare it for delivery.

 3. Assign it to a Delivery Staff member.

 4. Record a delivery attempt.

 5. Mark it delivered or failed.

 6. Record relevant customer collections.

 7. Submit a cash handover.

 8. Verify and reconcile the handover.

 9. Check the tracking timeline and financial reports.

10. Repeat important UI workflows in both languages.

## 15. Seed Data and Development Accounts

Create realistic seed data for local development.

Include:

- All four user roles

- Several delivery staff members

- Sample parcels in different statuses

- Sample assignments

- Sample delivery attempts

- Sample financial transactions

- Sample cash handovers

- Sample audit log entries

Create documented development-only test accounts for each role.

Use clearly documented local development credentials and never reuse them in production.

Do not create fake financial statistics directly in dashboard components. Dashboard data must come from seeded database records and backend calculations.

## 16. Project Structure

Use a clear monorepo-style structure:

`royal-myawaddy-delivery/`

- `frontend/`

  - `src/components/`

  - `src/features/`

  - `src/layouts/`

  - `src/pages/`

  - `src/routes/`

  - `src/services/`

  - `src/hooks/`

  - `src/lib/`

  - `src/locales/`

  - `src/types/`

  - `src/utils/`

- `backend/`

  - `app/Models/`

  - `app/Http/Controllers/`

  - `app/Http/Requests/`

  - `app/Policies/`

  - `app/Services/`

  - `app/Enums/`

  - `database/migrations/`

  - `database/seeders/`

  - `routes/`

  - `tests/`

- `docs/`

  - `database-design.md`

  - `api-documentation.md`

  - `business-workflow.md`

  - `installation-guide.md`

- `README.md`

Adapt this structure where needed while keeping the code organized and maintainable.

## 17. Documentation Requirements

Create a complete README with:

- Project overview

- Features

- Technology stack

- System architecture

- Prerequisites

- Installation instructions

- Environment configuration

- Database setup

- Migration and seeding instructions

- Development server commands

- API documentation instructions

- Test commands

- Build commands

- Deployment preparation

- Troubleshooting guidance

Also document the database schema, parcel workflow, role permissions, and API endpoints.

All technical documentation should be written in clear English.

## 18. Deployment Preparation

Prepare the project for online deployment, but prioritize local development and testing first.

Requirements:

- Frontend and backend must have separate environment configurations.

- Configure production API URLs through environment variables.

- Provide production build instructions.

- Provide database migration instructions.

- Configure CORS for approved frontend domains.

- Use HTTPS in production.

- Keep sensitive configuration out of version control.

- Provide deployment guidance for a suitable frontend host and Laravel-compatible backend host.

- Provide a PostgreSQL production database configuration.

- Document backup and recovery considerations.

Do not claim the application is deployed unless deployment has actually been completed and verified.

## 19. Future Expo Mobile Application Compatibility

The first deliverable is the web application.

However, design the backend so future Expo React Native applications can reuse it.

Requirements:

- Use a consistent versioned REST API.

- Return predictable JSON responses.

- Keep business logic in backend services rather than frontend components.

- Use API authentication suitable for mobile clients.

- Document authentication and token handling.

- Keep parcel status codes and financial rules independent of the frontend.

- Support role-specific API access.

- Avoid browser-only assumptions in backend business logic.

Do not build the Expo mobile application in this phase unless explicitly requested.

## 20. Antigravity Development Instructions

Work as a senior full-stack engineer.

Do not attempt to generate the entire application as a single unstructured block of code.

Follow this implementation sequence.

### Phase 1: Requirements and Architecture

- Review the complete requirements.

- Identify missing business rules.

- Document assumptions clearly.

- Design the database schema.

- Define role permissions.

- Define parcel status transitions.

- Define financial workflows.

- Design the REST API.

- Create the initial project structure.

### Phase 2: Backend Foundation

- Create the Laravel backend.

- Configure PostgreSQL.

- Create migrations, models, and relationships.

- Implement authentication.

- Implement authorization.

- Implement validation.

- Create seeders and development accounts.

- Write foundational backend tests.

### Phase 3: Frontend Foundation

- Create the React, TypeScript, and Vite frontend.

- Configure Tailwind CSS and shadcn/ui.

- Set up React Router.

- Set up Axios and TanStack Query.

- Set up React Hook Form and Zod.

- Implement authentication handling.

- Implement protected routes and role-based navigation.

- Configure i18next for English and Myanmar.

- Add Myanmar font support.

- Implement the shared design system.

### Phase 4: Core Business Features

Implement features in this order:

 1. User and role management

 2. Parcel registration and search

 3. Parcel verification and sorting

 4. Delivery staff assignment

 5. Parcel status history

 6. Delivery attempts and proof of delivery

 7. Delivery fees and COD

 8. Cash handovers and reconciliation

 9. Dashboards and reports

10. Settings and audit logs

For each feature, implement the database changes, backend logic, authorization, API endpoints, frontend pages, bilingual translations, and tests before moving on.

### Phase 5: Integration and Quality Assurance

- Connect the frontend to the real backend API.

- Test all four roles.

- Test all important workflows.

- Test Myanmar and English throughout the application.

- Verify database persistence.

- Verify authorization at the API level.

- Check financial calculations and reconciliation.

- Fix runtime errors, build errors, and broken routes.

- Ensure there are no major placeholder features remaining.

### Phase 6: Final Documentation and Delivery

Provide:

- Complete frontend source code

- Complete backend source code

- Database migrations and seeders

- English and Myanmar translation files

- Automated tests

- `.env.example` files

- API documentation

- Database documentation

- README and local setup guide

- Development test accounts

- Production deployment guide

## 21. Final Acceptance Criteria

The project is complete only when:

- The frontend and backend run locally.

- PostgreSQL stores and retrieves actual application data.

- Login and logout work.

- All four roles have correct permissions.

- The parcel workflow works from receiving to delivery or return.

- Delivery assignments and status history work correctly.

- Delivery fees and COD are tracked separately.

- Cash handovers can be submitted and reconciled.

- Financial records are protected against unauthorized changes.

- Dashboard statistics come from actual backend data.

- All main pages support English and Myanmar.

- The selected language persists after refreshing the page.

- Myanmar Unicode text renders correctly.

- Responsive layouts work on desktop and mobile browsers.

- Backend and frontend tests pass.

- Documentation explains how to install, run, test, and deploy the application.

**Final instruction:** Prioritize correctness, security, maintainability, and real business workflows over visual decoration. Build a working delivery management system suitable for actual use at Royal's Myawaddy office. Make sensible engineering decisions, document assumptions, and never claim a feature is complete until it has been implemented and tested.