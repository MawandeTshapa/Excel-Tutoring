# Auth Testing Playbook (Excel Tutoring)

Combined custom JWT email/password + Emergent Google OAuth auth.

## 1. Verify MongoDB
```
mongosh
use test_database
db.users.find({role:"admin"}).pretty()
db.users.getIndexes()
```
Verify:
- Admin user exists with role="admin"
- `users.email` unique index exists
- `user_sessions.session_token` unique index exists
- Bcrypt hash starts with `$2b$`

## 2. Backend API (base URL = REACT_APP_BACKEND_URL)

### Register
```
curl -c cookies.txt -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@test.com","password":"Test1234!","name":"Student One","role":"student_highschool"}'
```
Should return user and set cookies.

### Login
```
curl -c cookies.txt -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exceltutoring.co.za","password":"ExcelAdmin2026!"}'
```

### /me
```
curl -b cookies.txt "$API/api/auth/me"
```

### Logout
```
curl -b cookies.txt -X POST "$API/api/auth/logout"
```

## 3. Google Auth (Emergent)
Frontend: click "Continue with Google" → goes to `auth.emergentagent.com/?redirect=<origin>/auth/callback`.
Returns with `#session_id=...`.
Frontend calls `POST /api/auth/google/session` with `X-Session-ID` header; backend exchanges at `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data`, stores session, sets `session_token` cookie (httpOnly, Secure, SameSite=None).
New Google user without role → redirect to `/onboarding` to pick role.

## 4. Checklist
- [ ] Register → cookies set, user returned
- [ ] Login with wrong pwd → 401, increments `login_attempts`; 5+ fails = lockout
- [ ] /api/auth/me returns user when authenticated, 401 otherwise
- [ ] Admin seeded on startup
- [ ] Google session endpoint sets `session_token` cookie on /api
- [ ] Dashboard route protected (redirects to /login when unauthenticated)
- [ ] Admin-only routes 403 for non-admin

## Admin Seed
Email: `admin@exceltutoring.co.za`
Password: `ExcelAdmin2026!`
