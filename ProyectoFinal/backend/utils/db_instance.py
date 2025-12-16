from database.autoawake_db import Database

# Singleton instance
db_instance = Database()

def get_db_instance():
    return db_instance
