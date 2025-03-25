CREATE DATABASE conference_management;

-- Use the newly created database
USE conference_management;

-- Participants table

CREATE TABLE participants (
    participant_id VARCHAR(36) PRIMARY KEY, -- Use VARCHAR for non-numeric IDs
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Added password column
    QR_code VARCHAR(255) NOT NULL,
    sessions_registered TEXT -- Stores session IDs as a comma-separated string for simplicity
);


-- Tracks and Sessions table
CREATE TABLE tracks_sessions (
    track_id INT(11) NOT NULL,
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
    speaker VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
    time DATETIME NOT NULL,
    venue VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
    capacity INT(11) NOT NULL
);

-- Attendance table
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id VARCHAR(36) NOT NULL,
    session_id INT(11) NOT NULL,
    check_in_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (session_id) REFERENCES tracks_sessions(session_id)
) ENGINE=InnoDB;


CREATE TABLE proceedings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    session_id INT NOT NULL
);

CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(15),
    password VARCHAR(255) NOT NULL
);

CREATE TABLE feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


