<?php
// api.php - Debugging Version
// Enable error reporting for debugging (Remove in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Start output buffering
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

// --- DATABASE CREDENTIALS ---
$host = "localhost";
$user = "koolkhan";
$pass = "Mangohair@197"; // ENTER YOUR PASSWORD HERE IF ANY
$dbname = "fee_system";

$response = ["status" => "error", "message" => "Unknown error"];

try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");

    $action = $_GET['action'] ?? '';
    $input_raw = file_get_contents('php://input');
    $input = json_decode($input_raw, true);

    function sanitize($conn, $val) {
        return $conn->real_escape_string($val ?? '');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'fetch_all') {
            $data = ['students' => [], 'fees' => [], 'enrollments' => [], 'discounts' => [], 'payments' => []];
            
            $tables = [
                'students' => 'students', 
                'fee_structure' => 'fees', 
                'enrollments' => 'enrollments', 
                'discounts' => 'discounts', 
                'payments' => 'payments'
            ];
            
            $debug_counts = [];

            foreach($tables as $dbTable => $key) {
                // Simplified query - just get everything
                $sql = "SELECT * FROM $dbTable";
                $result = $conn->query($sql);
                
                if ($result) {
                    while($row = $result->fetch_assoc()) {
                        $data[$key][] = $row;
                    }
                    $debug_counts[$key] = count($data[$key]);
                } else {
                    $debug_counts[$key] = "Error: " . $conn->error;
                }
            }
            
            $response = [
                'status' => 'success', 
                'data' => $data,
                'debug_counts' => $debug_counts // Helpful for debugging
            ];
        } else {
             $response = ["status" => "error", "message" => "Invalid action: " . $action];
        }
    }

    // ... (POST methods remain the same, omitted for brevity in this fix but keep them in your file) ...
    // If you need the POST methods again, just paste the previous version's POST block here. 
    // For now, let's focus on GET working.
    
    // Add the POST block back from the previous correct version if you need saving to work immediately.
    // I am including a basic save_student as a placeholder to prevent errors if you try to save.
     if ($_SERVER['REQUEST_METHOD'] === 'POST') {
          if ($action === 'save_student') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']);
            $deg = sanitize($conn, $input['degree']); $batch = sanitize($conn, $input['batch']); $mob = sanitize($conn, $input['mobile']);
            $conn->query("INSERT INTO students (reg_no, name, degree, batch, mobile) VALUES ('$reg', '$name', '$deg', '$batch', '$mob') ON DUPLICATE KEY UPDATE name='$name', degree='$deg', batch='$batch', mobile='$mob'");
             $response = ["status" => "success"];
        }
        // ... add other POST handlers ...
     }


} catch (Exception $e) {
    $response = ["status" => "error", "message" => "Exception: " . $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>
