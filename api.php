<?php
session_cache_limiter('');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");

function requireAuth() {
    if (empty($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
        exit;
    }
}

const DEFAULT_MESSAGE_TEMPLATE = "Dear {name},\n\nYour Fee Clearance Report is ready.\n\nRegistration No: {reg_no}\nDegree Program: {degree}\nBatch/Session: {batch}\n\nTotal Scholarship: {scholarship}\nNet Payable: {net_payable}\n\nRegards,\n{from_name}";

function requireAdmin() {
    requireAuth();
    if (($_SESSION['user']['role'] ?? '') !== 'admin') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Admin access required']);
        exit;
    }
}

// --- Minimal SMTP client (no external dependencies) ---
// Builds a multipart/mixed body (text + one attachment) when $attachment is given
// (['filename' => ..., 'mimeType' => ..., 'content' => raw bytes]), otherwise just
// returns the plain text body unchanged. Returns [boundary-or-null, body-string].
function buildMimeBody($textBody, $attachment) {
    if (!$attachment) return [null, $textBody];
    $boundary = 'b' . md5(uniqid('', true));
    $mime = "--$boundary\r\n";
    $mime .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $mime .= $textBody . "\r\n\r\n";
    $mime .= "--$boundary\r\n";
    $mime .= "Content-Type: {$attachment['mimeType']}; name=\"{$attachment['filename']}\"\r\n";
    $mime .= "Content-Transfer-Encoding: base64\r\n";
    $mime .= "Content-Disposition: attachment; filename=\"{$attachment['filename']}\"\r\n\r\n";
    $mime .= chunk_split(base64_encode($attachment['content']));
    $mime .= "--$boundary--";
    return [$boundary, $mime];
}

