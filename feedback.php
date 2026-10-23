<?php

require_once __DIR__ . '/feedback-security.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function feedbackResponse($status, $message) {
    http_response_code($status);
    echo json_encode(['success' => $status === 200, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    feedbackResponse(405, 'Method Not Allowed');
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    feedbackResponse(415, 'JSON erforderlich.');
}

$maxBytes = 65536;
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $maxBytes) {
    feedbackResponse(413, 'Anfrage zu groß.');
}
$rawInput = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
if ($rawInput === false || strlen($rawInput) > $maxBytes) {
    feedbackResponse(413, 'Anfrage zu groß.');
}

try {
    [$message, $userEmail] = validateFeedbackInput(json_decode($rawInput, true));
} catch (InvalidArgumentException $error) {
    feedbackResponse(400, $error->getMessage());
}

try {
    $quotaDirectory = sys_get_temp_dir() . '/ics-feedback-' . hash('sha256', __DIR__);
    if (!is_dir($quotaDirectory) && !mkdir($quotaDirectory, 0700, true) && !is_dir($quotaDirectory)) {
        throw new RuntimeException('Rate limit directory unavailable.');
    }
    if (!consumeFeedbackQuota($quotaDirectory . '/quota.json', $_SERVER['REMOTE_ADDR'] ?? 'unknown', time())) {
        header('Retry-After: 3600');
        feedbackResponse(429, 'Zu viele Nachrichten. Bitte später erneut versuchen.');
    }

    $body = "Neues Feedback vom ICS Generator:\n\nNachricht:\n" . $message . "\n\n";
    $body .= $userEmail !== '' ? "Antwort an: " . $userEmail . "\n" : "(Anonym gesendet)\n";
    if (!mail('info@schellenberger.biz', '[ICS Tool Feedback] Neuer Nutzerwunsch / Feedback', $body, feedbackHeaders($userEmail))) {
        throw new RuntimeException('Mail delivery failed.');
    }
    feedbackResponse(200, 'Vielen Dank für Dein Feedback!');
} catch (Throwable $error) {
    error_log('Feedback Error: ' . $error->getMessage());
    feedbackResponse(503, 'Feedback momentan nicht verfügbar. Bitte später erneut versuchen.');
}
