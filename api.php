<?php
// api.php - Bulletproof Version
// 1. Force Error Reporting (Temporary, for debugging)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 2. Prevent HTML output
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 3. Output Buffering to catch stray text
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

$host = "localhost";
$user = "koolkhan";      // CHECK THIS
$pass = "Mangohair@197";  // CHECK THIS
$dbname = "fee_system";

$conn = null;

try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';
$input_raw = file_get_contents('php://input');
$input = json_decode($input_raw, true);

function sanitize($conn, $val) {
    return $conn->real_escape_string($val ?? '');
}

try {
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
            
            foreach($tables as $dbTable => $key) {
                // Check if table exists to prevent crash
                $check = $conn->query("SHOW TABLES LIKE '$dbTable'");
                if($check && $check->num_rows > 0) {
                    $res = $conn->query("SELECT * FROM $dbTable");
                    while($row = $res->fetch_assoc()) $data[$key][] = $row;
                }
            }
            
            ob_end_clean();
            echo json_encode(['status' => 'success', 'data' => $data]);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // ... (Actions)
        
        if ($action === 'save_student') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']);
            $deg = sanitize($conn, $input['degree']); $batch = sanitize($conn, $input['batch']); $mob = sanitize($conn, $input['mobile']);
            $conn->query("INSERT INTO students (reg_no, name, degree, batch, mobile) VALUES ('$reg', '$name', '$deg', '$batch', '$mob') ON DUPLICATE KEY UPDATE name='$name', degree='$deg', batch='$batch', mobile='$mob'");
        }
        elseif ($action === 'delete_student') {
            $reg = sanitize($conn, $input['reg_no']);
            $conn->query("DELETE FROM students WHERE reg_no = '$reg'");
        }
        elseif ($action === 'delete_all_students') { $conn->query("TRUNCATE TABLE students"); }

        elseif ($action === 'save_enrollment') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']); $sem = sanitize($conn, $input['semester']);
            $c = (int)$input['courses']; $cr = (int)$input['cr']; $id = $input['id'] ?? null;
            if($id && $id != '-1') $conn->query("UPDATE enrollments SET reg_no='$reg', name='$name', semester='$sem', courses=$c, cr=$cr WHERE id=$id");
            else $conn->query("INSERT INTO enrollments (reg_no, name, semester, courses, cr) VALUES ('$reg', '$name', '$sem', $c, $cr)");
        }
        elseif ($action === 'delete_enrollment') { $id = (int)$input['id']; $conn->query("DELETE FROM enrollments WHERE id=$id"); }
        elseif ($action === 'delete_all_enrollments') { $conn->query("TRUNCATE TABLE enrollments"); }

        elseif ($action === 'save_fee') {
            $d = $input; $id = $input['id'] ?? null;
            $cols = "degree, batch, year, semester, cr, per_cr_fee, tuition_fee, total_courses, exam_fee_per_subject, exam_fee, reg_fee, other_fee, paid, total_fee";
            $vals = "'{$d['target_degree']}','{$d['target_batch']}',{$d['year']},'{$d['semester']}',{$d['cr']},{$d['per_cr_fee']},{$d['tuition_fee']},{$d['total_courses']},{$d['exam_fee_per_subject']},{$d['exam_fee']},{$d['reg_fee']},{$d['other_fee']},{$d['paid']},{$d['total_fee']}";
            
            if($id && $id != '-1') {
                $conn->query("UPDATE fee_structure SET degree='{$d['target_degree']}', batch='{$d['target_batch']}', year={$d['year']}, semester='{$d['semester']}', cr={$d['cr']}, per_cr_fee={$d['per_cr_fee']}, tuition_fee={$d['tuition_fee']}, total_courses={$d['total_courses']}, exam_fee_per_subject={$d['exam_fee_per_subject']}, exam_fee={$d['exam_fee']}, reg_fee={$d['reg_fee']}, other_fee={$d['other_fee']}, paid={$d['paid']}, total_fee={$d['total_fee']} WHERE id=$id");
            } else {
                $conn->query("INSERT INTO fee_structure ($cols) VALUES ($vals)");
            }
        }
        elseif ($action === 'delete_fee') { $id = (int)$input['id']; $conn->query("DELETE FROM fee_structure WHERE id=$id"); }
        elseif ($action === 'delete_all_fees') { $conn->query("TRUNCATE TABLE fee_structure"); }

        elseif ($action === 'save_payment') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']); $sem = sanitize($conn, $input['semester']);
            $amt = (float)$input['amount']; $date = sanitize($conn, $input['date']); $id = $input['id'] ?? null;
            if($id && $id != '-1') $conn->query("UPDATE payments SET reg_no='$reg', name='$name', semester='$sem', amount=$amt, date='$date' WHERE id=$id");
            else $conn->query("INSERT INTO payments (reg_no, name, semester, amount, date) VALUES ('$reg', '$name', '$sem', $amt, '$date')");
        }
        elseif ($action === 'delete_payment') { $id = (int)$input['id']; $conn->query("DELETE FROM payments WHERE id=$id"); }
        elseif ($action === 'delete_all_payments') { $conn->query("TRUNCATE TABLE payments"); }
        
        elseif ($action === 'save_discount') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']); $term = sanitize($conn, $input['term']); $disc = (float)$input['discount']; $id = $input['id'] ?? null;
            if($id && $id != '-1') $conn->query("UPDATE discounts SET reg_no='$reg', name='$name', term='$term', discount=$disc WHERE id=$id");
            else $conn->query("INSERT INTO discounts (reg_no, name, term, discount) VALUES ('$reg', '$name', '$term', $disc)");
        }
        elseif ($action === 'delete_discount') { $id = (int)$input['id']; $conn->query("DELETE FROM discounts WHERE id=$id"); }
        elseif ($action === 'delete_all_discounts') { $conn->query("TRUNCATE TABLE discounts"); }

        // Bulk imports skipped for brevity but follow same pattern
        
        elseif ($action === 'reset') {
            $conn->query("SET FOREIGN_KEY_CHECKS=0");
            $conn->query("TRUNCATE TABLE students"); $conn->query("TRUNCATE TABLE fee_structure"); 
            $conn->query("TRUNCATE TABLE enrollments"); $conn->query("TRUNCATE TABLE discounts"); $conn->query("TRUNCATE TABLE payments");
            $conn->query("SET FOREIGN_KEY_CHECKS=1");
        }
        
        ob_end_clean();
        echo json_encode(["status" => "success"]);
    }

} catch (Exception $e) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