function sendSmtpMail($host, $port, $username, $password, $fromEmail, $fromName, $toEmail, $subject, $body, $attachment = null) {
    $secure = ($port == 465) ? 'ssl://' : '';
    $sock = @fsockopen($secure . $host, $port, $errno, $errstr, 15);
    if (!$sock) {
        throw new Exception(
            "Could not connect to $host:$port ($errstr). This server could not reach the SMTP host at all — " .
            "usually the hosting provider blocks outbound mail ports (25/465/587), the host/port in Settings is " .
            "wrong, or the mail server only accepts connections from specific IPs. Check the host/port first, " .
            "then ask your hosting provider whether outbound SMTP is allowed and try the other common port " .
            "(465 for implicit TLS, 587 for STARTTLS)."
        );
    }
    stream_set_timeout($sock, 15);

    $expect = function ($sock, $codes) {
        $response = '';
        while ($line = fgets($sock, 515)) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        $code = (int) substr($response, 0, 3);
        if (!in_array($code, (array) $codes)) {
            throw new Exception("SMTP error: " . trim($response));
        }
        return $response;
    };

    $send = function ($sock, $cmd) { fwrite($sock, $cmd . "\r\n"); };

    $expect($sock, 220);
    $send($sock, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
    $expect($sock, 250);

    if ($port == 587) {
        $send($sock, "STARTTLS");
        $expect($sock, 220);
        if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new Exception("Failed to enable TLS");
        }
        $send($sock, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
        $expect($sock, 250);
    }

    $send($sock, "AUTH LOGIN");
    $expect($sock, 334);
    $send($sock, base64_encode($username));
    $expect($sock, 334);
    $send($sock, base64_encode($password));
    $expect($sock, 235);

    $send($sock, "MAIL FROM:<$fromEmail>");
    $expect($sock, 250);
    $send($sock, "RCPT TO:<$toEmail>");
    $expect($sock, [250, 251]);
    $send($sock, "DATA");
    $expect($sock, 354);

    list($boundary, $mimeBody) = buildMimeBody($body, $attachment);

    $headers = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$fromEmail>\r\n";
    $headers .= "To: <$toEmail>\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= $boundary
        ? "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n"
        : "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Date: " . date('r') . "\r\n";

    $escapedBody = preg_replace('/^\./m', '..', $mimeBody);
    $send($sock, $headers . "\r\n" . $escapedBody . "\r\n.");
    $expect($sock, 250);

    $send($sock, "QUIT");
    fclose($sock);
    return true;
}

// --- Fallback: PHP's built-in mail() function, used when a raw SMTP socket
// connection can't be established (many hosts block outbound SMTP ports for
// customer scripts but still relay mail() through their own local MTA). ---
function sendPhpMail($fromEmail, $fromName, $toEmail, $subject, $body, $attachment = null) {
    list($boundary, $mimeBody) = buildMimeBody($body, $attachment);

    $headers = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$fromEmail>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= $boundary
        ? "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n"
        : "Content-Type: text/plain; charset=UTF-8\r\n";
    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";

    // Reset the last-error tracker first — otherwise a stale warning from an earlier
    // suppressed call (e.g. the SMTP attempt's @fsockopen) leaks into this message,
    // since error_get_last() is global and not scoped to this call.
    error_clear_last();
    $ok = @mail($toEmail, $encodedSubject, $mimeBody, $headers, "-f$fromEmail");
    if (!$ok) {
        $err = error_get_last();
        throw new Exception("PHP mail() also failed" . (!empty($err['message']) ? ": " . $err['message'] : " (mail() returned false with no error detail — this usually means no local mail transfer agent/sendmail is configured on this server)"));
    }
    return true;
}

// --- Shared HTTP POST helper (curl if available, stream-context fallback otherwise) ---
// Returns [httpCode, responseBody]. Throws on a connection-level failure (no response
// at all) — an HTTP error status is returned normally so callers can read the body.
function httpPostJson($url, $headers, $payloadJson, $serviceName) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payloadJson,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr) throw new Exception("$serviceName connection failed: $curlErr");
        return [$httpCode, $response];
    }

    // Fall back to a stream-context HTTP request if the curl extension isn't available
    if (!ini_get('allow_url_fopen')) {
        throw new Exception("Neither the PHP curl extension nor allow_url_fopen is enabled on this server. Ask your host to enable one of them.");
    }
    $context = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => implode("\r\n", $headers),
            'content'       => $payloadJson,
            'timeout'       => 20,
            'ignore_errors' => true,
        ],
    ]);
    $response = @file_get_contents($url, false, $context);
    if ($response === false) {
        $err = error_get_last();
        throw new Exception("$serviceName connection failed: " . ($err['message'] ?? 'unknown error'));
    }
    $httpCode = 200;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
        $httpCode = (int) $m[1];
    }
    return [$httpCode, $response];
}

// --- Minimal WAHA (WhatsApp HTTP API) client ---
function sendWahaText($baseUrl, $session, $apiKey, $chatId, $text) {
    $url = rtrim($baseUrl, '/') . '/api/sendText';
    $payload = json_encode([
        'session' => $session ?: 'default',
        'chatId'  => $chatId,
        'text'    => $text,
    ]);

    $headers = ['Content-Type: application/json'];
    if (!empty($apiKey)) $headers[] = 'X-Api-Key: ' . $apiKey;

    list($httpCode, $response) = httpPostJson($url, $headers, $payload, 'WAHA');
    if ($httpCode < 200 || $httpCode >= 300) throw new Exception("WAHA error ($httpCode): $response");
    return true;
}

// --- Brevo (transactional email API) client — sends over HTTPS, so it isn't
// affected by a host blocking raw outbound SMTP ports. ---
function sendBrevoEmail($apiKey, $fromEmail, $fromName, $toEmail, $subject, $body, $attachment = null) {
    $payload = [
        'sender'      => ['name' => $fromName, 'email' => $fromEmail],
        'to'          => [['email' => $toEmail]],
        'subject'     => $subject,
        'textContent' => $body,
    ];
    if ($attachment) {
        $payload['attachment'] = [[
            'content' => base64_encode($attachment['content']),
            'name'    => $attachment['filename'],
        ]];
    }

    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
        'api-key: ' . $apiKey,
    ];

    list($httpCode, $response) = httpPostJson('https://api.brevo.com/v3/smtp/email', $headers, json_encode($payload), 'Brevo');
    if ($httpCode < 200 || $httpCode >= 300) throw new Exception("Brevo error ($httpCode): $response");
    return true;
}

