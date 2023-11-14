<?php
// Establish database connection
require_once 'config.php';
$conn = new mysqli(DB_HOST, DB_USER, '', DB_NAME);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if the cookie exists
if (isset($_COOKIE['token'])) {
    $token = $_COOKIE['token'];

    // Use prepared statement to prevent SQL injection
    $stmt = $conn->prepare('SELECT username FROM users WHERE token = ?');
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($username);
        $stmt->fetch();
        echo "Auto-login erfolgreich für Nutzer: " . $username;
        header("Location: http://127.0.0.1:3000");
        exit; // Redirect or perform any other necessary action
    }

    $stmt->close(); // Close the prepared statement
}
else
{
    header("Location: http://127.0.0.1/login/index.html");
}

$conn->close(); // Close the database connection
exit;
?>