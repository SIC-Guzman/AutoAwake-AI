import http.client
import json
import random
import string

PORT = 3001
HOST = "localhost"

def get_conn():
    return http.client.HTTPConnection(HOST, PORT)

def make_request(method, url, data=None, token=None):
    conn = get_conn()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data) if data else None
    conn.request(method, url, body, headers)
    response = conn.getresponse()
    data = response.read().decode()
    conn.close()
    
    try:
        return response.status, json.loads(data)
    except:
        return response.status, data

def random_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

def run_tests():
    print("--- Starting Tests ---")
    
    # 1. Register
    email = f"test_{random_string()}@example.com"
    password = "password123"
    print(f"Registering user: {email}")
    status, res = make_request("POST", "/auth/register", {
        "name": "Test User",
        "email": email,
        "password": password,
        "role_id": 1
    })
    print(f"Register: {status} {res}")
    
    # 2. Login
    print("Logging in...")
    status, res = make_request("POST", "/auth/login", {
        "email": email,
        "password": password
    })
    print(f"Login: {status}")
    if status != 200:
        print("Login failed, aborting.")
        return
    token = res["token"]
    
    # 3. Create Driver
    print("Creating Driver...")
    license_num = f"LIC-{random_string(5)}"
    status, driver = make_request("POST", "/drivers/", {
        "first_name": "John",
        "last_name": "Doe",
        "license_number": license_num
    }, token)
    print(f"Create Driver: {status} {driver}")
    driver_id = driver.get("driver_id")
    
    # 4. Create Vehicle
    print("Creating Vehicle...")
    plate = f"P-{random_string(3)}-{random_string(3)}"
    status, vehicle = make_request("POST", "/vehicles/", {
        "plate": plate,
        "brand": "Toyota",
        "model": "Corolla"
    }, token)
    print(f"Create Vehicle: {status} {vehicle}")
    vehicle_id = vehicle.get("vehicle_id")
    
    # 5. Start Trip
    print("Starting Trip...")
    status, trip = make_request("POST", "/trips/", {
        "vehicle_id": vehicle_id,
        "driver_id": driver_id,
        "origin": "Home",
        "destination": "Work"
    }, token)
    print(f"Start Trip: {status} {trip}")
    trip_id = trip.get("trip_id")
    
    # 6. Log Alert
    print("Logging Alert...")
    status, alert = make_request("POST", "/alerts/", {
        "trip_id": trip_id,
        "alert_type": "SPEEDING",
        "severity": "HIGH",
        "message": "Speed > 120km/h"
    }, token)
    print(f"Log Alert: {status} {alert}")
    
    # 7. End Trip
    print("Ending Trip...")
    status, res = make_request("POST", f"/trips/{trip_id}/end", {
        "status": "FINISHED"
    }, token)
    print(f"End Trip: {status} {res}")
    
    # 8. Deactivate Driver
    print("Deactivating Driver...")
    status, res = make_request("DELETE", f"/drivers/{driver_id}", token=token)
    print(f"Deactivate Driver: {status} {res}")

    print("--- Tests Completed ---")

if __name__ == "__main__":
    run_tests()
