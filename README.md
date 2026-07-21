# IMEI Guardian Pro Backend

Express + TypeScript + MongoDB API for the IMEI Guardian Pro frontend.

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Default local API URL:

```text
http://localhost:5000/api
```

Default seeded admin:

```text
mehedimdf@gmail.com
admin123
```

## Endpoints

- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/contact-admin`
- `GET|POST /api/phones`
- `PUT|DELETE /api/phones/:id`
- `GET|POST /api/gadgets`
- `PUT|DELETE /api/gadgets/:id`
- `GET|POST /api/gadgets-sales`
- `GET|POST /api/partners/transactions`
- `DELETE /api/partners/transactions/:id`
- `GET|POST /api/expenses`
- `DELETE /api/expenses/:id`
