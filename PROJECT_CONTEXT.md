# NueraLyn - Project Context & Implementation Note

## 1. Project Overview
**NueraLyn** is an AI-powered emotional wellness companion platform. It connects users seeking support with an AI chatbot capable of analyzing emotion and intensity, while optionally routing high-risk scenarios and regular sessions to trained Peer Mentors, Professional Counselors, and partner NGOs.

- **Primary Repository**: `https://github.com/Shyamanth-3/MindBridge`
- **Tech Stack**:
  - **Framework:** React (Vite)
  - **Styling:** Tailwind CSS, Framer Motion (for animations and micro-interactions)
  - **UI/UX Components:** Glassmorphism architectures (`GlassPanel`), shadcn-inspired components, `recharts` for data visualization.
  - **Authentication / Database:** Firebase (Auth, Firestore config moved to `.env`)
  - **Icons:** `lucide-react`
  - **Routing:** `react-router-dom`

---

## 2. Recent Architectural Restructuring (Current Session)
During this session, we transformed the codebase from a flat layout into a standard compartmentalized repository format:
- **`Frontend/`**: Houses the entire active React/Vite application. 
  - Isolated from the root `.git` directory but tracked properly.
  - Contains `.env` to keep Firebase Config keys secure and out of version control.
- **`n-main/`**: A reference folder containing older logic and features from the original iteration. This is explicitly ignored via the root `.gitignore` to keep the MindBridge repository clean.

---

## 3. UI/UX Refinements
The overarching design language was updated to a **Premium, Immersive Dark Aesthetic** featuring deep ambient backgrounds, subtle gold/accent lighting, and interactive depth.

**Key Visual Components Implemented:**
- **3D Wrapper (`Wrapper3D`)**: An interactive Framer Motion container that encases main interface modules (Login forms, Register forms, User Dashboards, and the Chat Bot). It tracks cursor movements to generate a sophisticated, fluid 3D tilting/depth effect.
- **Dynamic Data Insights (`AnimatedCard` & `Visual3`)**: Custom animated SVG components (inspired by Badtz UI) that automatically animate on hover. Integrated into the Chat Bot page to display "Live Session Analytics" instead of previously used Spline orbs or static graphs.
- **Consistent Theming**: Assured that all dashboard layouts (which previously toggled a `light-theme`) strictly adhere to the unified dark styling logic with `bg-[#050505]` and translucent glass panels (`bg-black/40`, `backdrop-blur-md`).

---

## 4. Feature Enhancements
- **Authentication Restrictions**:
  - The Registration process is now **locked to standard Users only** to streamline the onboarding flow. 
  - To support testing and organizational access without disrupting Firebase, an **Authentication Interceptor** was built into `AuthContext.jsx`. It bypasses standard Firebase validation for three mock credentials:
    - Peer Mentor: `peer@nuralyn.com` / `password123`
    - Professional: `pro@nuralyn.com` / `password123`
    - NGO: `ngo@nuralyn.com` / `password123`
- **New User Overview Dashboard (`/dashboard`)**:
  - Users are now greeted with a dedicated 'Overview' landing page rather than exclusively defaulting to the chat interface.
  - Features real-time Weekly Emotional Intensity charts, Quick Actions (AI Companion, Mentor Connect, Activity Log), and Upcoming Mentor Slots preview.
- **Redesigned Chat Interface (`/dashboard/chat`)**:
  - An isolated split-pane layout wrapped entirely in the `Wrapper3D` effect.
  - The left column houses the interactive `AnimatedCard` data visualizer.
  - The right column provides the fluid AI chat experience.

---

## 5. Current State & Next Steps
- **State**: The frontend is robust, visually finalized for the core user loops, and successfully deployed to the `main` branch of the GitHub repository. Firebase keys are secured. The directory is structured neatly under `Frontend/`.
- **Potential Next Steps**:
  1. Connecting the mock AI responses in `chatService.js` to a real LLM endpoint (e.g., OpenAI or custom backend).
  2. Transitioning the mock mentor scheduling, session histories, and mood logs to live Firebase Firestore queries.
  3. Filling out the specific dashboard capabilities for the varying roles (Peer Mentors processing requests, NGOs observing anonymous aggregate stats, etc.).
