import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "iainvestor.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    # Price cache
    cur.execute("""
        CREATE TABLE IF NOT EXISTS price_cache (
            ticker TEXT PRIMARY KEY,
            price REAL,
            source TEXT,
            timestamp REAL
        )
    """)

    # Fundamental cache
    cur.execute("""
        CREATE TABLE IF NOT EXISTS fundamental_cache (
            ticker TEXT PRIMARY KEY,
            pe_ratio REAL,
            revenue_growth REAL,
            debt_equity REAL,
            sector TEXT,
            market_cap REAL,
            source TEXT,
            timestamp REAL
        )
    """)

    # GPR (Geopolitical Risk Index) — seeded with recent data
    cur.execute("""
        CREATE TABLE IF NOT EXISTS gpr_data (
            date TEXT PRIMARY KEY,
            gpr_index REAL,
            gpr_threat REAL
        )
    """)

    # Analysis history
    cur.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            score_final REAL,
            recommendation TEXT,
            order_type TEXT,
            timestamp REAL
        )
    """)

    # Seed GPR data (recent monthly values — source: Caldara & Iacoviello GPR Index)
    gpr_seed = [
        ("2024-01", 98.2,  92.1),
        ("2024-02", 101.4, 95.3),
        ("2024-03", 105.7, 99.8),
        ("2024-04", 119.3, 112.4),
        ("2024-05", 108.6, 102.7),
        ("2024-06", 112.1, 106.3),
        ("2024-07", 104.8, 98.9),
        ("2024-08", 109.2, 103.5),
        ("2024-09", 118.7, 113.2),
        ("2024-10", 127.4, 121.8),
        ("2024-11", 131.9, 126.4),
        ("2024-12", 125.6, 119.3),
        ("2025-01", 138.2, 132.7),
        ("2025-02", 142.8, 137.1),
        ("2025-03", 148.3, 143.6),
        ("2025-04", 156.7, 151.2),
        ("2025-05", 162.4, 157.8),
        ("2025-06", 158.9, 153.4),
        ("2025-07", 155.3, 149.7),
    ]
    cur.executemany(
        "INSERT OR IGNORE INTO gpr_data (date, gpr_index, gpr_threat) VALUES (?,?,?)",
        gpr_seed,
    )

    conn.commit()
    conn.close()
    print(f"[DB] Database initialized at {DB_PATH}")
