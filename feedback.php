<?php
/**
 * Simple PHP Feedback Script
 * Receives JSON data and sends an email via sendmail/mail().
 */

header('Content-Type: application/json');

// Configuration
$toEmail = 'info@schellenberger.biz';
$subjectPrefix = '[ICS Tool Feedback]';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

// Extract and sanitize data
$message = isset($input['message']) ? trim($input['message']) : '';
$userEmail = isset($input['email']) ? trim($input['email']) : '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nachricht darf nicht leer sein.']);
    exit;
}

// Prepare Email
$subject = $subjectPrefix . ' Neuer Nutzerwunsch / Feedback';
$body = "Neues Feedback vom ICS Generator:\n\n";
$body .= "Nachricht:\n" . $message . "\n\n";

if (!empty($userEmail)) {
    $body .= "Antwort an: " . $userEmail . "\n";
    $headers = 'From: ' . $userEmail . "\r\n" .
               'Reply-To: ' . $userEmail . "\r\n";
} else {
    $body .= "(Anonym gesendet)\n";
    // Set a default sender to ensure delivery, or use the server's default
    // Using a noreply address is safer to avoid spam filters blocking "empty" from
    $headers = 'From: noreply@' . $_SERVER['HTTP_HOST'] . "\r\n";
}

$headers .= 'X-Mailer: PHP/' . phpversion();

// Send Email
try {
    $success = mail($toEmail, $subject, $body, $headers);
    
    if ($success) {
        echo json_encode(['success' => true]);
    } else {
        throw new Exception('Mail function returned false.');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Serverfehler beim Senden der Mail.']);
    error_log("Feedback Error: " . $e->getMessage());
}
