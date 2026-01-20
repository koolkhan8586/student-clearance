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
    
    // --- AUTO-CREATE TABLES IF NOT EXIST ---
    $pdo->exec("CREATE TABLE IF NOT EXISTS students (id INT AUTO_INCREMENT PRIMARY KEY, reg_no VARCHAR(50) UNIQUE, name VARCHAR(100), degree VARCHAR(50), batch VARCHAR(50))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS fee_structure (id INT AUTO_INCREMENT PRIMARY KEY, degree VARCHAR(50), batch VARCHAR(50), per_cr_fee DECIMAL(10,2) DEFAULT 0, per_course_fee DECIMAL(10,2) DEFAULT 0, reg_fee DECIMAL(10,2) DEFAULT 0, other_fee DECIMAL(10,2) DEFAULT 0, UNIQUE KEY unique_fee (degree, batch))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS enrollments (id INT AUTO_INCREMENT PRIMARY KEY, reg_no VARCHAR(50), name VARCHAR(100), semester VARCHAR(50), cr DECIMAL(10,2), courses INT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS payments (id INT AUTO_INCREMENT PRIMARY KEY, reg_no VARCHAR(50), name VARCHAR(100), semester VARCHAR(50), amount DECIMAL(10,2), date DATE, bank VARCHAR(100))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS discounts (id INT AUTO_INCREMENT PRIMARY KEY, reg_no VARCHAR(50), name VARCHAR(100), term VARCHAR(50), discount DECIMAL(10,2))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS other_charges (id INT AUTO_INCREMENT PRIMARY KEY, reg_no VARCHAR(50), name VARCHAR(100), semester VARCHAR(50), fee_name VARCHAR(100), amount DECIMAL(10,2))");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE, password VARCHAR(255), role VARCHAR(20), permissions TEXT)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS banks (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) UNIQUE, account_no VARCHAR(100))");

    // Seed Admin if missing
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO users (username, password, role, permissions) VALUES ('admin', '123', 'admin', '[\"all\"]')");
    }

} catch (\PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'DB Connection Failed: ' . $e->getMessage()]);
    exit;
}

