<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// --- DATABASE CONFIGURATION ---
$host = 'localhost';
$db   = 'fee_system';
$user = 'koolkhan';
$pass = 'Mangohair@197'; // <--- ENTER YOUR DATABASE PASSWORD HERE IF SET

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'DB Connection Failed: ' . $e->getMessage()]);
    exit;
}

// --- HELPER: Date Formatter ---
function formatDateForDB($dateString) {
    if (empty($dateString)) return date('Y-m-d'); // Default to today if empty
    // Convert strings like '20-Nov-25' to '2025-11-20'
    $timestamp = strtotime($dateString);
    if ($timestamp === false) return date('Y-m-d'); // Fallback
    return date('Y-m-d', $timestamp);
}

// --- HANDLE REQUESTS ---

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// GET Request: Fetch All Data (Load App)
if ($method === 'GET') {
    try {
        $data = [
            'students'    => $pdo->query("SELECT * FROM students")->fetchAll(),
            'fees'        => $pdo->query("SELECT * FROM fee_structure")->fetchAll(),
            'enrollments' => $pdo->query("SELECT * FROM enrollments")->fetchAll(),
            'payments'    => $pdo->query("SELECT * FROM payments")->fetchAll(),
            'discounts'   => $pdo->query("SELECT * FROM discounts")->fetchAll(),
            'others'      => $pdo->query("SELECT * FROM other_charges")->fetchAll(),
            'users'       => $pdo->query("SELECT * FROM users")->fetchAll()
        ];
        
        foreach ($data['users'] as &$u) {
            $u['permissions'] = json_decode($u['permissions'] ?? '[]');
        }

        echo json_encode($data);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// POST Request: Actions (Save/Delete)
if ($method === 'POST' && isset($input['action'])) {
    $action = $input['action'];
    $data   = $input['data'] ?? [];
    $id     = $input['id'] ?? null;

    try {
        switch ($action) {
            case 'save_student':
                $stmt = $pdo->prepare("INSERT INTO students (reg_no, name, degree, batch) VALUES (?, ?, ?, ?) 
                                       ON DUPLICATE KEY UPDATE name=?, degree=?, batch=?");
                $stmt->execute([$data['reg_no'], $data['name'], $data['degree'], $data['batch'], 
                                $data['name'], $data['degree'], $data['batch']]);
                break;
            case 'delete_student':
                $stmt = $pdo->prepare("DELETE FROM students WHERE reg_no = ?");
                $stmt->execute([$id]);
                break;

            case 'save_fee':
                $sql = "INSERT INTO fee_structure (id, degree, batch, per_cr_fee, per_course_fee, reg_fee, other_fee) 
                        VALUES (?, ?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE degree=?, batch=?, per_cr_fee=?, per_course_fee=?, reg_fee=?, other_fee=?";
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                
                // Sanitize numeric fields to prevent SQL errors on empty strings
                $per_cr_fee = empty($data['per_cr_fee']) ? 0 : $data['per_cr_fee'];
                $per_course_fee = empty($data['per_course_fee']) ? 0 : $data['per_course_fee'];
                $reg_fee = empty($data['reg_fee']) ? 0 : $data['reg_fee'];
                $other_fee = empty($data['other_fee']) ? 0 : $data['other_fee'];

                $stmt = $pdo->prepare($sql);
                $stmt->execute([$dbId, $data['degree'], $data['batch'], $per_cr_fee, $per_course_fee, $reg_fee, $other_fee,
                                $data['degree'], $data['batch'], $per_cr_fee, $per_course_fee, $reg_fee, $other_fee]);
                break;
            case 'delete_fee':
                $stmt = $pdo->prepare("DELETE FROM fee_structure WHERE id = ?");
                $stmt->execute([$id]);
                break;

            case 'save_enrollment':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                
                // Sanitize numeric fields
                $cr = empty($data['cr']) ? 0 : $data['cr'];
                $courses = empty($data['courses']) ? 0 : $data['courses'];

                $stmt = $pdo->prepare("INSERT INTO enrollments (id, reg_no, name, semester, cr, courses) VALUES (?, ?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, semester=?, cr=?, courses=?");
                $stmt->execute([$dbId, $data['reg_no'], $data['name'], $data['semester'], $cr, $courses,
                                $data['reg_no'], $data['name'], $data['semester'], $cr, $courses]);
                break;
            case 'delete_enrollment':
                $stmt = $pdo->prepare("DELETE FROM enrollments WHERE id = ?");
                $stmt->execute([$id]);
                break;

            case 'save_payment':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                
                // FIX: Apply Date Formatter and Sanitize Amount
                $formattedDate = formatDateForDB($data['date'] ?? '');
                $amount = empty($data['amount']) ? 0 : $data['amount'];

                $stmt = $pdo->prepare("INSERT INTO payments (id, reg_no, name, semester, amount, date) VALUES (?, ?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, semester=?, amount=?, date=?");
                $stmt->execute([$dbId, $data['reg_no'], $data['name'], $data['semester'], $amount, $formattedDate,
                                $data['reg_no'], $data['name'], $data['semester'], $amount, $formattedDate]);
                break;
            case 'delete_payment':
                $stmt = $pdo->prepare("DELETE FROM payments WHERE id = ?");
                $stmt->execute([$id]);
                break;

            case 'save_discount':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                
                // Sanitize numeric fields
                $discount = empty($data['discount']) ? 0 : $data['discount'];

                $stmt = $pdo->prepare("INSERT INTO discounts (id, reg_no, name, term, discount) VALUES (?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, term=?, discount=?");
                $stmt->execute([$dbId, $data['reg_no'], $data['name'], $data['term'], $discount,
                                $data['reg_no'], $data['name'], $data['term'], $discount]);
                break;
            
            // FIX: Added 'delete_discounts' to handle plural form from frontend
            case 'delete_discount':
            case 'delete_discounts': 
                $stmt = $pdo->prepare("DELETE FROM discounts WHERE id = ?");
                $stmt->execute([$id]);
                break;

            case 'save_other':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                
                // Sanitize numeric fields
                $amount = empty($data['amount']) ? 0 : $data['amount'];

                $stmt = $pdo->prepare("INSERT INTO other_charges (id, reg_no, name, semester, fee_name, amount) VALUES (?, ?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, semester=?, fee_name=?, amount=?");
                $stmt->execute([$dbId, $data['reg_no'], $data['name'], $data['semester'], $data['fee_name'], $amount,
                                $data['reg_no'], $data['name'], $data['semester'], $data['fee_name'], $amount]);
                break;
            case 'delete_other':
                $stmt = $pdo->prepare("DELETE FROM other_charges WHERE id = ?");
                $stmt->execute([$id]);
                break;

            case 'save_user':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                $perms = json_encode($data['permissions'] ?? []);
                $stmt = $pdo->prepare("INSERT INTO users (id, username, password, role, permissions) VALUES (?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE username=?, password=?, role=?, permissions=?");
                $stmt->execute([$dbId, $data['username'], $data['password'], $data['role'], $perms,
                                $data['username'], $data['password'], $data['role'], $perms]);
                break;
            case 'delete_user':
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$id]);
                break;

            case 'delete_all':
                $table = $input['table']; 
                $allowed = ['students', 'fee_structure', 'enrollments', 'payments', 'discounts', 'other_charges', 'users'];
                $map = ['fees' => 'fee_structure', 'others' => 'other_charges'];
                if(isset($map[$table])) $table = $map[$table];
                
                if (in_array($table, $allowed)) {
                    $pdo->query("TRUNCATE TABLE $table");
                }
                break;
            
            case 'delete_semester':
                 $table = $input['table'];
                 $term = $input['term'];
                 $allowed = ['enrollments', 'payments', 'other_charges'];
                 $map = ['others' => 'other_charges'];
                 if(isset($map[$table])) $table = $map[$table];

                 if(in_array($table, $allowed) && $term) {
                     $stmt = $pdo->prepare("DELETE FROM $table WHERE semester LIKE ?");
                     $stmt->execute(["%$term%"]);
                 }
                 break;

            default:
                throw new Exception("Invalid Action: $action");
        }
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
?>
