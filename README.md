# HospitalFlow — Room-Readiness Coordination Prototype

HospitalFlow is a responsive operational prototype designed for hospital room-turnaround and bed-readiness coordination in India. It streamlines the critical operational interval between patient discharge and new patient admission across **Operations**, **Nursing**, **Billing / TPA**, **Housekeeping**, and **Floor Coordinators**.

---

## 1. Architecture & Design Decisions

- **Architecture:** Client-side Single Page Application built with **React 19 + TypeScript + Vite**.
- **State Management & Persistence:**
  - Case metadata, checklists, and audit events are persisted in `localStorage` (`hospitalflow_cases_v1`).
  - Bed inspection photos are stored exclusively as `Blob` objects in client-side **IndexedDB** (`hospitalflow_db / photos` store). Photo binaries or Base64 data URLs are **never** stored in `localStorage`.
- **UI & Palette:** Calm operational SaaS interface adhering to the specified design system:
  - Deep navy text (`#0f172a`, `#1e293b`)
  - Restrained teal action accents (`#0f766e`, `#0d9488`)
  - Neutral backgrounds (`#f8fafc`, `#f1f5f9`, border `#e2e8f0`)
  - Amber for waiting / coordinator review queue (`#d97706`, `#fef3c7`)
  - Red strictly reserved for rejection notices and photo deletion (`#dc2626`, `#fee2e2`)
  - Green for completed checklists and Bed Ready status (`#15803d`, `#dcfce7`)
  - Visible text labels paired with status badges (not relying on color alone).
  - Responsive down to 320px phone widths with touch targets ≥ 44px, keyboard navigation, and `prefers-reduced-motion` compliance.

---

## 2. Operational & Security Boundaries

> [!IMPORTANT]
> **Strict Prototype Data Boundary:**
> - **Zero PII / PHI:** Never captures or stores patient names, telephone numbers, Ayushman Bharat Health Account (ABHA) IDs, diagnoses, insurance member policy numbers, or clinical documentation.
> - **Physical Coordinates Only:** Tracks operational references (`HF-XXXX`), ward labels (e.g. `Ward 4B (Stepdown ICU)`), room numbers (`Room 402`), and bed coordinates (`Bed 1`).
> - **Local Retention Mechanism:** Browser IndexedDB is used strictly as a local demo retention simulator. It does **not** provide cryptographic deletion guarantees or erasure from browser internals, process dumps, or local OS device backups.
> - **Audit Trail Sanitization:** Application logs, event histories, and approval notices record only the case reference, actor label (`Coordinator (Simulated)`), ISO timestamp, and status. **Zero image bytes, file names, or Object URLs are retained in the audit history.**
> - **File Validation:** Restricts uploads to JPEG, PNG, and WebP images up to 10 MB.
> - **Idempotent Deletion:** Deletion routines handle storage errors visibly and succeed idempotently without reporting false positives.

---

## 3. Exact Windows Steps to Run Locally

### Prerequisites
- Node.js (v18+ or v24+ recommended)
- Windows PowerShell or Command Prompt

