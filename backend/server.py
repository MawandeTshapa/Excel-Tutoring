from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
import requests
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 24 * 7  # 7 days for a smooth preview UX
REFRESH_TOKEN_DAYS = 30
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@exceltutoring.co.za")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "ExcelAdmin2026!")
PAYSTACK_PAYMENT_URL = os.environ.get("PAYSTACK_PAYMENT_URL", "")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]

Role = Literal["admin", "tutor", "student_highschool", "student_university", "pending"]

# -----------------------------------------------------------------------------
# DB
# -----------------------------------------------------------------------------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# -----------------------------------------------------------------------------
# App / Router
# -----------------------------------------------------------------------------
app = FastAPI(title="Excel Tutoring API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("excel-tutoring")

# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: Role
    auth_provider: str = "email"  # "email" or "google"
    picture: Optional[str] = None
    created_at: datetime
    phone: Optional[str] = None


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    role: Literal["student_highschool", "student_university", "tutor"]
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class SetRoleIn(BaseModel):
    role: Literal["student_highschool", "student_university", "tutor"]


class TestimonialIn(BaseModel):
    name: str
    message: str
    rating: int = Field(ge=1, le=5)
    program: Optional[str] = None


class TutorApplicationIn(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    qualification: str
    subjects: List[str]
    level: Literal["high_school", "university", "both"]
    experience_years: int = 0
    bio: str


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str


class AssignmentIn(BaseModel):
    student_user_id: str
    tutor_user_id: Optional[str] = None
    module_id: str


class SubscribeIn(BaseModel):
    plan_id: str


class ModuleIn(BaseModel):
    level: Literal["high_school", "university"]
    code: str
    name: str
    description: str
    grade_range: Optional[str] = None


class ModuleUpdate(BaseModel):
    level: Optional[Literal["high_school", "university"]] = None
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    grade_range: Optional[str] = None


class PricingIn(BaseModel):
    name: str
    audience: Literal["high_school", "university"]
    price_zar: int = Field(ge=0)
    period: str = "month"
    order: int = 0
    features: List[str]
    popular: bool = False


class PricingUpdate(BaseModel):
    name: Optional[str] = None
    audience: Optional[Literal["high_school", "university"]] = None
    price_zar: Optional[int] = Field(default=None, ge=0)
    period: Optional[str] = None
    order: Optional[int] = None
    features: Optional[List[str]] = None
    popular: Optional[bool] = None


# -----------------------------------------------------------------------------
# Password / JWT helpers
# -----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    # Cross-site cookies (frontend domain != backend domain via ingress) require Secure + SameSite=None
    response.set_cookie(
        "access_token", access, httponly=True, secure=True, samesite="none",
        max_age=ACCESS_TOKEN_MINUTES * 60, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, secure=True, samesite="none",
        max_age=REFRESH_TOKEN_DAYS * 86400, path="/",
    )


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        "session_token", token, httponly=True, secure=True, samesite="none",
        max_age=7 * 86400, path="/",
    )


def clear_all_auth_cookies(response: Response):
    for name in ("access_token", "refresh_token", "session_token"):
        response.delete_cookie(name, path="/")


def sanitize_user(u: dict) -> dict:
    u = dict(u)
    u.pop("_id", None)
    u.pop("password_hash", None)
    if isinstance(u.get("created_at"), datetime):
        u["created_at"] = u["created_at"].isoformat()
    return u


async def get_user_by_token(request: Request) -> Optional[dict]:
    # 1) JWT access token cookie (email/password auth)
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get("type") == "access":
                user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
                if user:
                    return user
        except jwt.ExpiredSignatureError:
            pass
        except jwt.InvalidTokenError:
            pass

    # 2) Emergent Google session_token cookie
    session_token = request.cookies.get("session_token")
    if session_token:
        sess = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if sess:
            expires_at = sess.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at and expires_at >= datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
                if user:
                    return user
    return None


async def require_user(request: Request) -> dict:
    user = await get_user_by_token(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(request: Request) -> dict:
    user = await require_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# -----------------------------------------------------------------------------
# Auth endpoints
# -----------------------------------------------------------------------------
@api.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": data.name.strip(),
        "role": data.role,
        "auth_provider": "email",
        "password_hash": hash_password(data.password),
        "phone": data.phone,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(doc)

    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return sanitize_user(doc)


@api.post("/auth/login")
async def login(data: LoginIn, request: Request, response: Response):
    email = data.email.lower().strip()
    xff = request.headers.get("x-forwarded-for", "")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
    identifier = f"{ip}:{email}"

    # Brute-force lockout
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and isinstance(locked_until, datetime):
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if locked_until > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or user.get("auth_provider") != "email" or not user.get("password_hash"):
        await _record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(data.password, user["password_hash"]):
        await _record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})

    access = create_access_token(user["user_id"])
    refresh = create_refresh_token(user["user_id"])
    set_auth_cookies(response, access, refresh)
    return sanitize_user(user)


