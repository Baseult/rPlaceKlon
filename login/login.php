<?php

// Establish database connection
require_once 'config.php';
$conn = new mysqli(DB_HOST, DB_USER, '', DB_NAME);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}


// Handle login form submission
if (isset($_POST["login"])) {
    $username = $_POST["username"];
    $password = $_POST["password"];


    // Sanitize user input
    $username = mysqli_real_escape_string($conn, $username);

    // Check if the account is locked
    $stmt = $conn->prepare("SELECT attempt_count, locked_until FROM login_attempts WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->bind_result($attemptCount, $lockedUntil);
        $stmt->fetch();

        $remainingAttempts = 5 - $attemptCount;
        if ($remainingAttempts <= 0) {
            if (strtotime($lockedUntil) > time()) {
                $remainingTime = round((strtotime($lockedUntil) - time()) / 60);
                echo "Der Account ist vorübergehend gesperrt.\r\nBitte versuchen Sie es nach $remainingTime Minuten erneut.";
                exit;
            }
        }
    }

    $stmt->close();

    // Use prepared statement to prevent SQL injection
    $stmt = $conn->prepare("SELECT password, salt FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($hashedPassword, $salt);
        $stmt->fetch();
        if (password_verify($password . $salt, $hashedPassword)) {
            // Login successful, reset attempt count and unlock the account
            $stmt = $conn->prepare("DELETE FROM login_attempts WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();

            // Generate a unique token for the user
            $token = generateToken();

            // Store the token in the database alongside the user's information
            $stmt = $conn->prepare("UPDATE users SET token = ? WHERE username = ?");
            $stmt->bind_param("ss", $token, $username);
            $stmt->execute();

            // Set the token as the cookie value
            $secure_cookie = true;
            $httponly_cookie = true;
            setcookie("token", $token, time() + 14000, "/", "", $secure_cookie, $httponly_cookie);
            echo "Login erfolgreich!";
        } else {
            // Login failed, update attempt count and lock the account if necessary
            $stmt = $conn->prepare("INSERT INTO login_attempts (username, attempt_count, last_attempt_time, locked_until) VALUES (?, 1, NOW(), NOW() + INTERVAL 5 MINUTE) ON DUPLICATE KEY UPDATE attempt_count = attempt_count + 1, last_attempt_time = NOW(), locked_until = IF(attempt_count + 1 >= 5, NOW() + INTERVAL 5 MINUTE, locked_until)");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $stmt->close();

            // Get the current attempt count and locked_until value
            $stmt = $conn->prepare("SELECT attempt_count, locked_until FROM login_attempts WHERE username = ?");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $stmt->bind_result($attemptCount, $lockedUntil);
            $stmt->fetch();

            $remainingAttempts = 5 - $attemptCount;
            if ($remainingAttempts > 0) {
                $remainingTime = round((strtotime($lockedUntil) - time()) / 60);
                echo "Ungültiger Benutzername oder Passwort!\r\n$remainingAttempts verbleibende Versuche, bevor das Konto für $remainingTime Minuten gesperrt wird.";
            } else {
                echo "Ungültiger Benutzername oder Passwort!\r\nZu viele Fehlversuche!\r\nKonto für 5 Minuten gesperrt.";
            }
        }
    } else {
        echo "Ungültiger Benutzername oder Passwort!";
    }
    $stmt->close();
}

// Close database connection
$conn->close();

// Function to generate a unique token
function generateToken() {
    return bin2hex(random_bytes(32));
}
?>