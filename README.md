# HospitalFlow — Room-Readiness Coordination Prototype

HospitalFlow is a responsive operational prototype designed for hospital room-turnaround and bed-readiness coordination in India. It streamlines the critical operational interval between patient discharge and new patient admission across **Operations**, **Nursing**, **Billing / TPA**, **Housekeeping**, and **Floor Coordinators**.

---

## 1. Architecture & Design Decisions

- **Architecture:** Client-side Single Page Application built with **React 19 + TypeScript + Vite**.
- **State Management & Persistence:**
  - Workflow records are scoped to a facility in Firestore at `facilities/{facilityId}/workflows/{workflowId}`.
  - Bed inspection images are stored in facility-scoped Firebase Storage; only workflow metadata is kept in Firestore.
  - There is no browser-storage fallback or automatic migration of older localStorage/IndexedDB demo records.
- **Identity:** Firebase Email/Password Authentication with administrator-provisioned facility profiles at `users/{uid}`. Self-registration and client-side role assignment are disabled.
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
> **Prototype Data Boundary:** Use synthetic data only. Firebase Authentication and facility-scoped Firestore/Storage rules are implemented, but they do not make this prototype production-ready or suitable for patient, staff, or clinical data. Uploaded images are not inspected for people, records, screens, or other identifiers. Retention cleanup is client-triggered and is not a guaranteed server-side deletion schedule. Review [docs/security-and-privacy.md](./docs/security-and-privacy.md) before use.

---

## 3. Exact Windows Steps to Run Locally

### Prerequisites
- Node.js 20.19+ or 22.12+
- Windows PowerShell or Command Prompt

### Step-by-Step Instructions

1. Create a Firebase project and Web App, enable **Email/Password** in Firebase Authentication, create a **Firestore Standard** database, and enable Firebase Storage. The repository currently targets project ID `hospital-flow-98023`; no cloud resources or accounts are provisioned automatically.

2. In Firebase Authentication, create an account for each authorized demo user. From the Firebase Console or a trusted Admin SDK environment, provision a matching Firestore document at `users/{uid}`:
   ```json
   {
     "facilityId": "demo-hospital",
     "facilityName": "Demo Hospital",
     "role": "admin"
   }
   ```
   Use a role from the supported role list in `src/context/FirebaseSessionContext.tsx`. Never allow the browser to create or edit this document.

3. From the project root, deploy the Firebase security rules after reviewing them:
   ```powershell
   npx firebase-tools deploy --only firestore:rules,storage
   ```
   The Firebase CLI must be installed/authenticated and pointed at the selected project. Rules are not emulator-tested as part of this repository's build.

4. Open PowerShell and navigate to the project directory:
   ```powershell
   cd "g:\hospital flow"
   ```

5. Copy `.env.example` to `.env.local` and fill in the Firebase Web App values from Firebase Console → Project settings. The project ID should remain `hospital-flow-98023` unless the Firebase configuration and `.firebaserc` are intentionally changed. Keep `.env.local` out of source control.

6. Install dependencies:
   ```powershell
   npm install
   ```

7. Start the Vite local development server:
   ```powershell
   npm run dev
   ```

8. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *(Or the port displayed in your terminal)*

9. To build and preview production assets:
   ```powershell
   npm run build
   npm run preview
   ```

For a Vercel build, add the same `VITE_FIREBASE_*` values as project environment variables before deployment. Without them, the deployed app remains on the Firebase setup gate. Never add service-account credentials or other privileged keys to Vite variables.

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
   - Either click **`Capture / Upload Bed Photo`** to select an image from your device, or click **`Use Synthetic Room Photo (Demo)`** to generate an illustrative image and upload it to Firebase Storage.
5. **Coordinator Review:**
   - The case transitions to **Awaiting Coordinator Approval**.
   - Review the photo preview loaded from Firebase Storage, the capture timestamp, and the pending-review expiry countdown.
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
   - The rejected image is **immediately deleted from Firebase Storage** (verifiable in Demo Controls: photo count decrements).
   - The case returns to **Re-clean Requested** state.
   - Housekeeping can upload a replacement photo.

### Scenario C: Verifying 48-Hour Retention & Automatic Purge
1. Open a case marked **Bed Ready**.
2. Observe the demo control button: **`Delete Photo Now (Demo Control)`**.
3. Click **`Delete Photo Now (Demo Control)`**.
4. **Verify:**
   - The photo object is immediately deleted from Firebase Storage.
   - The preview updates to a permanent placeholder: *"Photo permanently purged per 48h retention policy. Approval status preserved."*
   - The bed remains marked **Bed Ready**.
   - The **Operational Event History** maintains the approval record and logs a retention purge event.
5. Alternatively, open **`Demo Controls`** in the header and click **`+48 Hours`** or **`+7 Days`** to simulate automatic scheduled expiration.

---

## 5. Scope & Remaining Production Needs

The `/occupancy` workspace includes a synthetic ward bed board, occupancy metrics, cleaning crew assignment, cleaning completion, readiness review/re-clean transitions, and a recent activity feed. Changes are stored in the same facility-scoped Firestore workflow store as the other scenarios.

Current limitations include coarse facility-wide write access for non-viewer roles (the UI role controls are not server authorization), synthetic/demo crew records, no staff/bed directory synchronization, and client-triggered photo retention checks. These workflows are not connected to a hospital information system or verified clinical source of truth.

## 6. Architecture, Privacy & Integration Readiness

Repository reconnaissance, current limitations, and a staged path toward secure backend and ABDM sandbox work are documented in [`docs/architecture-assessment.md`](./docs/architecture-assessment.md), [`docs/security-and-privacy.md`](./docs/security-and-privacy.md), and the other readiness documents under [`docs/`](./docs/).

HospitalFlow now requires Firebase sign-in and an administrator-provisioned profile when configured. It is **not** production-ready for patient data, ABDM-integrated, certified, or legally approved. See [docs/security-and-privacy.md](./docs/security-and-privacy.md) for the current implementation boundary and outstanding controls.