async def _record_failed_attempt(identifier: str):
    now = datetime.now(timezone.utc)
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {
            "$inc": {"count": 1},
            "$set": {"last_attempt": now, "locked_until": now + timedelta(minutes=15)},
        },
        upsert=True,
    )


@api.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    clear_all_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(require_user)):
    return sanitize_user(user)


@api.post("/auth/google/session")
async def google_session(response: Response, x_session_id: Optional[str] = Header(None)):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if not x_session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID header")
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": x_session_id},
            timeout=10,
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Auth provider unreachable: {e}")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    data = r.json()
    email = (data.get("email") or "").lower().strip()
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=502, detail="Malformed auth response")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}},
        )
        user_doc = {**existing, "name": name, "picture": picture}
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "pending",  # user will pick role in onboarding
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.insert_one(user_doc)

    await db.user_sessions.update_one(
        {"session_token": session_token},
        {
            "$set": {
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    set_session_cookie(response, session_token)
    return sanitize_user(user_doc)


@api.post("/auth/set-role")
async def set_role(data: SetRoleIn, user: dict = Depends(require_user)):
    if user.get("role") not in ("pending", None):
        raise HTTPException(status_code=400, detail="Role already set")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": data.role}})
    user["role"] = data.role
    return sanitize_user(user)


# -----------------------------------------------------------------------------
# Public endpoints
# -----------------------------------------------------------------------------
@api.get("/modules")
async def list_modules():
    mods = await db.modules.find({}, {"_id": 0}).to_list(500)
    return mods


@api.get("/pricing")
async def list_pricing():
    plans = await db.pricing_plans.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    return plans


@api.get("/testimonials")
async def list_testimonials():
    items = await db.testimonials.find(
        {"approved": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    for t in items:
        if isinstance(t.get("created_at"), datetime):
            t["created_at"] = t["created_at"].isoformat()
    return items


@api.post("/testimonials")
async def submit_testimonial(data: TestimonialIn):
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "message": data.message,
        "rating": data.rating,
        "program": data.program,
        "approved": False,
        "created_at": datetime.now(timezone.utc),
    }
    await db.testimonials.insert_one(doc)
    return {"ok": True, "message": "Thanks! Your testimonial is awaiting approval."}


@api.post("/tutors/apply")
async def apply_tutor(data: TutorApplicationIn):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",  # pending/approved/rejected
        "created_at": datetime.now(timezone.utc),
    }
    await db.tutor_applications.insert_one(doc)
    return {"ok": True, "message": "Application received. We'll be in touch shortly."}


@api.post("/contact")
async def contact(data: ContactIn):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc),
    }
    await db.contact_messages.insert_one(doc)
    return {"ok": True, "message": "Thanks! We'll be in touch soon."}


@api.get("/faq")
async def faq():
    return [
        {"q": "How do online lessons work?", "a": "Lessons are delivered live via Zoom/Google Meet. You get a link after subscribing, plus recordings and notes."},
        {"q": "What grades do you cover for high school?", "a": "Grades 8–12, CAPS-aligned: Mathematics, Physical Science and Life Sciences."},
        {"q": "Which university modules do you tutor?", "a": "Mathematics, Statistics, Computer Science and Chemistry foundational modules across most SA universities."},
        {"q": "How does billing work?", "a": "Monthly subscriptions in ZAR (R) via Paystack. You can cancel anytime from your dashboard."},
        {"q": "Can I change or cancel my plan?", "a": "Yes — upgrade/downgrade or cancel from your Student Dashboard. Cancellation stops the next billing cycle."},
        {"q": "Do you offer a free trial?", "a": "We offer an introductory consultation. Contact us to arrange a session."},
    ]


# -----------------------------------------------------------------------------
# Tutor endpoints
# -----------------------------------------------------------------------------
async def require_tutor(request: Request) -> dict:
    user = await require_user(request)
    if user.get("role") != "tutor":
        raise HTTPException(status_code=403, detail="Tutors only")
    return user


@api.get("/tutor/students")
async def tutor_students(user: dict = Depends(require_tutor)):
    enrolls = await db.enrollments.find(
        {"tutor_user_id": user["user_id"]}, {"_id": 0}
    ).to_list(500)
    out = []
    for e in enrolls:
        mod = await db.modules.find_one({"id": e.get("module_id")}, {"_id": 0})
        st = await db.users.find_one(
            {"user_id": e.get("student_user_id")}, {"_id": 0, "password_hash": 0}
        )
        if not st:
            continue
        sub = await db.subscriptions.find_one({"user_id": st["user_id"]}, {"_id": 0})
        sub_status = sub.get("status") if sub else None
        out.append({
            "enrollment_id": e.get("id"),
            "module": mod,
            "student": {
                "user_id": st["user_id"],
                "name": st.get("name"),
                "email": st.get("email"),
                "phone": st.get("phone"),
                "role": st.get("role"),
            },
            "subscription_status": sub_status,
        })
    return out


@api.get("/tutor/summary")
async def tutor_summary(user: dict = Depends(require_tutor)):
    enrolls = await db.enrollments.find(
        {"tutor_user_id": user["user_id"]}, {"_id": 0}
    ).to_list(1000)
    student_ids = {e["student_user_id"] for e in enrolls}
    module_ids = {e["module_id"] for e in enrolls}
    active = 0
    for sid in student_ids:
        s = await db.subscriptions.find_one({"user_id": sid, "status": "active"})
        if s:
            active += 1
    return {
        "total_students": len(student_ids),
        "total_modules": len(module_ids),
        "active_subscriptions": active,
        "enrollments": len(enrolls),
    }


# -----------------------------------------------------------------------------
# Student endpoints
# -----------------------------------------------------------------------------
@api.get("/student/enrollments")
async def my_enrollments(user: dict = Depends(require_user)):
    enrolls = await db.enrollments.find({"student_user_id": user["user_id"]}, {"_id": 0}).to_list(200)
    # Join module + tutor
    out = []
    for e in enrolls:
        mod = await db.modules.find_one({"id": e.get("module_id")}, {"_id": 0})
        tutor = None
        if e.get("tutor_user_id"):
            t = await db.users.find_one({"user_id": e["tutor_user_id"]}, {"_id": 0})
            if t:
                tutor = {"user_id": t["user_id"], "name": t["name"], "email": t["email"], "picture": t.get("picture")}
        out.append({**e, "module": mod, "tutor": tutor})
    return out


@api.get("/student/subscription")
async def my_subscription(user: dict = Depends(require_user)):
    sub = await db.subscriptions.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if sub:
        for k in ("next_payment_date", "started_at", "cancelled_at"):
            if isinstance(sub.get(k), datetime):
                sub[k] = sub[k].isoformat()
    return sub or {}


@api.post("/student/subscribe")
async def subscribe(data: SubscribeIn, user: dict = Depends(require_user)):
    plan = await db.pricing_plans.find_one({"id": data.plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user["user_id"],
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "amount_zar": plan["price_zar"],
        "status": "pending_payment",
        "started_at": now,
        "next_payment_date": now + timedelta(days=30),
        "outstanding_zar": plan["price_zar"],
        "paystack_url": PAYSTACK_PAYMENT_URL,
        "cancelled_at": None,
    }
    await db.subscriptions.update_one(
        {"user_id": user["user_id"]}, {"$set": doc}, upsert=True
    )
    return {"ok": True, "paystack_url": PAYSTACK_PAYMENT_URL, "subscription": {**doc, "started_at": doc["started_at"].isoformat(), "next_payment_date": doc["next_payment_date"].isoformat()}}


@api.post("/student/subscription/confirm")
async def confirm_subscription(user: dict = Depends(require_user)):
    # In a real setup, this would be a Paystack webhook. Here we mark active once the user returns from Paystack.
    sub = await db.subscriptions.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription")
    await db.subscriptions.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"status": "active", "outstanding_zar": 0}},
    )
    await db.payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "plan_id": sub["plan_id"],
        "amount_zar": sub["amount_zar"],
        "status": "paid",
        "created_at": datetime.now(timezone.utc),
    })
    return {"ok": True}


