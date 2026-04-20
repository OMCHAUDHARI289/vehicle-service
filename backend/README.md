# Vehicle Service Management Backend

Simple Node.js, Express.js and MySQL backend using ES Modules, mysql2 connection pool and session-based authentication.

## Setup

1. Create the database tables:

```sql
SOURCE ../database/schema.sql;
```

2. Copy `.env.example` to `.env` and update your MySQL password:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vehicle_service_db
DB_PORT=3306
SESSION_SECRET=change_this_secret_for_sessions
FRONTEND_URL=http://localhost:5500
```

3. Install and run:

```bash
npm install
npm run dev
```

## API Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`

Vehicles:

- `POST /api/vehicles/add`
- `GET /api/vehicles/my`
- `DELETE /api/vehicles/:id`

Services:

- `POST /api/services/add`
- `GET /api/services/:vehicleId`
- `GET /api/services/last/:vehicleId`

## Axios Session Example

Use `withCredentials: true` so the browser sends the session cookie.

```js
axios.post("http://localhost:5000/api/auth/login", {
  email: "rahul@example.com",
  password: "password123"
}, {
  withCredentials: true
});
```

## Viva Explanation

- `config/db.js` creates a MySQL connection pool using `mysql2/promise`.
- `routes` define API endpoints.
- `controllers` handle request and response logic.
- `models` contain only SQL queries.
- `authMiddleware` checks if `req.session.user` exists before allowing protected routes.
- Vehicle and service controllers first verify ownership using `user_id`, so users cannot access another user's data.
