<?php

// Establish database connection
require_once 'config.php';
$conn = new mysqli(DB_HOST, DB_USER, '', DB_NAME);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Handle registration form submission
if (isset($_POST["register"])) {
    $username = $_POST["username"];
    $password = $_POST["password"];

// Sanitize and validate user input
    $username = filter_var(trim($username), FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    $password = trim($password);


    // Check if the form data is valid
    if (empty($username) || empty($password)) {
        echo "Bitte fülle alle Felder aus!";
        exit;
    }

    // Check if the user already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo "Benutzername existiert bereits";
        exit;
    }
    $stmt->close();

    // Generate a random salt
    $salt = bin2hex(random_bytes(16));

    // Hash the password with the salt
    $hashedPassword = password_hash($password . $salt, PASSWORD_DEFAULT);

    // Use prepared statement to prevent SQL injection
    $insertStmt = $conn->prepare("INSERT INTO users (username, password, salt, token) VALUES (?, ?, ?, ?)");
    $token = generateToken(); // Generate a unique token for the user
    $insertStmt->bind_param("ssss", $username, $hashedPassword, $salt, $token);

    if ($insertStmt->execute()) {
        // Store the token in the database alongside the user's information
        $updateStmt = $conn->prepare("UPDATE users SET token = ? WHERE username = ?");
        $updateStmt->bind_param("ss", $token, $username);
        $updateStmt->execute();

        // Set the token as the cookie value
        $secure_cookie = true;
        $httponly_cookie = true;
        setcookie("token", $token, time() + 14000, "/", "", $secure_cookie, $httponly_cookie);

        // Output success messages
        echo "Registrierung erfolgreich!";
    } else {
        echo "Registration fehlgeschlagen!";
    }

    $insertStmt->close();
    $updateStmt->close();
}

// Close database connection
$conn->close();

function generateToken() {
    return bin2hex(random_bytes(32));
}
?>
