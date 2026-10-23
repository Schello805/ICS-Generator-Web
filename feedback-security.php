<?php

function validateFeedbackInput($input) {
    if (!is_array($input) || !isset($input['message']) || !is_string($input['message']) ||
        (array_key_exists('email', $input) && !is_string($input['email']))) {
        throw new InvalidArgumentException('Ungültige Eingabe.');
    }
    $message = trim($input['message']);
    $rawEmail = $input['email'] ?? '';
    $email = trim($rawEmail);
    if ($message === '' || strlen($message) > 10000) {
        throw new InvalidArgumentException('Die Nachricht muss 1 bis 10000 Bytes enthalten.');
    }
    if (strpbrk($rawEmail, "\r\n") !== false || strlen($email) > 254 ||
        ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL))) {
        throw new InvalidArgumentException('Bitte eine gültige E-Mail-Adresse angeben.');
    }
    return [$message, $email];
}

function feedbackHeaders($email) {
    $headers = [
        'From' => 'noreply@ics-generator.de',
        'Content-Type' => 'text/plain; charset=UTF-8'
    ];
    if ($email !== '') {
        $headers['Reply-To'] = $email;
    }
    return $headers;
}

function consumeFeedbackQuota($path, $address, $now) {
    $handle = fopen($path, 'c+');
    if (!$handle) {
        throw new RuntimeException('Rate limit storage unavailable.');
    }
    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Rate limit lock unavailable.');
        }
        $content = stream_get_contents($handle);
        $entries = $content === '' ? [] : json_decode($content, true);
        if (!is_array($entries)) {
            throw new RuntimeException('Invalid rate limit storage.');
        }
        $entries = array_filter($entries, function ($entry) use ($now) {
            return $entry['start'] > $now - 3600;
        });
        $key = hash('sha256', $address);
        $entry = $entries[$key] ?? ['start' => $now, 'count' => 0];
        $total = array_sum(array_column($entries, 'count'));
        if ($entry['count'] >= 5 || $total >= 100) {
            return false;
        }
        $entry['count']++;
        $entries[$key] = $entry;
        $encoded = json_encode($entries);
        rewind($handle);
        if (!ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) {
            throw new RuntimeException('Rate limit write failed.');
        }
        return true;
    } finally {
        fclose($handle);
    }
}