// --- Gmail API (Google Workspace) client, authenticated as a service account
// with domain-wide delegation. Sends over HTTPS via Google's REST API rather
// than raw SMTP, so it isn't affected by a host blocking outbound SMTP ports. ---
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function getGoogleAccessToken($serviceAccountJson, $delegatedUser) {
    $creds = json_decode($serviceAccountJson, true);
    if (!$creds || empty($creds['client_email']) || empty($creds['private_key'])) {
        throw new Exception("Invalid Google service account JSON — check it was pasted in full and correctly under Settings.");
    }

    $now = time();
    $header = ['alg' => 'RS256', 'typ' => 'JWT'];
    $claims = [
        'iss'   => $creds['client_email'],
        'scope' => 'https://www.googleapis.com/auth/gmail.send',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'exp'   => $now + 3600,
        'iat'   => $now,
        'sub'   => $delegatedUser,
    ];

    $signingInput = base64UrlEncode(json_encode($header)) . '.' . base64UrlEncode(json_encode($claims));
    $signature = '';
    $signed = openssl_sign($signingInput, $signature, $creds['private_key'], 'sha256WithRSAEncryption');
    if (!$signed) throw new Exception("Failed to sign the Google auth request — the service account private key looks invalid.");
    $jwt = $signingInput . '.' . base64UrlEncode($signature);

    $postFields = http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $jwt,
    ]);

    if (function_exists('curl_init')) {
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $postFields,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);
        if ($curlErr) throw new Exception("Google auth connection failed: $curlErr");
    } else {
        if (!ini_get('allow_url_fopen')) {
            throw new Exception("Neither the PHP curl extension nor allow_url_fopen is enabled on this server.");
        }
        $context = stream_context_create(['http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content'       => $postFields,
            'timeout'       => 20,
            'ignore_errors' => true,
        ]]);
        $response = @file_get_contents('https://oauth2.googleapis.com/token', false, $context);
        if ($response === false) {
            $err = error_get_last();
            throw new Exception("Google auth connection failed: " . ($err['message'] ?? 'unknown error'));
        }
        $httpCode = 200;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $httpCode = (int) $m[1];
        }
    }

    $json = json_decode($response, true);
    if ($httpCode < 200 || $httpCode >= 300 || empty($json['access_token'])) {
        throw new Exception("Google auth failed ($httpCode): $response");
    }
    return $json['access_token'];
}

function sendGmailApiEmail($accessToken, $fromEmail, $fromName, $toEmail, $subject, $body, $attachment = null) {
    list($boundary, $mimeBody) = buildMimeBody($body, $attachment);

    $headers = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$fromEmail>\r\n";
    $headers .= "To: <$toEmail>\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= $boundary
        ? "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n"
        : "Content-Type: text/plain; charset=UTF-8\r\n";

    $rawMessage = base64UrlEncode($headers . "\r\n" . $mimeBody);

    list($httpCode, $response) = httpPostJson(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        ['Content-Type: application/json', 'Authorization: Bearer ' . $accessToken],
        json_encode(['raw' => $rawMessage]),
        'Gmail API'
    );
    if ($httpCode < 200 || $httpCode >= 300) throw new Exception("Gmail API error ($httpCode): $response");
    return true;
}

function normalizeWahaChatId($number) {
    $digits = preg_replace('/\D/', '', $number);
    return $digits . '@c.us';
}