### Step-by-Step Instructions

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "g:\hospital flow"
   ```

2. Install dependencies (already pre-installed in workspace):
   ```powershell
   npm install
   ```

3. Start the Vite local development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *(Or the port displayed in your terminal)*

5. To build and preview production assets:
   ```powershell
   npm run build
   npm run preview
   ```

---

## 4. Manual Walkthrough & Workflow Verification

### Scenario A: Full Lifecycle from Creation to Bed Ready
1. **Create Case:** Click the **`+ Create Case`** button in the top navigation. Note the random synthetic reference (`HF-XXXX`). Select an operational ward (e.g., `Ward 4B (Stepdown ICU)`), room, bed, and priority. Click **Create Turnaround Case**.
2. **Complete Handoffs:** In the case detail panel:
   - Click **`Mark Complete`** on **Nursing Handoff** (confirms chart reconciliation).
   - Click **`Mark Complete`** on **Billing / TPA Clearance** (operational placeholder).
   - *(Note: Billing can also be toggled optional via the **Settings** modal).*
3. **Confirm Departure:** Once handoffs are satisfied, the **`Confirm Room Departure & Start Housekeeping`** button becomes enabled. Click it. The previous occupant is recorded as departed, and the bed enters the Housekeeping queue.
4. **Housekeeping Cleaning & Photo Upload:**
   - Under Step 3, note the prominent **Privacy Reminder Banner** (*"Frame only the room/bed area. Never photograph patients, healthcare workers, medical records, or screens"*).
   - Click **`Start Bed Sanitisation`**.
   - Either click **`Capture / Upload Bed Photo`** to select an image from your device, or click **`Use Synthetic Room Photo (Demo)`** to instantly generate an operational SVG bed image directly into IndexedDB.
5. **Coordinator Review:**
   - The case transitions to **Awaiting Coordinator Approval**.
   - Review the photo preview loaded directly from IndexedDB, the capture timestamp, and the pending-review expiry countdown.
   - Click **`Approve Bed Ready`**.
   - The case status updates to **Bed Ready** with an approval seal.
   - An approval notice is posted in the **Operational Event History** containing the case reference, approver label (`Coordinator (Simulated)`), timestamp, and approved status (with **no photo URLs or binary bytes** in the log).
   - Retention countdown is automatically scheduled for **48 hours**.

### Scenario B: Testing Rejection & Re-clean Workflow
1. Select an active case in **Awaiting Coordinator Approval** (or upload a photo on a new case).
2. Click **`Request Re-clean / New Photo`**.
3. Select a rejection category (e.g., *"Linen unmade, wrinkled or stained"* or *"Privacy violation: Person, document, or monitor visible"*).
4. Enter an optional operational note and click **`Confirm Rejection & Delete Photo`**.
5. **Verify:**
   - The rejected image is **immediately deleted from IndexedDB** (verifiable in Demo Controls: photo count decrements).
   - The case returns to **Re-clean Requested** state.
   - Housekeeping can upload a replacement photo.

### Scenario C: Verifying 48-Hour Retention & Automatic Purge
1. Open a case marked **Bed Ready**.
2. Observe the demo control button: **`Delete Photo Now (Demo Control)`**.
3. Click **`Delete Photo Now (Demo Control)`**.
4. **Verify:**
   - The photo blob is immediately deleted from IndexedDB.
   - The preview updates to a permanent placeholder: *"Photo permanently purged per 48h retention policy. Approval status preserved."*
   - The bed remains marked **Bed Ready**.
   - The **Operational Event History** maintains the approval record and logs a retention purge event.
5. Alternatively, open **`Demo Controls`** in the header and click **`+48 Hours`** or **`+7 Days`** to simulate automatic scheduled expiration.

---

## 5. Scope & Remaining Production Needs

This prototype intentionally isolates room-readiness workflows from clinical, identity, and infrastructure systems. The following items are explicitly **not included** in this version:

1. **Authentication & Role-Based Access Control (RBAC):** All user actions (Operations, Nursing, Housekeeping, Coordinator) are accessible from a shared interface for demo convenience. Roles will be introduced in future phases.
2. **True Cryptographic Storage Deletion:** Browser IndexedDB is an application-level cache. Production deployments will use cloud Object Lifecycle Policies (e.g. AWS S3 Lifecycle / Google Cloud Storage auto-delete rules) with audit logs in compliance with Indian healthcare regulations (DISHA / NDHM / DPDP Act 2023).
3. **Live Integrations:** Real-world hospital deployments require integrations with Hospital Information Systems (HIS), Electronic Medical Records (EMR), Admission-Discharge-Transfer (ADT) HL7/FHIR feeds, and WhatsApp/SMS notification gateways.
4. **Offline Sync & Multi-Device Mesh:** The prototype stores data in local browser storage; multi-device sync across physical ward tablets requires a backend synchronization layer.
