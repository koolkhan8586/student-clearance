<?php
// api.php - Final Clean Version for user 'koolkhan'
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't print errors to screen, breaks JSON

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

ob_start(); // Start buffer

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

// DB CONFIG
$host = "localhost";
$user = "koolkhan"; 
$pass = "Mangohair@197";         
$dbname = "fee_system";

$conn = null;
$response = ["status" => "error", "message" => "Unknown error"];

try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    if ($conn->connect_error) {
        throw new Exception("DB Connection Failed: " . $conn->connect_error);
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
            $data = [
                'students' => [], 
                'fees' => [], 
                'enrollments' => [], 
                'discounts' => [], 
                'payments' => []
            ];
            
            // Map DB Tables to JSON keys
            $mapping = [
                'students' => 'students',
                'fee_structure' => 'fees',
                'enrollments' => 'enrollments',
                'discounts' => 'discounts',
                'payments' => 'payments'
            ];

            foreach($mapping as $table => $key) {
                // Check table existence to prevent crash
                $check = $conn->query("SHOW TABLES LIKE '$table'");
                if($check && $check->num_rows > 0) {
                    $result = $conn->query("SELECT * FROM $table");
                    if($result) {
                        while($row = $result->fetch_assoc()) {
                            $data[$key][] = $row;
                        }
                    }
                }
            }

            $response = ["status" => "success", "data" => $data];
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // ... (Save logic mostly same, ensuring success response) ...
        
        if ($action === 'save_student') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']);
            $deg = sanitize($conn, $input['degree']); $batch = sanitize($conn, $input['batch']); $mob = sanitize($conn, $input['mobile']);
            $conn->query("INSERT INTO students (reg_no, name, degree, batch, mobile) VALUES ('$reg', '$name', '$deg', '$batch', '$mob') ON DUPLICATE KEY UPDATE name='$name', degree='$deg', batch='$batch', mobile='$mob'");
            $response = ["status" => "success"];
        }
        elseif ($action === 'delete_student') {
            $reg = sanitize($conn, $input['reg_no']);
            $conn->query("DELETE FROM students WHERE reg_no = '$reg'");
            $response = ["status" => "success"];
        }
        // ... (Include other delete/save actions here as needed for Fee, Enrollment, etc.) ...
        elseif ($action === 'save_discount') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']); $term = sanitize($conn, $input['term']); $disc = (float)$input['discount']; $id = $input['id'] ?? null;
            if($id && $id != '-1') $conn->query("UPDATE discounts SET reg_no='$reg', name='$name', term='$term', discount=$disc WHERE id=$id");
            else $conn->query("INSERT INTO discounts (reg_no, name, term, discount) VALUES ('$reg', '$name', '$term', $disc)");
            $response = ["status" => "success"];
        }
        elseif ($action === 'delete_discount') { 
            $id = (int)$input['id']; 
            $conn->query("DELETE FROM discounts WHERE id=$id"); 
            $response = ["status" => "success"];
        }
        elseif ($action === 'delete_all_discounts') {
            $conn->query("TRUNCATE TABLE discounts");
            $response = ["status" => "success"];
        }
         // ... (Other bulk imports) ...
        elseif ($action === 'import_students') {
            $conn->begin_transaction(); 
            $stmt = $conn->prepare("INSERT INTO students (reg_no, name, degree, batch, mobile) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), degree=VALUES(degree), batch=VALUES(batch), mobile=VALUES(mobile)");
            foreach ($input as $row) { $stmt->bind_param("sssss", $row['reg_no'], $row['name'], $row['degree'], $row['batch'], $row['mobile']); $stmt->execute(); }
            $conn->commit();
            $response = ["status" => "success"];
        }
    }

} catch (Exception $e) {
    $response = ["status" => "error", "message" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
?>
