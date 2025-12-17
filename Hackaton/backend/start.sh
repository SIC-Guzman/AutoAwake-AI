#!/bin/bash

# Siempre utilizara el puerto 3001 para evitar conflictos
# vamos a revisar si el puerto 3001 está ocupado
if [ $(lsof -i :3001 | wc -l) -gt 1 ]; then
    echo "El puerto 3001 está ocupado por otro proceso"
    echo "el proceso tiene PID: $(lsof -i :3001 | awk 'NR==2 {print $2}')"
    exit 1
fi

PORT=3001

# Levantar FastAPI con uvicorn
pip freeze > requirements.txt
# Usar el python del venv para ejecutar uvicorn
./../.venv/bin/python -m uvicorn main:app --reload --port $PORT
