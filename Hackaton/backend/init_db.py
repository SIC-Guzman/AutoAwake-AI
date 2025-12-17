import os
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.autoawake_db import Database


def _execute_sql_script(cursor, script_path: Path) -> None:
    with open(script_path, "r") as f:
        lines = f.readlines()

    statement = ""
    delimiter = ";"

    for line in lines:
        stripped_line = line.strip()

        if stripped_line.upper().startswith("DELIMITER"):
            delimiter = stripped_line.split()[1]
            continue

        if not statement and (stripped_line.startswith("--") or not stripped_line):
            continue

        statement += line

        if stripped_line.endswith(delimiter):
            clean_statement = statement.strip()
            if clean_statement.endswith(delimiter):
                clean_statement = clean_statement[:-len(delimiter)]

            if clean_statement.strip():
                try:
                    cursor.execute(clean_statement)
                except Exception as exc:
                    print(f"Error executing statement in {script_path.name}: {exc}")

            statement = ""


def init_db():
    print("Running SQL scripts...")
    db = Database()
    conn = db._get_connection()
    cursor = conn.cursor()

    sql_dir = Path(__file__).resolve().parent.parent / "database" / "sql"
    scripts = [
        "01_schema.sql",
        "02_triggers.sql",
        "03_views.sql",
        "04_procedures.sql",
        "05_sample_data.sql",
        "users.sql",
    ]

    for script_name in scripts:
        script_path = sql_dir / script_name
        if not script_path.exists():
            print(f"Skipping missing script: {script_name}")
            continue
        print(f"Executing {script_name}...")
        _execute_sql_script(cursor, script_path)

    conn.commit()
    conn.close()
    print("SQL scripts executed.")


if __name__ == "__main__":
    init_db()