// --- HELPER: Date Formatter ---
function formatDateForDB($dateString) {
    if (empty($dateString)) return date('Y-m-d');
    $timestamp = strtotime($dateString);
    if ($timestamp === false) return date('Y-m-d');
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
            'users'       => $pdo->query("SELECT * FROM users")->fetchAll(),
            'banks'       => $pdo->query("SELECT * FROM banks")->fetchAll()
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
            // --- STUDENTS ---
            case 'save_student':
                // ENFORCE UPPERCASE REG NO
                $reg_no = strtoupper($data['reg_no']);
                
                // Auto-Detect Degree if empty
                $degree = $data['degree'];
                if (empty($degree)) {
                    if (preg_match('/^([A-Z0-9]+)05/', $reg_no, $matches)) {
                        $degree = $matches[1];
                    }
                }

                $stmt = $pdo->prepare("INSERT INTO students (reg_no, name, degree, batch) VALUES (?, ?, ?, ?) 
                                       ON DUPLICATE KEY UPDATE name=?, degree=?, batch=?");
                $stmt->execute([$reg_no, $data['name'], $degree, $data['batch'], 
                                $data['name'], $degree, $data['batch']]);
                break;
            
            case 'delete_student':
            case 'delete_students':
                $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- FEE STRUCTURE ---
            case 'save_fee':
                $sql = "INSERT INTO fee_structure (id, degree, batch, per_cr_fee, per_course_fee, reg_fee, other_fee) 
                        VALUES (?, ?, ?, ?, ?, ?, ?) 
                        ON DUPLICATE KEY UPDATE degree=?, batch=?, per_cr_fee=?, per_course_fee=?, reg_fee=?, other_fee=?";
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                
                $per_cr_fee = empty($data['per_cr_fee']) ? 0 : $data['per_cr_fee'];
                $per_course_fee = empty($data['per_course_fee']) ? 0 : $data['per_course_fee'];
                $reg_fee = empty($data['reg_fee']) ? 0 : $data['reg_fee'];
                $other_fee = empty($data['other_fee']) ? 0 : $data['other_fee'];

                $stmt = $pdo->prepare($sql);
                $stmt->execute([$dbId, $data['degree'], $data['batch'], $per_cr_fee, $per_course_fee, $reg_fee, $other_fee,
                                $data['degree'], $data['batch'], $per_cr_fee, $per_course_fee, $reg_fee, $other_fee]);
                break;
            
            case 'delete_fee':
            case 'delete_fees':
                $stmt = $pdo->prepare("DELETE FROM fee_structure WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- ENROLLMENTS ---
            case 'save_enrollment':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                $cr = empty($data['cr']) ? 0 : $data['cr'];
                $courses = empty($data['courses']) ? 0 : $data['courses'];
                $reg_no = strtoupper($data['reg_no']);

                $stmt = $pdo->prepare("INSERT INTO enrollments (id, reg_no, name, semester, cr, courses) VALUES (?, ?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, semester=?, cr=?, courses=?");
                $stmt->execute([$dbId, $reg_no, $data['name'], $data['semester'], $cr, $courses,
                                $reg_no, $data['name'], $data['semester'], $cr, $courses]);
                break;
            
            case 'delete_enrollment':
            case 'delete_enrollments':
                $stmt = $pdo->prepare("DELETE FROM enrollments WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- PAYMENTS ---
            case 'save_payment':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                $formattedDate = formatDateForDB($data['date'] ?? '');
                $amount = empty($data['amount']) ? 0 : $data['amount'];
                $reg_no = strtoupper($data['reg_no']);
                $bank = $data['bank'] ?? '';

                $stmt = $pdo->prepare("INSERT INTO payments (id, reg_no, name, semester, amount, date, bank) VALUES (?, ?, ?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, semester=?, amount=?, date=?, bank=?");
                $stmt->execute([$dbId, $reg_no, $data['name'], $data['semester'], $amount, $formattedDate, $bank,
                                $reg_no, $data['name'], $data['semester'], $amount, $formattedDate, $bank]);
                break;
            
            case 'delete_payment':
            case 'delete_payments':
                $stmt = $pdo->prepare("DELETE FROM payments WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- DISCOUNTS ---
            case 'save_discount':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                $rawDiscount = $data['discount'] ?? 0;
                $discount = floatval(str_replace('%', '', $rawDiscount));
                $reg_no = strtoupper($data['reg_no']);

                $stmt = $pdo->prepare("INSERT INTO discounts (id, reg_no, name, term, discount) VALUES (?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, term=?, discount=?");
                $stmt->execute([$dbId, $reg_no, $data['name'], $data['term'], $discount,
                                $reg_no, $data['name'], $data['term'], $discount]);
                break;
            
            case 'delete_discount':
            case 'delete_discounts': 
                $stmt = $pdo->prepare("DELETE FROM discounts WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- OTHER CHARGES ---
            case 'save_other':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                $amount = empty($data['amount']) ? 0 : $data['amount'];
                $reg_no = strtoupper($data['reg_no']);

                $stmt = $pdo->prepare("INSERT INTO other_charges (id, reg_no, name, semester, fee_name, amount) VALUES (?, ?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE reg_no=?, name=?, semester=?, fee_name=?, amount=?");
                $stmt->execute([$dbId, $reg_no, $data['name'], $data['semester'], $data['fee_name'], $amount,
                                $reg_no, $data['name'], $data['semester'], $data['fee_name'], $amount]);
                break;
            
            case 'delete_other':
            case 'delete_others':
                $stmt = $pdo->prepare("DELETE FROM other_charges WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- BANKS ---
            case 'save_bank':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                $stmt = $pdo->prepare("INSERT INTO banks (id, name, account_no) VALUES (?, ?, ?)
                                       ON DUPLICATE KEY UPDATE name=?, account_no=?");
                $stmt->execute([$dbId, $data['name'], $data['account_no'], $data['name'], $data['account_no']]);
                break;

            case 'delete_bank':
            case 'delete_banks':
                 $stmt = $pdo->prepare("DELETE FROM banks WHERE id = ?");
                 $stmt->execute([$id]);
                 break;

            // --- USERS ---
            case 'save_user':
                $dbId = (is_numeric($id) && $id > 0) ? $id : null;
                $perms = json_encode($data['permissions'] ?? []);
                $stmt = $pdo->prepare("INSERT INTO users (id, username, password, role, permissions) VALUES (?, ?, ?, ?, ?)
                                       ON DUPLICATE KEY UPDATE username=?, password=?, role=?, permissions=?");
                $stmt->execute([$dbId, $data['username'], $data['password'], $data['role'], $perms,
                                $data['username'], $data['password'], $data['role'], $perms]);
                break;
            
            case 'delete_user':
            case 'delete_users':
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- BULK OPERATIONS ---
            case 'delete_all':
                $table = $input['table']; 
                $allowed = ['students', 'fee_structure', 'enrollments', 'payments', 'discounts', 'other_charges', 'users', 'banks'];
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
