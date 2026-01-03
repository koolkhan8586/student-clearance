<?php
// api.php
error_reporting(E_ALL);
ini_set('display_errors', 0); 

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$host = "localhost";
$user = "koolkhan";      // CHANGE THIS
$pass = "Mangohair197";  // CHANGE THIS
$dbname = "fee_system";

try {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli($host, $user, $pass, $dbname);
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "DB Connection Failed: " . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

function sanitize($conn, $input) {
    if (is_array($input)) return array_map(function($item) use ($conn) { return sanitize($conn, $item); }, $input);
    return $conn->real_escape_string($input ?? '');
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($action === 'fetch_all') {
            $data = ['students' => [], 'fees' => [], 'enrollments' => [], 'discounts' => [], 'payments' => []];
            $tables = ['students', 'fee_structure', 'enrollments', 'discounts', 'payments'];
            foreach($tables as $t) {
                // Determine array key based on table name
                $key = ($t === 'fee_structure') ? 'fees' : $t;
                
                // Check if table exists before querying
                $check = $conn->query("SHOW TABLES LIKE '$t'");
                if($check->num_rows > 0) {
                    $res = $conn->query("SELECT * FROM $t");
                    while($row = $res->fetch_assoc()) $data[$key][] = $row;
                }
            }
            echo json_encode(['status' => 'success', 'data' => $data]);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        
        // --- FEE ACTIONS (FIXED UPDATE LOGIC) ---
        if ($action === 'save_fee') {
            $d = sanitize($conn, $input);
            $id = $input['id'] ?? null;

            if ($id && $id !== "-1" && is_numeric($id)) {
                // Update Existing
                $sql = "UPDATE fee_structure SET 
                        degree='{$d['degree']}', batch='{$d['batch']}', year='{$d['year']}', semester='{$d['semester']}', 
                        cr='{$d['cr']}', per_cr_fee='{$d['per_cr_fee']}', tuition_fee='{$d['tuition_fee']}', 
                        total_courses='{$d['total_courses']}', exam_fee_per_subject='{$d['exam_fee_per_subject']}', 
                        exam_fee='{$d['exam_fee']}', reg_fee='{$d['reg_fee']}', other_fee='{$d['other_fee']}', 
                        paid='{$d['paid']}', total_fee='{$d['total_fee']}' 
                        WHERE id=$id";
                $conn->query($sql);
            } else {
                // Insert New
                $sql = "INSERT INTO fee_structure (degree, batch, year, semester, cr, per_cr_fee, tuition_fee, total_courses, exam_fee_per_subject, exam_fee, reg_fee, other_fee, paid, total_fee) 
                        VALUES ('{$d['degree']}', '{$d['batch']}', '{$d['year']}', '{$d['semester']}', '{$d['cr']}', '{$d['per_cr_fee']}', '{$d['tuition_fee']}', '{$d['total_courses']}', '{$d['exam_fee_per_subject']}', '{$d['exam_fee']}', '{$d['reg_fee']}', '{$d['other_fee']}', '{$d['paid']}', '{$d['total_fee']}')";
                $conn->query($sql);
            }
            echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'delete_fee') {
            $id = (int)$input['id'];
            $conn->query("DELETE FROM fee_structure WHERE id = $id");
            echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'delete_all_fees') {
            $conn->query("TRUNCATE TABLE fee_structure");
            echo json_encode(["status" => "success"]);
        }

        // --- STUDENT ACTIONS ---
        elseif ($action === 'save_student') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']);
            $deg = sanitize($conn, $input['degree']); $batch = sanitize($conn, $input['batch']); $mob = sanitize($conn, $input['mobile']);
            $conn->query("INSERT INTO students (reg_no, name, degree, batch, mobile) VALUES ('$reg', '$name', '$deg', '$batch', '$mob') ON DUPLICATE KEY UPDATE name='$name', degree='$deg', batch='$batch', mobile='$mob'");
            echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'delete_student') { $reg = sanitize($conn, $input['reg_no']); $conn->query("DELETE FROM students WHERE reg_no = '$reg'"); echo json_encode(["status" => "success"]); }
        elseif ($action === 'delete_all_students') { $conn->query("DELETE FROM students"); echo json_encode(["status" => "success"]); }

        // --- ENROLLMENT ACTIONS ---
        elseif ($action === 'save_enrollment') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']); $sem = sanitize($conn, $input['semester']);
            $courses = (int)$input['courses']; $cr = (int)$input['cr']; $id = $input['id'] ?? null;
            if ($id && $id !== "-1" && is_numeric($id)) $conn->query("UPDATE enrollments SET reg_no='$reg', name='$name', semester='$sem', courses=$courses, cr=$cr WHERE id=$id");
            else $conn->query("INSERT INTO enrollments (reg_no, name, semester, courses, cr) VALUES ('$reg', '$name', '$sem', $courses, $cr)");
            echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'delete_enrollment') { $id = (int)$input['id']; $conn->query("DELETE FROM enrollments WHERE id = $id"); echo json_encode(["status" => "success"]); }
        elseif ($action === 'delete_all_enrollments') { $conn->query("TRUNCATE TABLE enrollments"); echo json_encode(["status" => "success"]); }

        // --- PAYMENT ACTIONS ---
        elseif ($action === 'save_payment') {
            $reg = sanitize($conn, $input['reg_no']); $name = sanitize($conn, $input['name']); $sem = sanitize($conn, $input['semester']);
            $amount = (float)$input['amount']; $date = sanitize($conn, $input['date']); $id = $input['id'] ?? null;
            if ($id && $id !== "-1" && is_numeric($id)) $conn->query("UPDATE payments SET reg_no='$reg', name='$name', semester='$sem', amount=$amount, date='$date' WHERE id=$id");
            else $conn->query("INSERT INTO payments (reg_no, name, semester, amount, date) VALUES ('$reg', '$name', '$sem', $amount, '$date')");
            echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'delete_payment') { $id = (int)$input['id']; $conn->query("DELETE FROM payments WHERE id = $id"); echo json_encode(["status" => "success"]); }
        elseif ($action === 'delete_all_payments') { $conn->query("TRUNCATE TABLE payments"); echo json_encode(["status" => "success"]); }

        // --- BULK IMPORTS ---
        elseif ($action === 'import_students') {
            $conn->begin_transaction(); $stmt = $conn->prepare("INSERT INTO students (reg_no, name, degree, batch, mobile) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), degree=VALUES(degree), batch=VALUES(batch), mobile=VALUES(mobile)");
            foreach ($input as $row) { $stmt->bind_param("sssss", $row['reg_no'], $row['name'], $row['degree'], $row['batch'], $row['mobile']); $stmt->execute(); }
            $conn->commit(); echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'import_enrollments') {
            $conn->begin_transaction(); $stmt = $conn->prepare("INSERT INTO enrollments (reg_no, name, semester, courses, cr) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE courses=VALUES(courses), cr=VALUES(cr)");
            foreach ($input as $row) { $stmt->bind_param("sssii", $row['reg_no'], $row['name'], $row['semester'], $row['courses'], $row['cr']); $stmt->execute(); }
            $conn->commit(); echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'import_discounts') {
            $conn->begin_transaction(); $stmt = $conn->prepare("INSERT INTO discounts (reg_no, name, term, discount) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE discount=VALUES(discount)");
            foreach ($input as $row) { $stmt->bind_param("sssd", $row['reg_no'], $row['name'], $row['term'], $row['discount']); $stmt->execute(); }
            $conn->commit(); echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'import_payments') {
            $conn->begin_transaction(); $stmt = $conn->prepare("INSERT INTO payments (reg_no, name, semester, amount, date) VALUES (?, ?, ?, ?, ?)");
            foreach ($input as $row) { $stmt->bind_param("sssds", $row['reg_no'], $row['name'], $row['semester'], $row['amount'], $row['date']); $stmt->execute(); }
            $conn->commit(); echo json_encode(["status" => "success"]);
        }
        elseif ($action === 'import_fees') {
            $conn->begin_transaction();
            $stmt = $conn->prepare("INSERT INTO fee_structure (degree, batch, year, semester, cr, per_cr_fee, tuition_fee, total_courses, exam_fee_per_subject, exam_fee, reg_fee, other_fee, paid, total_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($input as $r) {
                $stmt->bind_param("ssisiddidddddd", $r['degree'], $r['batch'], $r['year'], $r['semester'], $r['cr'], $r['per_cr_fee'], $r['tuition_fee'], $r['total_courses'], $r['exam_fee_per_subject'], $r['exam_fee'], $r['reg_fee'], $r['other_fee'], $r['paid'], $r['total_fee']);
                $stmt->execute();
            }
            $conn->commit(); echo json_encode(["status" => "success"]);
        }

        elseif ($action === 'reset') {
            $conn->query("SET FOREIGN_KEY_CHECKS = 0");
            $tables = ['students', 'fee_structure', 'enrollments', 'discounts', 'payments'];
            foreach($tables as $t) $conn->query("TRUNCATE TABLE $t");
            $conn->query("SET FOREIGN_KEY_CHECKS = 1");
            echo json_encode(["status" => "success"]);
        }
    }
} catch (Exception $e) { echo json_encode(["status" => "error", "message" => $e->getMessage()]); }
$conn->close();
?>
