<?php
// check_db.php - Upload this to your server
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$host = "localhost";
$user = "koolkhan";      // Matches your api.php settings
$pass = "Mangohair197";  // Matches your api.php settings
$dbname = "fee_system";

echo "<h2>Database Connection Test</h2>";

// 1. Test Server Connection
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die("<p style='color:red'>❌ Connection Failed: " . $conn->connect_error . "</p>");
}
echo "<p style='color:green'>✅ Connected to MySQL Server successfully.</p>";

// 2. Test Database Existence
$db_selected = $conn->select_db($dbname);

if (!$db_selected) {
    echo "<p style='color:red'>❌ Database '$dbname' does NOT exist.</p>";
    echo "<p><strong>Next Step:</strong> Run the 'database.sql' commands in your terminal.</p>";
} else {
    echo "<p style='color:green'>✅ Database '$dbname' exists.</p>";
    
    // 3. Test Table Existence
    $result = $conn->query("SHOW TABLES LIKE 'students'");
    if ($result->num_rows > 0) {
        echo "<p style='color:green'>✅ Tables appear to exist (Found 'students' table).</p>";
    } else {
        echo "<p style='color:orange'>⚠️ Database exists but tables are missing. Import 'database.sql'.</p>";
    }
}

$conn->close();
?>