@api.post("/student/subscription/cancel")
async def cancel_subscription(user: dict = Depends(require_user)):
    res = await db.subscriptions.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc)}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="No subscription")
    return {"ok": True}


@api.get("/student/notifications")
async def my_notifications(user: dict = Depends(require_user)):
    notes = []
    sub = await db.subscriptions.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if sub and sub.get("status") == "pending_payment":
        notes.append({"type": "warning", "title": "Payment due", "message": f"Complete your Paystack subscription to activate lessons (R{sub.get('amount_zar')})."})
    if sub and sub.get("status") == "active":
        npd = sub.get("next_payment_date")
        if isinstance(npd, datetime):
            days = (npd - datetime.now(timezone.utc)).days
            if 0 <= days <= 5:
                notes.append({"type": "info", "title": "Payment due soon", "message": f"Your next payment is in {days} day(s)."})
    if sub and sub.get("status") == "cancelled":
        notes.append({"type": "info", "title": "Subscription cancelled", "message": "You can resubscribe anytime from Pricing."})
    return notes


# -----------------------------------------------------------------------------
# Admin endpoints
# -----------------------------------------------------------------------------
@api.get("/admin/students")
async def admin_students(_: dict = Depends(require_admin)):
    users = await db.users.find(
        {"role": {"$in": ["student_highschool", "student_university"]}}, {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    for u in users:
        if isinstance(u.get("created_at"), datetime):
            u["created_at"] = u["created_at"].isoformat()
    return users


@api.get("/admin/tutors")
async def admin_tutors(_: dict = Depends(require_admin)):
    apps = await db.tutor_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for a in apps:
        if isinstance(a.get("created_at"), datetime):
            a["created_at"] = a["created_at"].isoformat()
    return apps


@api.patch("/admin/tutors/{app_id}/{action}")
async def admin_tutor_action(app_id: str, action: str, _: dict = Depends(require_admin)):
    if action not in ("approve", "reject"):
        raise HTTPException(400, "Invalid action")
    appn = await db.tutor_applications.find_one({"id": app_id}, {"_id": 0})
    if not appn:
        raise HTTPException(404, "Not found")
    status = "approved" if action == "approve" else "rejected"
    await db.tutor_applications.update_one({"id": app_id}, {"$set": {"status": status}})
    temp_pwd = None
    if action == "approve":
        existing = await db.users.find_one({"email": appn["email"].lower()})
        if not existing:
            temp_pwd = secrets.token_urlsafe(8)
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": appn["email"].lower(),
                "name": appn["full_name"],
                "role": "tutor",
                "auth_provider": "email",
                "password_hash": hash_password(temp_pwd),
                "phone": appn.get("phone"),
                "subjects": appn.get("subjects"),
                "level": appn.get("level"),
                "created_at": datetime.now(timezone.utc),
            })
            logger.info(f"Created tutor user {appn['email']} with temp password: {temp_pwd}")
    return {"ok": True, "status": status, "temp_password": temp_pwd}


