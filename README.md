# Public Infrastructure Damage Reporting System (PIDR)

A production-ready civic technology web platform designed for municipal damage intake, geo-tagged photo verification, automated departmental routing, and transparent status tracking.

Developed in collaboration with **Unified Mentor**, adopting geospatial and rapid-dispatch architecture principles inspired by **Noonlight**.

---

## 🌟 Key Features

1. **Citizen Incident Reporting:**
   - Interactive OpenStreetMap/Leaflet map pin-drop and automatic GPS location capture.
   - Categorized intake: *Potholes, Broken Footpaths, Non-functional Streetlights, Exposed Electrical Cables, Water Pipeline Leaks, Open Drains, Waste Dumping*.
   - Photographic evidence upload with live client-side image preview.
   - Severity selection (*Low, Medium, High, Critical*) with automatic SLA calculation.
   - Instant generation of unique sequential tracking tokens (e.g., `PIDR-2026-0005`).

2. **Public Transparency & Status Stepper:**
   - Public complaint lookup by Ticket ID.
   - Real-time 4-stage visual progress stepper: `Submitted` → `Acknowledged` → `In Progress` → `Resolved`.
   - Side-by-side **Before & After Photographic Verification** (citizens can inspect visual proof of repaired infrastructure).
   - Public "Upvote" mechanism to identify widespread civic pain points without duplicate ticket spam.
   - Chronological audit log of all departmental actions and work orders.

3. **Municipal Authority Operations Desk:**
   - Multi-department routing (*Public Works Department, Municipal Electricity Division, Delhi Jal Board, Solid Waste Management*).
   - Real-time filterable queue by Department, Ward, Severity, and Status.
   - Field Engineer assignment and work order dispatching.
   - Mandatory post-repair photo submission before an issue can be marked as `Resolved`.

4. **Live Geographic Incident Grid:**
   - Full-window interactive map displaying all civic complaints with severity color-coding (Red = Critical, Amber = In Progress, Green = Resolved).
   - Rich interactive popups with photo thumbnails, issue summaries, and 1-click inspection links.

5. **Analytics & Civic Performance Dashboard:**
   - High-level KPIs: Total Complaints, Active Repair Orders, Verified Resolutions, SLA Compliance %, and Mean Time to Resolution (MTTR).
   - Category distribution and Ward-wise incident density visualizations.

---

## 🛠️ Technology Stack

- **Backend:** FastAPI (Python 3.9+) with asynchronous request handling.
- **Database:** SQLite with spatial coordinates, pre-seeded with realistic municipal wards, departments, and active complaints.
- **Frontend:** Responsive Single-Page Application (HTML5, Vanilla JavaScript ES6+, Custom Utility CSS, FontAwesome 6).
- **Mapping:** Leaflet.js with OpenStreetMap tiles and Nominatim reverse geocoding.
- **Storage:** Local static uploads directory with automatic unique timestamp naming.

---

## 🚀 How to Run in VS Code

### 1. Prerequisites
- Python 3.9, 3.10, 3.11, or 3.12 installed.
- VS Code with the Python extension installed.

### 2. Setup & Execution
Open the project directory in VS Code terminal:

```bash
# 1. (Optional) Create a virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# 2. Install required dependencies
pip install -r requirements.txt

# 3. Launch the application
python app.py
```

Or run directly using `uvicorn`:
```bash
uvicorn app:app --host 127.0.0.1 --port 8011 --reload
```

### 3. Open in Browser
Visit: **[http://127.0.0.1:8011](http://127.0.0.1:8011)**<br>
Interactive Swagger API Docs: **[http://127.0.0.1:8011/docs](http://127.0.0.1:8011/docs)**

---

## ☁️ How to Run in Google Colab

You can run this full-stack project in Google Colab without installing anything on your computer!

1. Open [Google Colab](https://colab.research.google.com).
2. Upload and open the provided **`Public_Infrastructure_Damage_Reporting_System.ipynb`** notebook file.
3. Run the cells in order:
   - **Cell 1:** Installs dependencies (`fastapi`, `uvicorn`, `python-multipart`, `jinja2`, `nest_asyncio`, `pyngrok`).
   - **Cell 2:** Writes the complete application code, static assets, and templates.
   - **Cell 3:** Initializes the database and seeds demonstration civic complaints.
   - **Cell 4:** Starts the FastAPI server as a background thread on port 8011.
   - **Cell 5:** Provides an interactive inline view link via Google Colab proxy port or localtunnel.
   - **Cell 6:** Executes automated verification tests across all endpoints.

---

## 📁 Project Directory Structure

```text
public_infrastructure_damage_reporting_system/
├── app.py                      # FastAPI application & REST API routes
├── database.py                 # SQLite database schema, connection & seed data
├── requirements.txt            # Python dependencies
├── run.sh                      # 1-Click Linux/macOS launcher
├── run.bat                     # 1-Click Windows launcher
├── README.md                   # Complete documentation & usage guide
├── Public_Infrastructure_Damage_Reporting_System.ipynb  # 1-Click Google Colab Notebook
├── static/
│   ├── css/
│   │   └── style.css           # Modern responsive design & status stepper styles
│   ├── js/
│   │   └── app.js              # Leaflet mapping, geolocation & API interaction
│   └── uploads/                # Seed and user-uploaded damage evidence photos
│       ├── sample_pothole_before.jpg
│       ├── sample_pothole_after.jpg
│       ├── sample_light_before.jpg
│       ├── sample_light_after.jpg
│       ├── sample_pipe_before.jpg
│       └── sample_drain_before.jpg
└── templates/
    └── index.html              # Master SPA (Report, Track, Map, Admin, Analytics)
```

---

## 🧪 Pre-Seeded Sample Complaints for Testing

Use these existing Ticket IDs in the **Track Ticket** tab to test the system immediately:
- **`PIDR-2026-0001`**: Outer Ring Road Pothole *(High Severity | In Progress | PWD)*
- **`PIDR-2026-0002`**: Connaught Place Broken Streetlight *(Medium Severity | Resolved with Before/After Photo | MCED)*
- **`PIDR-2026-0003`**: Dwarka Sector 12 Water Pipe Burst *(Critical Severity | Acknowledged | DJB)*
- **`PIDR-2026-0004`**: Saket Uncovered Storm Drain *(Critical Severity | Submitted | DJB)*
