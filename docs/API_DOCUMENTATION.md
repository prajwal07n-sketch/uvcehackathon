# 📡 Campus-Share API Documentation

This document provides a comprehensive specification of the RESTful API endpoints available in the **Campus-Share** platform.

---

## 🔒 Authentication & Role-Based Access Control

The platform uses **NextAuth.js JWT session tokens** stored in HTTP-only cookies (`next-auth.session-token`), alongside server-side role resolution:
- **STUDENT:** Can browse, reserve hardware, confirm handovers, download CAD files, and list resources.
- **LAB_ADMIN:** All Student capabilities plus hardware inventory maintenance toggling, lab calibration management, and system telemetry access.

---

## 📋 Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Create and verify student/faculty profile. |
| `POST` | `/api/auth/callback/credentials` | Public | Authenticate credentials & generate session. |
| `GET` | `/api/auth/me` | Public | Retrieve current active user profile & test accounts. |
| `POST` | `/api/auth/switch` | Public | Instant profile switcher for demo & review mode. |
| `POST` | `/api/auth/logout` | Public | Clear all session cookies, tokens, and storage. |
| `POST` | `/api/auth/onboarding` | Authenticated | Complete student profile (USN, department, phone). |
| `GET` | `/api/hardware` | Public | Query filterable hardware components catalog. |
| `POST` | `/api/hardware` | Authenticated | List a new hardware resource into the campus pool. |
| `GET` | `/api/hardware/:id` | Public | Get hardware details, owner info, and active bookings. |
| `PUT` | `/api/hardware/:id` | Owner / Admin | Update hardware details, status, or maintenance state. |
| `DELETE`| `/api/hardware/:id` | Owner / Admin | Remove a hardware listing from inventory. |
| `GET` | `/api/transactions` | Authenticated | Retrieve active user's borrowed or lent transactions. |
| `POST` | `/api/transactions` | Authenticated | Create a booking request with conflict validation. |
| `PATCH` | `/api/transactions/:id` | Involved Parties | Transition rental status (Approved -> Checked Out -> Returned). |
| `GET` | `/api/cad` | Public | Query open-source CAD models & 3D mesh assets. |
| `POST` | `/api/cad` | Authenticated | Upload and publish a CAD model with manufacturing specs. |
| `GET` | `/api/cad/:id` | Public | Retrieve single CAD model metadata & 3D preview URL. |
| `POST` | `/api/cad/:id/download` | Authenticated | Register download event and increment analytics counter. |
| `POST` | `/api/upload` | Authenticated | Multipart/form-data handler for CAD and images. |
| `GET` | `/api/admin/stats` | `LAB_ADMIN` | Campus equipment metrics, category breakdown & logs. |

---

## 1. Authentication APIs

### `POST /api/auth/register`
Creates a verified academic profile.
- **Request Body:**
  ```json
  {
    "name": "Aditya Rao",
    "email": "aditya@drait.edu.in",
    "usn": "1DA22EC015",
    "department": "Electronics & Communication",
    "semester": 6,
    "phone": "+91 98765 43210",
    "password": "securepassword123",
    "role": "STUDENT"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Institutional account verified and created successfully! Welcome to Campus-Share.",
    "user": {
      "id": "c1f7b8...",
      "name": "Aditya Rao",
      "email": "aditya@drait.edu.in",
      "usn": "1DA22EC015",
      "department": "Electronics & Communication",
      "role": "STUDENT",
      "trustScore": 100,
      "isVerified": true
    }
  }
  ```