@api.get("/admin/testimonials")
async def admin_testimonials(_: dict = Depends(require_admin)):
    items = await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for t in items:
        if isinstance(t.get("created_at"), datetime):
            t["created_at"] = t["created_at"].isoformat()
    return items


@api.patch("/admin/testimonials/{tid}/approve")
async def admin_approve_testimonial(tid: str, _: dict = Depends(require_admin)):
    r = await db.testimonials.update_one({"id": tid}, {"$set": {"approved": True}})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api.delete("/admin/testimonials/{tid}")
async def admin_delete_testimonial(tid: str, _: dict = Depends(require_admin)):
    await db.testimonials.delete_one({"id": tid})
    return {"ok": True}


@api.post("/admin/assignments")
async def admin_assign(data: AssignmentIn, _: dict = Depends(require_admin)):
    student = await db.users.find_one({"user_id": data.student_user_id})
    mod = await db.modules.find_one({"id": data.module_id})
    if not student or not mod:
        raise HTTPException(404, "Student or module not found")
    doc = {
        "id": str(uuid.uuid4()),
        "student_user_id": data.student_user_id,
        "tutor_user_id": data.tutor_user_id,
        "module_id": data.module_id,
        "created_at": datetime.now(timezone.utc),
    }
    await db.enrollments.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api.delete("/admin/assignments/{enrollment_id}")
