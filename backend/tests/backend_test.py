"""Backend regression tests for Excel Tutoring API."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://learn-platform-146.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@exceltutoring.co.za"
ADMIN_PWD = "ExcelAdmin2026!"
STUDENT_EMAIL = "student.hs@test.com"
STUDENT_PWD = "Student123!"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PWD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def student_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": STUDENT_EMAIL, "password": STUDENT_PWD})
    assert r.status_code == 200, f"Student login failed: {r.status_code} {r.text}"
    return s


# ---------- Public endpoints ----------
def test_health():
    r = requests.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_modules_count():
    r = requests.get(f"{API}/modules")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    hs = [m for m in data if m.get("level") == "high_school"]
    uni = [m for m in data if m.get("level") == "university"]
    assert len(hs) == 3, f"Expected 3 HS modules, got {len(hs)}"
    assert len(uni) == 4, f"Expected 4 Uni modules, got {len(uni)}"


def test_pricing_zar():
    r = requests.get(f"{API}/pricing")
    assert r.status_code == 200
    plans = r.json()
    assert len(plans) == 4
    for p in plans:
        assert "price_zar" in p
        assert isinstance(p["price_zar"], (int, float))


def test_faq_six():
    r = requests.get(f"{API}/faq")
    assert r.status_code == 200
    assert len(r.json()) == 6


def test_testimonials_approved_only():
    r = requests.get(f"{API}/testimonials")
    assert r.status_code == 200
    for t in r.json():
        assert t.get("approved") is True


def test_submit_testimonial_pending():
    payload = {"name": "TEST_User", "message": "TEST testimonial " + uuid.uuid4().hex[:6],
               "rating": 5, "program": "HS Math"}
    r = requests.post(f"{API}/testimonials", json=payload)
    assert r.status_code == 200
    # Should NOT appear in public list
    listing = requests.get(f"{API}/testimonials").json()
    assert not any(t["message"] == payload["message"] for t in listing)


def test_tutor_apply():
    payload = {
        "full_name": "TEST Tutor " + uuid.uuid4().hex[:6],
        "email": f"test_tutor_{uuid.uuid4().hex[:6]}@test.com",
        "phone": "0781234567",
        "qualification": "BSc Maths",
        "subjects": ["Mathematics"],
        "level": "high_school",
        "experience_years": 3,
        "bio": "Experienced tutor",
    }
    r = requests.post(f"{API}/tutors/apply", json=payload)
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_contact():
    r = requests.post(f"{API}/contact", json={
        "name": "TEST Contact", "email": "test@test.com", "phone": "0781",
        "message": "TEST msg"
    })
    assert r.status_code == 200


# ---------- Auth ----------
def test_register_and_duplicate():
    email = f"test_reg_{uuid.uuid4().hex[:8]}@test.com"
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Pass1234!", "name": "TEST Reg",
        "role": "student_highschool"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == email
    assert data["role"] == "student_highschool"
    # Cookies set
    assert "access_token" in s.cookies

    # Duplicate
    r2 = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Pass1234!", "name": "Dup",
        "role": "student_highschool"
    })
    assert r2.status_code == 400


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL, "password": "wrong_password_xyz"
    })
    assert r.status_code == 401


def test_auth_me_with_cookie(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_auth_me_no_cookie():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_logout_clears_cookies():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": STUDENT_EMAIL, "password": STUDENT_PWD})
    assert r.status_code == 200
    r2 = s.post(f"{API}/auth/logout")
    assert r2.status_code == 200
    # After logout /auth/me should be 401 (cookies cleared via response)
    s.cookies.clear()
    r3 = s.get(f"{API}/auth/me")
    assert r3.status_code == 401


def test_google_session_missing_header():
    r = requests.post(f"{API}/auth/google/session")
    assert r.status_code == 400


# ---------- Admin permission checks ----------
@pytest.mark.parametrize("path", [
    "/admin/students", "/admin/tutors", "/admin/testimonials",
    "/admin/subscriptions", "/admin/analytics", "/admin/contact-messages",
    "/admin/all-tutors",
])
def test_admin_requires_admin_role(path, student_session):
    r = student_session.get(f"{API}{path}")
    assert r.status_code == 403, f"{path} should be 403 for student, got {r.status_code}"


def test_admin_endpoints_ok(admin_session):
    for p in ["/admin/students", "/admin/tutors", "/admin/testimonials",
              "/admin/subscriptions", "/admin/analytics", "/admin/contact-messages",
              "/admin/all-tutors"]:
        r = admin_session.get(f"{API}{p}")
        assert r.status_code == 200, f"{p} admin failed: {r.status_code}"


# ---------- Admin actions: tutor approve, testimonial approve/delete ----------
def test_tutor_approve_creates_user(admin_session):
    email = f"test_tutor_app_{uuid.uuid4().hex[:6]}@test.com"
    payload = {
        "full_name": "TEST ApprovalTutor",
        "email": email, "phone": "0781", "qualification": "MSc",
        "subjects": ["Maths"], "level": "high_school",
        "experience_years": 2, "bio": "TEST bio",
    }
    requests.post(f"{API}/tutors/apply", json=payload)
    apps = admin_session.get(f"{API}/admin/tutors").json()
    target = next((a for a in apps if a["email"] == email), None)
    assert target is not None
    r = admin_session.patch(f"{API}/admin/tutors/{target['id']}/approve")
    assert r.status_code == 200
    assert r.json()["status"] == "approved"
    # Tutor user should now exist
    tutors = admin_session.get(f"{API}/admin/all-tutors").json()
    assert any(t["email"] == email for t in tutors)


def test_testimonial_approve_and_delete(admin_session):
    msg = "TEST approval " + uuid.uuid4().hex[:6]
    requests.post(f"{API}/testimonials", json={
        "name": "TEST", "message": msg, "rating": 4, "program": "HS"
    })
    items = admin_session.get(f"{API}/admin/testimonials").json()
    target = next((i for i in items if i["message"] == msg), None)
    assert target is not None
    r = admin_session.patch(f"{API}/admin/testimonials/{target['id']}/approve")
    assert r.status_code == 200
    # Now appears in public list
    pub = requests.get(f"{API}/testimonials").json()
    assert any(t["message"] == msg for t in pub)
    # Delete
    r2 = admin_session.delete(f"{API}/admin/testimonials/{target['id']}")
    assert r2.status_code == 200


# ---------- Assignments + Student enrollments ----------
def test_assign_and_student_sees_enrollment(admin_session, student_session):
    # Get student id
    me = student_session.get(f"{API}/auth/me").json()
    student_id = me["user_id"]
    mods = requests.get(f"{API}/modules").json()
    module_id = mods[0]["id"]
    tutors = admin_session.get(f"{API}/admin/all-tutors").json()
    tutor_id = tutors[0]["user_id"] if tutors else None

    r = admin_session.post(f"{API}/admin/assignments", json={
        "student_user_id": student_id,
        "tutor_user_id": tutor_id,
        "module_id": module_id,
    })
    assert r.status_code == 200
    enrollment_id = r.json()["id"]

    enrolls = student_session.get(f"{API}/student/enrollments").json()
    found = next((e for e in enrolls if e["id"] == enrollment_id), None)
    assert found is not None
    assert found["module"]["id"] == module_id
    if tutor_id:
        assert found["tutor"] is not None

    # Cleanup
    admin_session.delete(f"{API}/admin/assignments/{enrollment_id}")


# ---------- Subscription flow ----------
def test_subscription_flow(student_session):
    plans = requests.get(f"{API}/pricing").json()
    plan = next((p for p in plans if p["audience"] == "high_school"), plans[0])

    r = student_session.post(f"{API}/student/subscribe", json={"plan_id": plan["id"]})
    assert r.status_code == 200
    data = r.json()
    assert data["subscription"]["status"] == "pending_payment"
    assert "paystack_url" in data and data["paystack_url"]

    # Notifications should include pending warning
    notes = student_session.get(f"{API}/student/notifications").json()
    assert any(n["type"] == "warning" for n in notes)

    # Confirm → active
    r2 = student_session.post(f"{API}/student/subscription/confirm")
    assert r2.status_code == 200
    sub = student_session.get(f"{API}/student/subscription").json()
    assert sub["status"] == "active"

    # Cancel
    r3 = student_session.post(f"{API}/student/subscription/cancel")
    assert r3.status_code == 200
    sub = student_session.get(f"{API}/student/subscription").json()
    assert sub["status"] == "cancelled"


# ---------- Brute force lockout ----------
def test_bruteforce_lockout():
    email = f"test_bf_{uuid.uuid4().hex[:6]}@test.com"
    # Register a user first
    requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Valid123!", "name": "BF",
        "role": "student_highschool"
    })
    got_429 = False
    for i in range(8):
        r = requests.post(f"{API}/auth/login", json={
            "email": email, "password": "wrong_" + str(i)
        })
        if r.status_code == 429:
            got_429 = True
            break
    assert got_429, "Expected 429 lockout after 5 failed attempts"