### `POST /api/auth/logout`
Explicitly invalidates session cookies and triggers cleanup.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully",
    "redirect": "/auth/signin?loggedOut=true"
  }
  ```

---

## 2. Hardware Resource APIs

### `GET /api/hardware`
Fetches categorized hardware catalog with real-time status.
- **Query Parameters:**
  - `category` (optional): `Embedded Boards`, `Sensors`, `Actuators/Motors`, `Robotics Parts`, `Lab Tools`.
  - `condition` (optional): `NEW`, `GOOD`, `FAIR`.
  - `status` (optional): `AVAILABLE`, `BOOKED`, `MAINTENANCE`.
  - `q` (optional): Text search for title or specs.
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "hw_stm32_nucleo",
        "title": "STM32 Nucleo-F446RE Dev Board",
        "category": "Embedded Boards",
        "specs": "{\"mcu\":\"ARM Cortex-M4 180MHz\",\"flash\":\"512KB\",\"sram\":\"128KB\",\"header\":\"Arduino Uno V3\"}",
        "condition": "GOOD",
        "maintenanceFee": 0,
        "securityDeposit": 0,
        "campusLocation": "Embedded Systems Lab (Room 204)",
        "status": "AVAILABLE",
        "owner": {
          "name": "Dr. M. S. Venkatesh",
          "department": "Electronics & Communication",
          "trustScore": 500
        }
      }
    ]
  }
  ```

### `POST /api/hardware`
Lists a new hardware item into the pool.
- **Request Body:**
  ```json
  {
    "title": "Raspberry Pi 4 Model B (4GB)",
    "category": "Embedded Boards",
    "condition": "GOOD",
    "campusLocation": "IoT Innovation Cell",
    "maintenanceFee": 0,
    "securityDeposit": 0,
    "specs": {
      "ram": "4GB LPDDR4",
      "cpu": "Quad-core Cortex-A72",
      "ports": "2x micro-HDMI, 2x USB 3.0"
    },
    "imageUrl": "https://example.com/image.jpg"
  }
  ```

---

## 3. Booking & Transaction Engine

### `POST /api/transactions`
Validates date availability and reserves a hardware component.
- **Backend Conflict Check:**
  $$\text{Overlap} \iff (Start_{new} < End_{existing}) \land (End_{new} > Start_{existing})$$
- **Request Body:**
  ```json
  {
    "hardwareId": "hw_stm32_nucleo",
    "startDate": "2026-10-25T00:00:00.000Z",
    "endDate": "2026-11-01T00:00:00.000Z",
    "notes": "Required for Capstone Autonomous Rover sensor fusion testing."
  }
  ```
- **Error Response (409 Conflict):**
  ```json
  {
    "error": "This hardware item is already reserved for the selected date window (2026-10-24 to 2026-10-28)."
  }
  ```

### `PATCH /api/transactions/:id`
Progresses the physical handover lifecycle state machine:
$$\text{PENDING} \longrightarrow \text{APPROVED} \longrightarrow \text{CHECKED\_OUT} \longrightarrow \text{RETURNED}$$
- **Request Body:**
  ```json
  {
    "nextStatus": "APPROVED",
    "meetupSpot": "Central Library Maker Hub (Bench 4)",
    "handoverNotes": "Verified intact pins and USB cable."
  }
  ```
- **Trust Score Increment:** Transitioning to `RETURNED` automatically increments borrower's trust score by $+15$ points.

---

## 4. CAD & 3D Repository APIs

### `GET /api/cad`
Queries open-source CAD repository.
- **Query Parameters:**
  - `format` (optional): `STL`, `STEP`, `OBJ`, `SCRIPT`.
  - `q` (optional): Search keywords.
- **Response (200 OK):**
  ```json
  {
    "resources": [
      {
        "id": "cad_cycloidal_drive",
        "title": "10:1 Cycloidal Speed Reducer",
        "fileFormat": "STL",
        "fileUrl": "/cad-models/cycloidal-gearbox.stl",
        "previewMeshUrl": "/cad-models/cycloidal-gearbox.stl",
        "softwareUsed": "SolidWorks / FreeCAD",
        "materialRecommendation": "PETG-CF or Nylon PA12",
        "downloadsCount": 42,
        "uploader": {
          "name": "Priya Nair",
          "department": "Mechanical Engineering"
        }
      }
    ]
  }
  ```

### `POST /api/cad/:id/download`
Registers a download event and increments the asset download counter.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "fileUrl": "/cad-models/cycloidal-gearbox.stl",
    "downloadsCount": 43
  }
  ```
