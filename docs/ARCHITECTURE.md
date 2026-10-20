# 🏛️ Campus-Share Architecture & Technical Specification

This document details the architectural design, security model, data models, state machines, and WebGL graphics pipeline powering **Campus-Share**.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client Layer (Browser)"]
        UI["Next.js App Router (React 19 + TypeScript)"]
        ThreeCanvas["Three.js WebGL CAD Viewer"]
        Tailwind["Tailwind CSS v4 Engineering Theme"]
    end

    subgraph SecurityLayer["Security & Gateway Layer"]
        Middleware["Route Protection & Session Proxy"]
        UnivValidator["Universal Academic Email Validator"]
        NextAuth["NextAuth.js v4 (JWT + RBAC Session)"]
    end

    subgraph BackendLayer["Server & Route Handler Layer"]
        AuthRoutes["/api/auth (Register, Session, Logout)"]
        HwRoutes["/api/hardware (CRUD & Status)"]
        TxEngine["/api/transactions (Double-Booking Prevention)"]
        CadRoutes["/api/cad (Mesh Tracking & Download Analytics)"]
    end

    subgraph DataLayer["Persistence & Storage Layer"]
        Prisma["Prisma ORM Client Singleton"]
        SQLite[("Relational Database (SQLite / PostgreSQL)")]
        MeshStorage["/public/cad-models (ASCII & Binary STL Meshes)"]
    end

    UI --> Middleware
    ThreeCanvas --> MeshStorage
    Middleware --> NextAuth
    NextAuth --> UnivValidator
    NextAuth --> AuthRoutes
    UI --> BackendLayer
    BackendLayer --> Prisma
    Prisma --> SQLite
```

---

## 2. Hardware Booking & Handover State Machine

Hardware components on campus transition through a strict state machine to prevent loss, record equipment health, and dynamically update student trust scores without monetary barriers.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Borrower requests hardware for dates [Start, End]
    
    state PENDING {
        description: Backend executes double-booking conflict check
    }

    PENDING --> REJECTED: Lender denies or schedule conflicts
    REJECTED --> [*]

    PENDING --> APPROVED: Lender approves & designates campus meetup spot (e.g. Maker Hub)
    
    APPROVED --> CHECKED_OUT: Both parties confirm physical meetup (condition logged)
    
    CHECKED_OUT --> RETURNED: Hardware returned intact (+15 Trust Points awarded)
    CHECKED_OUT --> OVERDUE: Return window elapsed without return (-15 Trust Points)
    
    OVERDUE --> RETURNED: Late return processed with deduction
    
    RETURNED --> [*]
```

### Double-Booking Mathematical Validation
A reservation request $[S_{req}, E_{req}]$ is accepted if and only if:
$$\forall \text{ active booking } [S_i, E_i] \subset \text{Item}, \quad (S_{req} \ge E_i) \lor (E_{req} \le S_i)$$

If $(S_{req} < E_i) \land (E_{req} > S_i)$, the API returns `HTTP 409 Conflict`.

---

## 3. Database Entity Relationship Model (Prisma)

```mermaid
erDiagram
    User ||--o{ HardwareItem : "owns / lists"
    User ||--o{ RentalTransaction : "borrows"
    User ||--o{ CadResource : "authors / uploads"
    HardwareItem ||--o{ RentalTransaction : "reserved in"

    User {
        String id PK
        String name
        String email UK
        String usn UK
        String department
        Int semester
        String phone
        String passwordHash
        Role role "STUDENT | LAB_ADMIN"
        Int trustScore "Default 100"
        Boolean isVerified
        DateTime createdAt
    }

    HardwareItem {
        String id PK
        String title
        String category "Embedded Boards | Sensors | Motors | Tools"
        String specs "JSON String"
        String condition "NEW | GOOD | FAIR"
        Float maintenanceFee "Default 0"
        Float securityDeposit "Default 0"
        String campusLocation
        String status "AVAILABLE | BOOKED | MAINTENANCE"
        String ownerId FK
        DateTime createdAt
    }

    RentalTransaction {
        String id PK
        String hardwareId FK
        String borrowerId FK
        DateTime startDate
        DateTime endDate
        String status "PENDING | APPROVED | CHECKED_OUT | RETURNED | OVERDUE"
        String meetupSpot
        String handoverNotes
        DateTime createdAt
    }

    CadResource {
        String id PK
        String title
        String description
        String fileUrl
        String previewMeshUrl
        String fileFormat "STL | STEP | OBJ | SCRIPT"
        String softwareUsed
        String materialRecommendation
        Int downloadsCount
        String uploaderId FK
        DateTime createdAt
    }
```

---

## 4. In-Browser 3D CAD WebGL Engine (`<CadCanvasViewer />`)

The CAD hub provides real-time browser previewing of mechanical files before downloading:
1. **Mesh Ingestion:** Lightweight Three.js canvas fetches `.stl` files via streaming `ArrayBuffer`.
2. **Parser Pipeline:**
   - Detects ASCII vs. Binary STL formats.
   - Calculates vertex normals and face indices.
   - Computes accurate millimeter bounding box dimensions ($X \times Y \times Z\text{ mm}$).
   - Extracts exact facet / triangle polygon counts.
3. **Viewport Controls:**
   - Orbit controls (left-click rotation, right-click pan, scroll zoom).
   - Dynamic wireframe overlay mesh with independent materials.
   - Procedural rotation toggle with animation frame damping.
   - Color grading: *Blueprint Blue (`#0284c7`), Carbon Fiber (`#334155`), PLA Orange (`#f97316`), Bio-Emerald (`#10b981`), Titanium White (`#f8fafc`)*.

---

## 5. Campus Trust Score Economics

Rather than charging commercial deposits, **Campus-Share** employs an institutional trust credit system:

| Event | Impact | Privilege Effect |
| :--- | :--- | :--- |
| **Account Creation** | Baseline `100 pts` | Access to standard development boards and sensors |
| **On-Time Safe Return** | `+15 pts` | Increases checkout allowance |
| **Contributing Hardware** | `+10 pts` | Priority queueing for campus test instruments |
| **Publishing CAD Models** | `+15 pts` | Community recognition badge |
| **Late Hardware Return** | `-15 pts` | Loss of high-tier instrument reservation rights |
| **Overdue (> 5 Days)** | `-30 pts` | Account flagged for Lab Coordinator review |
| **Score >= 120 pts** | **Tier 1 Honor** | Zero-deposit borrowing on equipment up to ₹10,000 |

---

## 6. Production Deployment Matrix

### Environment Variables Required
```env
DATABASE_URL="postgresql://user:pass@host:5432/campus_share?sslmode=require"
NEXTAUTH_SECRET="your-32-character-secret"
NEXTAUTH_URL="https://your-domain.edu"
NEXT_PUBLIC_APP_URL="https://your-domain.edu"
ALLOW_ALL_EMAILS="true"
ALLOWED_CAMPUS_DOMAINS=".edu,.ac.in,.edu.in"
GOOGLE_CLIENT_ID="optional-google-client-id"
GOOGLE_CLIENT_SECRET="optional-google-client-secret"
```

### PostgreSQL Migration (for Production)
1. In `prisma/schema.prisma`, update provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Execute migration:
   ```bash
   npx prisma migrate deploy
   ```
3. Deploy frontend and API to **Vercel**, **AWS Amplify**, or **Railway**.