// --- DATABASE CONFIGURATION ---
$host = 'localhost';
$db   = 'fee_system';
$user = 'koolkhan';
$pass = 'Mangohair@197'; // Ensure this is correct

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
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        waha_url VARCHAR(255), waha_session VARCHAR(100), waha_api_key VARCHAR(255),
        smtp_host VARCHAR(255), smtp_port INT, smtp_username VARCHAR(255), smtp_password VARCHAR(255),
        smtp_from_email VARCHAR(255), smtp_from_name VARCHAR(255)
    )");
    $pdo->exec("INSERT IGNORE INTO settings (id) VALUES (1)");

    // --- BULLETPROOF AUTO-COLUMN ADDER ---
    // This safely forces missing columns into existing tables without crashing
    function ensureColumn($pdo, $table, $column, $definition) {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
        $stmt->execute([$column]);
        if ($stmt->rowCount() == 0) {
            try {
                $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
            } catch (\PDOException $e) {
                // If the DB user lacks ALTER permissions, this fails silently to avoid
                // breaking the whole API on every request — but leave a trace in the PHP
                // error log (visible via most hosting control panels) so a resulting
                // "Unknown column" error elsewhere is diagnosable instead of a mystery.
                error_log("ensureColumn: could not add $table.$column — " . $e->getMessage());
            }
        }
    }

    try {
        ensureColumn($pdo, 'payments', 'bank', 'VARCHAR(100) DEFAULT NULL');
        ensureColumn($pdo, 'students', 'mobile', 'VARCHAR(50) DEFAULT NULL');
        ensureColumn($pdo, 'students', 'email', 'VARCHAR(100) DEFAULT NULL');
        ensureColumn($pdo, 'students', 'total_package', 'DECIMAL(10,2) DEFAULT NULL');
        ensureColumn($pdo, 'settings', 'brevo_api_key', 'VARCHAR(255) DEFAULT NULL');
        ensureColumn($pdo, 'settings', 'google_service_account_json', 'TEXT DEFAULT NULL');
        ensureColumn($pdo, 'settings', 'google_delegated_user', 'VARCHAR(255) DEFAULT NULL');
        ensureColumn($pdo, 'settings', 'message_template', 'TEXT DEFAULT NULL');
    } catch (\Exception $e) {}

    // Seed Admin if missing
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $defaultHash = password_hash('123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, password, role, permissions) VALUES ('admin', ?, 'admin', '[\"all\"]')");
        $stmt->execute([$defaultHash]);
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
    requireAuth();
    try {
        $data = [
            'students'    => $pdo->query("SELECT * FROM students ORDER BY id DESC")->fetchAll(),
            'fees'        => $pdo->query("SELECT * FROM fee_structure ORDER BY id DESC")->fetchAll(),
            'enrollments' => $pdo->query("SELECT * FROM enrollments ORDER BY id DESC")->fetchAll(),
            'payments'    => $pdo->query("SELECT * FROM payments ORDER BY id DESC")->fetchAll(),
            'discounts'   => $pdo->query("SELECT * FROM discounts ORDER BY id DESC")->fetchAll(),
            'others'      => $pdo->query("SELECT * FROM other_charges ORDER BY id DESC")->fetchAll(),
            'users'       => $pdo->query("SELECT * FROM users ORDER BY id DESC")->fetchAll(),
            'banks'       => $pdo->query("SELECT * FROM banks ORDER BY id DESC")->fetchAll()
        ];
        
        foreach ($data['users'] as &$u) {
            $u['permissions'] = json_decode($u['permissions'] ?? '[]');
            unset($u['password']);
        }

        // Return the clean data structure directly
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

    // --- LOGIN / LOGOUT (do not require an existing session) ---
    if ($action === 'login') {
        try {
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $u = $stmt->fetch();

            $valid = $u && password_verify($password, $u['password']);

            // One-time transparent upgrade path for pre-existing plaintext passwords
            if (!$valid && $u && hash_equals((string) $u['password'], (string) $password)) {
                $valid = true;
                $newHash = password_hash($password, PASSWORD_DEFAULT);
                $upd = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                $upd->execute([$newHash, $u['id']]);
            }

            if ($valid) {
                $sessionUser = [
                    'id'          => $u['id'],
                    'username'    => $u['username'],
                    'role'        => $u['role'],
                    'permissions' => json_decode($u['permissions'] ?? '[]'),
                ];
                $_SESSION['user'] = $sessionUser;
                echo json_encode(['status' => 'success', 'user' => $sessionUser]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Invalid username or password']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Login failed']);
        }
        exit;
    }

    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        echo json_encode(['status' => 'success']);
        exit;
    }

    requireAuth();

    if ($action === 'change_password') {
        try {
            $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user']['id']]);
            $row = $stmt->fetch();
            if (!$row || !password_verify($data['current'] ?? '', $row['password'])) {
                echo json_encode(['status' => 'error', 'message' => 'Incorrect current password']);
                exit;
            }
            $newHash = password_hash($data['new'] ?? '', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$newHash, $_SESSION['user']['id']]);
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'get_settings') {
        requireAdmin();
        $row = $pdo->query("SELECT * FROM settings WHERE id = 1")->fetch();
        if ($row) {
            $row['has_waha_api_key'] = !empty($row['waha_api_key']);
            $row['has_smtp_password'] = !empty($row['smtp_password']);
            $row['has_brevo_api_key'] = !empty($row['brevo_api_key']);
            $row['has_google_service_account'] = !empty($row['google_service_account_json']);
            unset($row['waha_api_key'], $row['smtp_password'], $row['brevo_api_key'], $row['google_service_account_json']);
        }
        echo json_encode(['status' => 'success', 'settings' => $row]);
        exit;
    }

    if ($action === 'save_settings') {
        requireAdmin();
        try {
            $current = $pdo->query("SELECT * FROM settings WHERE id = 1")->fetch();
            $wahaApiKey = !empty($data['waha_api_key']) ? $data['waha_api_key'] : $current['waha_api_key'];
            $smtpPassword = !empty($data['smtp_password']) ? $data['smtp_password'] : $current['smtp_password'];
            $brevoApiKey = !empty($data['brevo_api_key']) ? $data['brevo_api_key'] : $current['brevo_api_key'];
            $googleServiceAccountJson = !empty($data['google_service_account_json']) ? $data['google_service_account_json'] : $current['google_service_account_json'];

            $stmt = $pdo->prepare("UPDATE settings SET
                waha_url = ?, waha_session = ?, waha_api_key = ?,
                smtp_host = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?,
                smtp_from_email = ?, smtp_from_name = ?, brevo_api_key = ?,
                google_service_account_json = ?, google_delegated_user = ?, message_template = ?
                WHERE id = 1");
            $stmt->execute([
                $data['waha_url'] ?? '', $data['waha_session'] ?? '', $wahaApiKey,
                $data['smtp_host'] ?? '', $data['smtp_port'] ?? null, $data['smtp_username'] ?? '', $smtpPassword,
                $data['smtp_from_email'] ?? '', $data['smtp_from_name'] ?? '', $brevoApiKey,
                $googleServiceAccountJson, $data['google_delegated_user'] ?? '', $data['message_template'] ?? '',
            ]);
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'send_clearance') {
        try {
            $channel = $data['channel'] ?? '';
            $recipient = trim($data['recipient'] ?? '');
            $subject = $data['subject'] ?? 'Fee Clearance Report';

            if (!$recipient) throw new Exception("Recipient is required");

            $settings = $pdo->query("SELECT * FROM settings WHERE id = 1")->fetch();

            $template = !empty($settings['message_template']) ? $settings['message_template'] : DEFAULT_MESSAGE_TEMPLATE;
            $message = strtr($template, [
                '{name}'        => $data['student_name'] ?? '',
                '{reg_no}'      => $data['reg_no'] ?? '',
                '{degree}'      => $data['degree'] ?? '',
                '{batch}'       => $data['batch'] ?? '',
                '{scholarship}' => $data['scholarship'] ?? '',
                '{net_payable}' => $data['net_payable'] ?? '',
                '{from_name}'   => $settings['smtp_from_name'] ?: 'Fee Manager',
            ]);

            $attachment = null;
            if (!empty($data['attachment'])) {
                $raw = $data['attachment'];
                if (strpos($raw, 'base64,') !== false) {
                    $raw = substr($raw, strpos($raw, 'base64,') + 7);
                }
                $decoded = base64_decode($raw, true);
                if ($decoded === false) throw new Exception("Attachment could not be decoded");
                if (strlen($decoded) > 10 * 1024 * 1024) throw new Exception("Attachment is too large (max 10MB)");
                $attachment = [
                    'filename' => $data['attachmentName'] ?? 'attachment.pdf',
                    'mimeType' => 'application/pdf',
                    'content'  => $decoded,
                ];
            }

            if ($channel === 'email') {
                $haveGoogle = !empty($settings['google_service_account_json']) && !empty($settings['google_delegated_user']);
                $haveBrevo = !empty($settings['brevo_api_key']);
                $haveSmtp = !empty($settings['smtp_host']) && !empty($settings['smtp_username']) && !empty($settings['smtp_password']);
                if (!$haveGoogle && !$haveBrevo && !$haveSmtp) {
                    throw new Exception("Email is not configured yet. Ask an admin to set it up under Settings.");
                }
                $fromName = $settings['smtp_from_name'] ?: 'Fee Manager';
                $fromEmail = $settings['smtp_from_email'] ?: $settings['smtp_username'];

                // Try every configured method in priority order and stop at the first
                // success — a method being configured doesn't guarantee it currently
                // works (e.g. domain-wide delegation not finished yet), so a
                // higher-priority method failing should still fall through to a
                // lower one that might.
                $sent = false;
                $errors = [];

                if (!$sent && $haveGoogle) {
                    try {
                        $accessToken = getGoogleAccessToken($settings['google_service_account_json'], $settings['google_delegated_user']);
                        sendGmailApiEmail($accessToken, $settings['google_delegated_user'], $fromName, $recipient, $subject, $message, $attachment);
                        $sent = true;
                    } catch (\Throwable $e) {
                        $errors[] = "Gmail API: " . $e->getMessage();
                    }
                }

                if (!$sent && $haveBrevo) {
                    try {
                        sendBrevoEmail($settings['brevo_api_key'], $fromEmail, $fromName, $recipient, $subject, $message, $attachment);
                        $sent = true;
                    } catch (\Throwable $e) {
                        $errors[] = "Brevo: " . $e->getMessage();
                    }
                }

                if (!$sent && $haveSmtp) {
                    try {
                        sendSmtpMail(
                            $settings['smtp_host'], $settings['smtp_port'] ?: 587,
                            $settings['smtp_username'], $settings['smtp_password'],
                            $fromEmail, $fromName,
                            $recipient, $subject, $message, $attachment
                        );
                        $sent = true;
                    } catch (\Throwable $smtpError) {
                        // Many hosts block raw outbound SMTP sockets for customer scripts but
                        // still relay PHP's mail() through their own local mail transfer agent —
                        // worth a shot before giving up.
                        try {
                            sendPhpMail($fromEmail, $fromName, $recipient, $subject, $message, $attachment);
                            $sent = true;
                        } catch (\Throwable $mailError) {
                            $errors[] = "SMTP: " . $smtpError->getMessage() . " | mail(): " . $mailError->getMessage();
                        }
                    }
                }

                if (!$sent) {
                    throw new Exception(implode(' — ', $errors));
                }
            } elseif ($channel === 'whatsapp') {
                if (empty($settings['waha_url'])) {
                    throw new Exception("WhatsApp is not configured yet. Ask an admin to set it up under Settings.");
                }
                sendWahaText($settings['waha_url'], $settings['waha_session'], $settings['waha_api_key'], normalizeWahaChatId($recipient), $message);
            } else {
                throw new Exception("Unknown channel: $channel");
            }

            echo json_encode(['status' => 'success']);
        } catch (\Throwable $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        exit;
    }

    try {
        switch ($action) {
            // --- STUDENTS ---
            case 'save_student':
                // ENFORCE UPPERCASE REG NO
                $reg_no = strtoupper($data['reg_no']);
                
                // Auto-Detect Degree if empty
                $degree = $data['degree'] ?? '';
                if (empty($degree)) {
                    if (preg_match('/^([A-Z0-9]+)05/', $reg_no, $matches)) {
                        $degree = $matches[1];
                    }
                }
                
                $mobile = $data['mobile'] ?? '';
                $email = $data['email'] ?? '';
                
                // Safely handle empty total_package amounts
                $total_package = (isset($data['total_package']) && $data['total_package'] !== '') ? $data['total_package'] : null;

                $stmt = $pdo->prepare("INSERT INTO students (reg_no, name, degree, batch, mobile, email, total_package) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?) 
                                       ON DUPLICATE KEY UPDATE 
                                       name=?, degree=?, batch=?, mobile=?, email=?, total_package=?");
                $stmt->execute([
                    $reg_no, $data['name'], $degree, $data['batch'], $mobile, $email, $total_package,
                    $data['name'], $degree, $data['batch'], $mobile, $email, $total_package
                ]);
                break;
            
            case 'delete_student':
            case 'delete_students':
                // The frontend sometimes sends reg_no instead of id
                $delId = $data['reg_no'] ?? $id; 
                $stmt = $pdo->prepare("DELETE FROM students WHERE reg_no = ? OR id = ?");
                $stmt->execute([$delId, $delId]);
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
                $reg_no = strtoupper($data['reg_no'] ?? '');
                $data['name'] = $data['name'] ?? '';

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

                if (!empty($data['password'])) {
                    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
                    if ($dbId) {
                        $stmt = $pdo->prepare("UPDATE users SET username=?, password=?, role=?, permissions=? WHERE id=?");
                        $stmt->execute([$data['username'], $hashedPassword, $data['role'], $perms, $dbId]);
                    } else {
                        $stmt = $pdo->prepare("INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)");
                        $stmt->execute([$data['username'], $hashedPassword, $data['role'], $perms]);
                    }
                } else {
                    if (!$dbId) throw new Exception("Password is required for new users");
                    $stmt = $pdo->prepare("UPDATE users SET username=?, role=?, permissions=? WHERE id=?");
                    $stmt->execute([$data['username'], $data['role'], $perms, $dbId]);
                }
                break;
            
            case 'delete_user':
            case 'delete_users':
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$id]);
                break;

            // --- BULK OPERATIONS ---
            case 'delete_all':
                $table = $input['table'];
                $map = ['fees' => 'fee_structure', 'others' => 'other_charges'];
                if(isset($map[$table])) $table = $map[$table];

                if ($table === 'loans') {
                    // "loans" isn't a real table — it's payments tagged bank = 'Loan'
                    $pdo->exec("DELETE FROM payments WHERE bank = 'Loan'");
                } elseif ($table === 'payments') {
                    // Never let a Payments-tab bulk delete touch loan-sourced rows
                    $pdo->exec("DELETE FROM payments WHERE bank IS NULL OR bank <> 'Loan'");
                } else {
                    $allowed = ['students', 'fee_structure', 'enrollments', 'discounts', 'other_charges', 'users', 'banks'];
                    if (in_array($table, $allowed)) {
                        $pdo->query("TRUNCATE TABLE $table");
                    }
                }
                break;

            case 'delete_semester':
                 $table = $input['table'];
                 $term = $input['term'];
                 $map = ['others' => 'other_charges'];
                 if(isset($map[$table])) $table = $map[$table];

                 if (!$term) break;

                 if ($table === 'loans') {
                     $stmt = $pdo->prepare("DELETE FROM payments WHERE bank = 'Loan' AND semester LIKE ?");
                     $stmt->execute(["%$term%"]);
                 } elseif ($table === 'payments') {
                     $stmt = $pdo->prepare("DELETE FROM payments WHERE (bank IS NULL OR bank <> 'Loan') AND semester LIKE ?");
                     $stmt->execute(["%$term%"]);
                 } elseif (in_array($table, ['enrollments', 'other_charges'])) {
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
