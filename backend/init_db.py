import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.sql_connection import engine, Base
from models.user import User
from models.role import Role
from database.autoawake_db import Database

def init_db():
    print("Creating SQLAlchemy tables (users, roles)...")
    Base.metadata.create_all(bind=engine)
    print("SQLAlchemy tables created.")

    print("Running SQL scripts...")
    db = Database()
    conn = db._get_connection()
    cursor = conn.cursor()

    sql_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "sql")
    scripts = [
        "01_schema.sql",
        "02_triggers.sql",
        "03_views.sql",
        "04_procedures.sql",
        "05_sample_data.sql"
    ]

    for script_name in scripts:
        script_path = os.path.join(sql_dir, script_name)
        print(f"Executing {script_name}...")
        with open(script_path, "r") as f:
            lines = f.readlines()

        statement = ""
        delimiter = ";"
        
        for line in lines:
            stripped_line = line.strip()
            
            # Handle DELIMITER command
            if stripped_line.upper().startswith("DELIMITER"):
                delimiter = stripped_line.split()[1]
                continue
            
            # Skip comments and empty lines if not inside a statement (simplified)
            if not statement and (stripped_line.startswith("--") or not stripped_line):
                continue
            
            statement += line
            
            # Check if statement ends with delimiter
            if stripped_line.endswith(delimiter):
                # Remove delimiter from the end
                # Be careful with $$ which is 2 chars
                clean_statement = statement.strip()
                if clean_statement.endswith(delimiter):
                    clean_statement = clean_statement[:-len(delimiter)]
                
                if clean_statement.strip():
                    try:
                        cursor.execute(clean_statement)
                    except Exception as e:
                        print(f"Error executing statement: {e}")
                        # Don't raise, continue with other statements?
                        # For now, let's print and continue, but it might cascade.
                        pass
                
                statement = ""
    
    conn.commit()
    conn.close()
    print("SQL scripts executed.")

    # Create default role if not exists
    from sqlalchemy.orm import Session
    session = Session(bind=engine)
    if not session.query(Role).filter_by(id=1).first():
        print("Creating default role...")
        role = Role(id=1, description="Admin")
        session.add(role)
        session.commit()
    session.close()

if __name__ == "__main__":
    init_db()
