# API Technical Documentation

Base URL: `http://localhost:3001`

All endpoints (except Auth) require a Bearer Token in the `Authorization` header.
`Authorization: Bearer <token>`

## Authentication

### Register

- **URL**: `/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role_id": "int"
  }
  ```
- **Response**:
  ```json
  {
    "token": "string"
  }
  ```

### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "token": "string"
  }
  ```

## Drivers

### Create Driver

- **URL**: `/drivers/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "license_number": "string",
    "status": "string (optional, default: ACTIVE)"
  }
  ```
- **Response**:
  ```json
  {
    "driver_id": "int",
    "first_name": "string",
    "last_name": "string",
    "license_number": "string",
    "status": "string"
  }
  ```

### Get Driver

- **URL**: `/drivers/{driver_id}`
- **Method**: `GET`
- **Response**: Driver object (same as above)

### List Drivers

- **URL**: `/drivers/`
- **Method**: `GET`
- **Query Params**: `status` (optional)
- **Response**: List of Driver objects

### Deactivate Driver

- **URL**: `/drivers/{driver_id}`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "message": "Driver deactivated successfully"
  }
  ```

## Vehicles

### Create Vehicle

- **URL**: `/vehicles/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "plate": "string",
    "brand": "string",
    "model": "string",
    "status": "string (optional, default: ACTIVE)"
  }
  ```
- **Response**:
  ```json
  {
    "vehicle_id": "int",
    "plate": "string",
    "brand": "string",
    "model": "string",
    "status": "string"
  }
  ```

### Get Vehicle

- **URL**: `/vehicles/{vehicle_id}`
- **Method**: `GET`
- **Response**: Vehicle object (same as above)

### List Vehicles

- **URL**: `/vehicles/`
- **Method**: `GET`
- **Query Params**: `status` (optional)
- **Response**: List of Vehicle objects

### Update Vehicle Status

- **URL**: `/vehicles/{vehicle_id}/status`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "status": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Vehicle status updated successfully"
  }
  ```

## Trips

### Start Trip

- **URL**: `/trips/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "vehicle_id": "int",
    "driver_id": "int",
    "origin": "string",
    "destination": "string"
  }
  ```
- **Response**:
  ```json
  {
    "trip_id": "int",
    "vehicle_id": "int",
    "driver_id": "int",
    "started_at": "datetime",
    "ended_at": "datetime (null)",
    "origin": "string",
    "destination": "string",
    "status": "string"
  }
  ```

### End Trip

- **URL**: `/trips/{trip_id}/end`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "status": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Trip ended successfully"
  }
  ```

### Get Trip

- **URL**: `/trips/{trip_id}`
- **Method**: `GET`
- **Response**: Trip object

### List Trips by Driver

- **URL**: `/trips/driver/{driver_id}`
- **Method**: `GET`
- **Response**: List of Trip objects

### List Trips by Vehicle

- **URL**: `/trips/vehicle/{vehicle_id}`
- **Method**: `GET`
- **Response**: List of Trip objects

## Alerts

### Log Alert

- **URL**: `/alerts/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "trip_id": "int",
    "alert_type": "string",
    "severity": "string",
    "message": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Alert logged successfully"
  }
  ```

### List Alerts by Trip

- **URL**: `/alerts/trip/{trip_id}`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "alert_id": "int",
      "trip_id": "int",
      "vehicle_id": "int",
      "driver_id": "int",
      "alert_type": "string",
      "severity": "string",
      "message": "string",
      "detected_at": "datetime"
    }
  ]
  ```

## Issues

### Open Issue

- **URL**: `/issues/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "vehicle_id": "int (optional)",
    "driver_id": "int (optional)",
    "trip_id": "int (optional)",
    "issue_type": "string",
    "description": "string"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Issue opened successfully"
  }
  ```

### Close Issue

- **URL**: `/issues/{issue_id}/close`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "message": "Issue closed successfully"
  }
  ```

### List Issues

- **URL**: `/issues/`
- **Method**: `GET`
- **Query Params**: `status` (optional)
- **Response**:
  ```json
  [
    {
      "issue_id": "int",
      "vehicle_id": "int",
      "driver_id": "int",
      "trip_id": "int",
      "issue_type": "string",
      "description": "string",
      "status": "string",
      "reported_at": "datetime",
      "resolved_at": "datetime"
    }
  ]
  ```

## Devices

### Update Device Status

- **URL**: `/devices/{device_id}/status`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "status": "string",
    "firmware_version": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Device status updated successfully"
  }
  ```

### List Devices

- **URL**: `/devices/`
- **Method**: `GET`
- **Query Params**: `status` (optional)
- **Response**:
  ```json
  [
    {
      "device_id": "int",
      "vehicle_id": "int",
      "device_type": "string",
      "serial_number": "string",
      "firmware_version": "string",
      "status": "string",
      "last_seen_at": "datetime"
    }
  ]
  ```
