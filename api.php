<?php
// api.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// --- DATABASE CONFIGURATION ---
$host = "localhost";
$user = "koolkhan";      // CHANGE THIS to your database username
$pass = "Mangohair@197";  // CHANGE THIS to your database password
$dbname = "fee_system";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]));
}

$action = $_GET['action'] ?? '';

// --- HELPER FUNCTIONS ---
function sanitize($conn, $input) {
    if (is_array($input)) {
        return array_map(function($item) use ($conn) { return sanitize($conn, $item); }, $input);
    }
    return $conn->real_escape_string($input);
}

// --- API ROUTES ---

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // Fetch all data for initial load
    if ($action === 'fetch_all') {
        $data = [
            'students' => [],
            'fees' => [],
            'enrollments' => [],
            'discounts' => []
        ];

        $res = $conn->query("SELECT * FROM students");
        while($row = $res->fetch_assoc()) $data['students'][] = $row;

        $res = $conn->query("SELECT * FROM fee_structure");
        while($row = $res->fetch_assoc()) $data['fees'][] = $row;

        $res = $conn->query("SELECT * FROM enrollments");
        while($row = $res->fetch_assoc()) $data['enrollments'][] = $row;

        $res = $conn->query("SELECT * FROM discounts");
        while($row = $res->fetch_assoc()) $data['discounts'][] = $row;

        echo json_encode(['status' => 'success', 'data' => $data]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // 1. Save Student (Single - Insert or Update)
    if ($action === 'save_student') {
        $reg = sanitize($conn, $input['reg_no']);
        $name = sanitize($conn, $input['name']);
        $deg = sanitize($conn, $input['degree']);
        $batch = sanitize($conn, $input['batch']);
        $mob = sanitize($conn, $input['mobile']);

        // Check if updating or new (Frontend handles duplicates for new)
        $sql = "INSERT INTO students (reg_no, name, degree, batch, mobile) 
                VALUES ('$reg', '$name', '$deg', '$batch', '$mob')
                ON DUPLICATE KEY UPDATE name='$name', degree='$deg', batch='$batch', mobile='$mob'";
        
        if ($conn->query($sql)) echo json_encode(["status" => "success"]);
        else echo json_encode(["status" => "error", "message" => $conn->error]);
        exit;
    }

    // 2. Delete Student (Single)
    if ($action === 'delete_student') {
        $reg = sanitize($conn, $input['reg_no']);
        $sql = "DELETE FROM students WHERE reg_no = '$reg'";
        if ($conn->query($sql)) echo json_encode(["status" => "success"]);
        else echo json_encode(["status" => "error", "message" => $conn->error]);
        exit;
    }

    // 3. Delete All Students
    if ($action === 'delete_all_students') {
        if ($conn->query("DELETE FROM students")) echo json_encode(["status" => "success"]);
        else echo json_encode(["status" => "error", "message" => $conn->error]);
        exit;
    }

    // 4. Save Fee Structure (Single)
    if ($action === 'save_fee') {
        $d = sanitize($conn, $input);
        $sql = "INSERT INTO fee_structure 
                (degree, batch, year, semester, cr, per_cr_fee, tuition_fee, total_courses, exam_fee_per_subject, exam_fee, reg_fee, other_fee, paid, total_fee)
                VALUES ('{$d['degree']}', '{$d['batch']}', '{$d['year']}', '{$d['semester']}', '{$d['cr']}', '{$d['per_cr_fee']}', '{$d['tuition_fee']}', '{$d['total_courses']}', '{$d['exam_fee_per_subject']}', '{$d['exam_fee']}', '{$d['reg_fee']}', '{$d['other_fee']}', '{$d['paid']}', '{$d['total_fee']}')";
        
        if ($conn->query($sql)) echo json_encode(["status" => "success"]);
        else echo json_encode(["status" => "error", "message" => $conn->error]);
        exit;
    }

    // 5. Bulk Import Students
    if ($action === 'import_students') {
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO students (reg_no, name, degree, batch, mobile) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), degree=VALUES(degree), batch=VALUES(batch), mobile=VALUES(mobile)");
            foreach ($input as $row) {
                $stmt->bind_param("sssss", $row['reg_no'], $row['name'], $row['degree'], $row['batch'], $row['mobile']);
                $stmt->execute();
            }
            $conn->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // 6. Bulk Import Enrollments
    if ($action === 'import_enrollments') {
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO enrollments (reg_no, name, semester, courses, cr) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE courses=VALUES(courses), cr=VALUES(cr)");
            foreach ($input as $row) {
                $stmt->bind_param("sssii", $row['reg_no'], $row['name'], $row['semester'], $row['courses'], $row['cr']);
                $stmt->execute();
            }
            $conn->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // 7. Bulk Import Discounts
    if ($action === 'import_discounts') {
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO discounts (reg_no, name, term, discount) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE discount=VALUES(discount)");
            foreach ($input as $row) {
                $stmt->bind_param("sssd", $row['reg_no'], $row['name'], $row['term'], $row['discount']);
                $stmt->execute();
            }
            $conn->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        exit;
    }

    // 8. Reset System
    if ($action === 'reset') {
        $conn->query("TRUNCATE TABLE students");
        $conn->query("TRUNCATE TABLE fee_structure");
        $conn->query("TRUNCATE TABLE enrollments");
        $conn->query("TRUNCATE TABLE discounts");
        echo json_encode(["status" => "success"]);
        exit;
    }
}

$conn->close();
?>
