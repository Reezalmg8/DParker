<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Database configuration
$servername = "sql302.infinityfree.com";
$username = "if0_37088506";
$password = "dptest1234"; // Use your vPanel password here
$dbname = "if0_37088506_DParker";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Get the posted data
$data = json_decode(file_get_contents("php://input"), true);

// Prepare and bind
$stmt = $conn->prepare("INSERT INTO users (name, phone, car_plate_no, car_type, email, password) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $name, $phone, $car_plate_no, $car_type, $email, $hashed_password);

// Set parameters and execute
$name = $data['name'];
$phone = $data['phone'];
$car_plate_no = $data['car_plate_no'];
$car_type = $data['car_type'];
$email = $data['email'];
$hashed_password = password_hash($data['password'], PASSWORD_DEFAULT); // Hash the password for security

if ($stmt->execute()) {
    echo json_encode(["message" => "Registration successful"]);
} else {
    echo json_encode(["error" => "Error: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
