-- Active: 1765295960084@@mysql-db-1.cyjwig6wkals.us-east-1.rds.amazonaws.com@3306@AutoAwakeAI
-- Create roles table first (if not exists)
USE DATABASE AutoAwakeAI;
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'Administrator with full access'),
(2, 'MANAGER', 'Fleet manager with monitoring access'),
(3, 'DRIVER', 'Driver with limited access')
ON DUPLICATE KEY UPDATE name=name;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_email (email),
    INDEX idx_role (role_id)
);