async def admin_unassign(enrollment_id: str, _: dict = Depends(require_admin)):
    await db.enrollments.delete_one({"id": enrollment_id})
    return {"ok": True}


@api.get("/admin/all-tutors")
async def admin_all_tutor_users(_: dict = Depends(require_admin)):
    users = await db.users.find({"role": "tutor"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for u in users:
        if isinstance(u.get("created_at"), datetime):
            u["created_at"] = u["created_at"].isoformat()
    return users


@api.get("/admin/subscriptions")
async def admin_subscriptions(_: dict = Depends(require_admin)):
    subs = await db.subscriptions.find({}, {"_id": 0}).to_list(1000)
    for s in subs:
        for k in ("started_at", "next_payment_date", "cancelled_at"):
            if isinstance(s.get(k), datetime):
                s[k] = s[k].isoformat()
        user = await db.users.find_one({"user_id": s["user_id"]}, {"_id": 0, "password_hash": 0})
        s["user"] = {"email": user["email"], "name": user["name"]} if user else None
    return subs


@api.get("/admin/analytics")
async def admin_analytics(_: dict = Depends(require_admin)):
    total_students = await db.users.count_documents({"role": {"$in": ["student_highschool", "student_university"]}})
    total_tutors = await db.users.count_documents({"role": "tutor"})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    pending_tutor_apps = await db.tutor_applications.count_documents({"status": "pending"})
    pending_testimonials = await db.testimonials.count_documents({"approved": False})

    # Revenue: sum of paid payments
    cursor = db.payments.aggregate([
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_zar"}}},
    ])
    revenue = 0
    async for row in cursor:
        revenue = row.get("total", 0)

    # Monthly signups for last 6 months
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    signups = await db.users.find(
        {"created_at": {"$gte": six_months_ago}}, {"_id": 0, "created_at": 1}
    ).to_list(10000)
    buckets = {}
    for u in signups:
        d = u["created_at"]
        if isinstance(d, str):
            d = datetime.fromisoformat(d)
        key = d.strftime("%Y-%m")
        buckets[key] = buckets.get(key, 0) + 1
    monthly = [{"month": k, "signups": v} for k, v in sorted(buckets.items())]

    return {
        "total_students": total_students,
        "total_tutors": total_tutors,
        "active_subscriptions": active_subs,
        "pending_tutor_applications": pending_tutor_apps,
        "pending_testimonials": pending_testimonials,
        "revenue_zar": revenue,
        "monthly_signups": monthly,
    }


@api.get("/admin/contact-messages")
async def admin_contact(_: dict = Depends(require_admin)):
    msgs = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for m in msgs:
        if isinstance(m.get("created_at"), datetime):
            m["created_at"] = m["created_at"].isoformat()
    return msgs


# ---- Admin: Modules CRUD ----
@api.post("/admin/modules")
async def admin_create_module(data: ModuleIn, _: dict = Depends(require_admin)):
    prefix = "hs" if data.level == "high_school" else "uni"
    doc = {"id": f"{prefix}-{uuid.uuid4().hex[:6]}", **data.model_dump()}
    await db.modules.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/admin/modules/{module_id}")
async def admin_update_module(module_id: str, data: ModuleUpdate, _: dict = Depends(require_admin)):
    patch = {k: v for k, v in data.model_dump().items() if v is not None}
    if not patch:
        raise HTTPException(400, "Nothing to update")
    r = await db.modules.update_one({"id": module_id}, {"$set": patch})
    if r.matched_count == 0:
        raise HTTPException(404, "Module not found")
    mod = await db.modules.find_one({"id": module_id}, {"_id": 0})
    return mod


@api.delete("/admin/modules/{module_id}")
async def admin_delete_module(module_id: str, _: dict = Depends(require_admin)):
    r = await db.modules.delete_one({"id": module_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "Module not found")
    # Cascade-clean enrollments
    await db.enrollments.delete_many({"module_id": module_id})
    return {"ok": True}


# ---- Admin: Pricing plans CRUD ----
@api.post("/admin/pricing")
async def admin_create_plan(data: PricingIn, _: dict = Depends(require_admin)):
    prefix = "plan-hs" if data.audience == "high_school" else "plan-uni"
    doc = {"id": f"{prefix}-{uuid.uuid4().hex[:6]}", **data.model_dump()}
    await db.pricing_plans.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.patch("/admin/pricing/{plan_id}")
async def admin_update_plan(plan_id: str, data: PricingUpdate, _: dict = Depends(require_admin)):
    patch = {k: v for k, v in data.model_dump().items() if v is not None}
    if not patch:
        raise HTTPException(400, "Nothing to update")
    r = await db.pricing_plans.update_one({"id": plan_id}, {"$set": patch})
    if r.matched_count == 0:
        raise HTTPException(404, "Plan not found")
    plan = await db.pricing_plans.find_one({"id": plan_id}, {"_id": 0})
    return plan


@api.delete("/admin/pricing/{plan_id}")
async def admin_delete_plan(plan_id: str, _: dict = Depends(require_admin)):
    r = await db.pricing_plans.delete_one({"id": plan_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "Plan not found")
    return {"ok": True}


# -----------------------------------------------------------------------------
# Startup: seed admin/demo data + indexes
# -----------------------------------------------------------------------------
DEFAULT_MODULES = [
    # High school
    {"id": "hs-math", "level": "high_school", "code": "HS-MAT", "name": "Mathematics", "description": "CAPS-aligned Grades 8–12 Mathematics.", "grade_range": "8–12"},
    {"id": "hs-phys", "level": "high_school", "code": "HS-PHY", "name": "Physical Sciences", "description": "CAPS-aligned Grades 10–12 Physical Sciences.", "grade_range": "10–12"},
    {"id": "hs-life", "level": "high_school", "code": "HS-LIF", "name": "Life Sciences", "description": "CAPS-aligned Grades 10–12 Life Sciences.", "grade_range": "10–12"},
    # University
    {"id": "uni-math", "level": "university", "code": "UNI-MAT", "name": "Mathematics (Calculus & Linear Algebra)", "description": "First- and second-year university mathematics."},
    {"id": "uni-stats", "level": "university", "code": "UNI-STA", "name": "Statistics", "description": "Probability, inference and applied statistics."},
    {"id": "uni-cs", "level": "university", "code": "UNI-CSC", "name": "Computer Science", "description": "Programming, data structures and algorithms."},
    {"id": "uni-chem", "level": "university", "code": "UNI-CHE", "name": "Chemistry", "description": "General and organic chemistry foundations."},
]

DEFAULT_PLANS = [
    {"id": "plan-hs-basic", "name": "High School • Essentials", "audience": "high_school", "price_zar": 499, "period": "month", "order": 1, "features": ["2 live lessons / week", "Homework help via chat", "Monthly progress report", "CAPS-aligned resources"], "popular": False},
    {"id": "plan-hs-premium", "name": "High School • Premium", "audience": "high_school", "price_zar": 899, "period": "month", "order": 2, "features": ["4 live lessons / week", "1-on-1 tutor assignment", "Weekly progress report", "Exam prep packs", "Priority WhatsApp support"], "popular": True},
    {"id": "plan-uni-core", "name": "University • Core", "audience": "university", "price_zar": 1299, "period": "month", "order": 3, "features": ["1 module, 4 sessions / month", "1-on-1 tutor matching", "Assignment help", "Past paper walkthroughs"], "popular": False},
    {"id": "plan-uni-scholar", "name": "University • Scholar", "audience": "university", "price_zar": 2199, "period": "month", "order": 4, "features": ["Up to 2 modules", "8 sessions / month", "Weekly tutor check-ins", "Priority bookings", "Exam week intensives"], "popular": False},
]

DEFAULT_TESTIMONIALS = [
    {"id": str(uuid.uuid4()), "name": "Lethabo M.", "program": "Grade 12 Mathematics", "rating": 5, "message": "My marks jumped from 52% to 78% in one term. The tutors actually care.", "approved": True, "created_at": datetime.now(timezone.utc)},
    {"id": str(uuid.uuid4()), "name": "Sibusiso K.", "program": "UJ • MAT01A1", "rating": 5, "message": "Excel Tutoring helped me pass Calculus with a distinction. Worth every cent.", "approved": True, "created_at": datetime.now(timezone.utc)},
    {"id": str(uuid.uuid4()), "name": "Amahle N.", "program": "Grade 11 Physical Sciences", "rating": 4, "message": "The weekly lessons are structured and the tutors answer questions quickly on WhatsApp.", "approved": True, "created_at": datetime.now(timezone.utc)},
    {"id": str(uuid.uuid4()), "name": "Thabo R.", "program": "Wits • STA1000", "rating": 5, "message": "Finally understood hypothesis testing. Great tutor, great explanations.", "approved": True, "created_at": datetime.now(timezone.utc)},
]


async def seed():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.modules.create_index("id", unique=True)
    await db.pricing_plans.create_index("id", unique=True)

    # Admin
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "name": "Excel Admin",
            "role": "admin",
            "auth_provider": "email",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")
    else:
        if not verify_password(ADMIN_PASSWORD, admin.get("password_hash", "")):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin"}},
            )

    # Demo students
    for email, role in [("student.hs@test.com", "student_highschool"), ("student.uni@test.com", "student_university")]:
        ex = await db.users.find_one({"email": email})
        if not ex:
            await db.users.insert_one({
                "user_id": f"user_{uuid.uuid4().hex[:12]}",
                "email": email,
                "name": "Demo " + ("HS Student" if "hs" in email else "Uni Student"),
                "role": role,
                "auth_provider": "email",
                "password_hash": hash_password("Student123!"),
                "created_at": datetime.now(timezone.utc),
            })

    # Modules
    for m in DEFAULT_MODULES:
        await db.modules.update_one({"id": m["id"]}, {"$setOnInsert": m}, upsert=True)

    # Pricing
    for p in DEFAULT_PLANS:
        await db.pricing_plans.update_one({"id": p["id"]}, {"$set": p}, upsert=True)

    # Testimonials (seed once)
    count = await db.testimonials.count_documents({})
    if count == 0:
        await db.testimonials.insert_many(DEFAULT_TESTIMONIALS)


@app.on_event("startup")
async def startup_event():
    await seed()


@app.on_event("shutdown")
async def shutdown_event():
    client.close()


@api.get("/health")
async def health():
    return {"ok": True, "time": datetime.now(timezone.utc).isoformat()}


app.include_router(api)
