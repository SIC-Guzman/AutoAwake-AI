#!/bin/bash

# Puerto por defecto 3000 si no se pasa argumento
PORT=${1:-3001}

# Levantar FastAPI con uvicorn
pip freeze > requirements.txt
# Usar el python del venv para ejecutar uvicorn
python -m uvicorn main:app --reload --port $PORT