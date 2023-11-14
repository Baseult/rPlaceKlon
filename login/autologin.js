// Check if the token cookie exists
if (document.cookie.includes("token=")) {
    // Redirect to autologin.php
    window.location.href = "autologin.php";
}