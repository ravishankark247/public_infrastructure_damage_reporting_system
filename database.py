import sqlite3
import os
from datetime import datetime, timedelta

def get_db_path():
    if "PIDR_DB_PATH" in os.environ:
        return os.environ["PIDR_DB_PATH"]
    base_dir = os.path.dirname(os.path.abspath(__file__))
    local_path = os.path.join(base_dir, "pidr_database.sqlite")
    try:
        test_conn = sqlite3.connect(local_path)
        test_conn.execute("CREATE TABLE IF NOT EXISTS _fs_test (id INT)")
        test_conn.execute("DROP TABLE _fs_test")
        test_conn.close()
        return local_path
    except (sqlite3.OperationalError, Exception):
        return os.path.join("/tmp", "pidr_database.sqlite")

DB_PATH = get_db_path()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ward_number INTEGER UNIQUE NOT NULL,
        ward_name TEXT NOT NULL,
        zonal_office TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        address_text TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        ward_id INTEGER,
        department_id INTEGER,
        reporter_name TEXT NOT NULL,
        reporter_phone TEXT NOT NULL,
        reporter_email TEXT,
        status TEXT NOT NULL DEFAULT 'Submitted',
        before_image TEXT,
        after_image TEXT,
        resolution_notes TEXT,
        assigned_engineer TEXT,
        upvotes INTEGER DEFAULT 0,
        sla_hours INTEGER DEFAULT 72,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (ward_id) REFERENCES wards (id),
        FOREIGN KEY (department_id) REFERENCES departments (id)
    );

    CREATE TABLE IF NOT EXISTS issue_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        note TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (issue_id) REFERENCES issues (id)
    );
    """)

    cursor.execute("SELECT COUNT(*) FROM departments")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)

    conn.commit()
    conn.close()

def seed_data(cursor):
    departments = [
        ("Public Works Department (Roads & Bridges)", "PWD", "pwd-support@gov.in", "+91-11-2334-0001"),
        ("Municipal Electricity & Streetlighting Division", "MCED", "electricity@gov.in", "+91-11-2334-0002"),
        ("Delhi Jal Board (Water & Sewerage)", "DJB", "jalboard-nodal@gov.in", "+91-11-2334-0003"),
        ("Solid Waste Management & Sanitation", "MSWM", "sanitation@gov.in", "+91-11-2334-0004")
    ]
    cursor.executemany("INSERT INTO departments (name, code, contact_email, contact_phone) VALUES (?, ?, ?, ?)", departments)

    wards = [
        (101, "Connaught Place (Central Zone)", "Zonal Office - Palika Kendra, CP"),
        (102, "Rohini Sector 9 (North-West Zone)", "Zonal Office - Madhuban Chowk"),
        (103, "Dwarka Sector 12 (South-West Zone)", "Zonal Office - Sector 10 Dwarka"),
        (104, "Saket & South Ext (South Zone)", "Zonal Office - Green Park"),
        (105, "Karol Bagh (West Zone)", "Zonal Office - Pusa Road"),
        (106, "Laxmi Nagar (East Zone)", "Zonal Office - Vikas Marg")
    ]
    cursor.executemany("INSERT INTO wards (ward_number, ward_name, zonal_office) VALUES (?, ?, ?)", wards)

    now = datetime.now()
    two_days_ago = (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
    one_day_ago = (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
    four_hours_ago = (now - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")
    one_hour_ago = (now - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")

    sample_issues = [
        (
            "PIDR-2026-0001",
            "Pothole",
            "High",
            "Deep 4-foot Pothole near Metro Pillar 142",
            "Dangerous pothole causing severe two-wheeler skid hazards on the busy arterial road.",
            "Outer Ring Road, Near Pillar 142, Rohini Sector 9, Delhi",
            28.7150,
            77.1235,
            2, # Ward 102
            1, # PWD
            "Vikram Malhotra",
            "+91 98110 23456",
            "vikram.m@example.com",
            "In Progress",
            "/static/uploads/sample_pothole_before.jpg",
            None,
            None,
            "Er. Rajesh Sharma (PWD Junior Engineer)",
            14,
            48,
            two_days_ago,
            one_day_ago,
            None
        ),
        (
            "PIDR-2026-0002",
            "Broken Streetlight",
            "Medium",
            "Non-functioning Streetlight Pole #48",
            "Entire lane is dark after 7 PM, creating safety concerns for pedestrians and commuters.",
            "Block B, Inner Circle, Connaught Place, New Delhi",
            28.6328,
            77.2197,
            1, # Ward 101
            2, # MCED
            "Ananya Sen",
            "+91 98711 54321",
            "ananya.sen@example.com",
            "Resolved",
            "/static/uploads/sample_light_before.jpg",
            "/static/uploads/sample_light_after.jpg",
            "Defective 90W LED luminaire replaced and electrical wiring inspected. Luminance restored.",
            "Er. Sunil Verma (Electrical Inspector)",
            8,
            48,
            two_days_ago,
            four_hours_ago,
            four_hours_ago
        ),
        (
            "PIDR-2026-0003",
            "Water Leakage",
            "Critical",
            "High-pressure Mainline Water Pipe Burst",
            "Thousands of liters of potable water flooding the street. Low water pressure in adjacent residential towers.",
            "Sector 12 Main Market Road, Dwarka, New Delhi",
            28.5921,
            77.0460,
            3, # Ward 103
            3, # DJB
            "Rohit Saxena",
            "+91 98990 77123",
            "rohit.s@example.com",
            "Acknowledged",
            "/static/uploads/sample_pipe_before.jpg",
            None,
            None,
            "Er. Amit Tyagi (Jal Board Section Officer)",
            32,
            24,
            one_day_ago,
            four_hours_ago,
            None
        ),
        (
            "PIDR-2026-0004",
            "Open Drain",
            "Critical",
            "Uncovered Storm Drain on School Walking Route",
            "Concrete slab broken and missing. Immediate risk of fall or injury to school children and elderly.",
            "Near Kendriya Vidyalaya, Saket Block J, New Delhi",
            28.5245,
            77.2066,
            4, # Ward 104
            3, # DJB
            "Pooja Deshmukh",
            "+91 97112 88440",
            "pooja.d@example.com",
            "Submitted",
            "/static/uploads/sample_drain_before.jpg",
            None,
            None,
            None,
            19,
            24,
            one_hour_ago,
            one_hour_ago,
            None
        )
    ]

    cursor.executemany("""
    INSERT INTO issues (
        ticket_number, category, severity, title, description, address_text,
        latitude, longitude, ward_id, department_id, reporter_name, reporter_phone,
        reporter_email, status, before_image, after_image, resolution_notes,
        assigned_engineer, upvotes, sla_hours, created_at, updated_at, resolved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_issues)

    timelines = [
        (1, "Submitted", "Incident logged by citizen with photographic proof.", "Vikram Malhotra", two_days_ago),
        (1, "Acknowledged", "Report reviewed by PWD Control Room. Priority categorized as High.", "Dispatcher PWD", two_days_ago),
        (1, "In Progress", "Assigned to Er. Rajesh Sharma. Asphalt cold-mix patching crew dispatched.", "Er. Rajesh Sharma", one_day_ago),
        (2, "Submitted", "Streetlight outage reported with geo-tag.", "Ananya Sen", two_days_ago),
        (2, "Acknowledged", "Auto-routed to Municipal Electricity Division.", "System Dispatcher", two_days_ago),
        (2, "In Progress", "Field team dispatched with hydraulic hoist bucket.", "Er. Sunil Verma", one_day_ago),
        (2, "Resolved", "Repaired and verified with post-fix luminaire inspection photo.", "Er. Sunil Verma", four_hours_ago),
        (3, "Submitted", "Water pipeline burst reported by residents.", "Rohit Saxena", one_day_ago),
        (3, "Acknowledged", "Critical notice escalated to DJB emergency response crew.", "DJB Control Room", four_hours_ago),
        (4, "Submitted", "Open drain hazard logged by resident.", "Pooja Deshmukh", one_hour_ago)
    ]

    cursor.executemany("""
    INSERT INTO issue_timeline (issue_id, status, note, updated_by, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, timelines)

if __name__ == "__main__":
    init_db()
    print(f"Database initialized and seeded successfully at: {DB_PATH}")
