<?php

require_once __DIR__ . '/../feedback-security.php';

function check($condition, $message) {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$valid = validateFeedbackInput(['message' => ' Danke! ', 'email' => 'user@example.org']);
check($valid === ['Danke!', 'user@example.org'], 'Valid input rejected');
check(validateFeedbackInput(['message' => '0']) === ['0', ''], 'Anonymous feedback rejected');
foreach ([
    null, 'text', [], ['message' => []], ['message' => ''],
    ['message' => str_repeat('x', 10001)],
    ['message' => 'test', 'email' => []],
    ['message' => 'test', 'email' => null],
    ['message' => 'test', 'email' => 'invalid'],
    ['message' => 'test', 'email' => "user@example.org\r\nBcc: other@example.org"],
    ['message' => 'test', 'email' => "user@example.org\n"],
    ['message' => 'test', 'email' => 'user@example.org,other@example.org']
] as $input) {
    try {
        validateFeedbackInput($input);
        throw new RuntimeException('Unsafe feedback input accepted');
    } catch (InvalidArgumentException $expected) {
    }
}
$headers = feedbackHeaders($valid[1]);
check($headers['From'] === 'noreply@ics-generator.de', 'Sender must be fixed');
check($headers['Reply-To'] === 'user@example.org', 'Reply-To missing');
check(!isset(feedbackHeaders('')['Reply-To']), 'Anonymous reply header present');

$path = tempnam(sys_get_temp_dir(), 'ics-security-test-');
try {
    for ($count = 0; $count < 5; $count++) {
        check(consumeFeedbackQuota($path, '192.0.2.1', 10000), 'Quota rejected too early');
    }
    check(!consumeFeedbackQuota($path, '192.0.2.1', 10001), 'IP quota bypassed');
    check(consumeFeedbackQuota($path, '192.0.2.2', 10001), 'Other address blocked');
    check(consumeFeedbackQuota($path, '192.0.2.1', 13600), 'Expired quota not reset');
    file_put_contents($path, '');
    for ($count = 0; $count < 100; $count++) {
        check(consumeFeedbackQuota($path, 'address-' . $count, 20000), 'Global quota rejected too early');
    }
    check(!consumeFeedbackQuota($path, 'another-address', 20000), 'Global quota bypassed');
    check(consumeFeedbackQuota($path, 'another-address', 23600), 'Global quota not reset');
    file_put_contents($path, 'invalid JSON');
    try {
        consumeFeedbackQuota($path, 'address', 24000);
        throw new LogicException('Corrupt storage must fail closed');
    } catch (RuntimeException $expected) {
    }
} finally {
    unlink($path);
}
echo "Feedback security tests passed\n";
