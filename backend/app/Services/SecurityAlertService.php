<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Security Alert Service
 * Gửi security alerts qua các channels khác nhau
 */
class SecurityAlertService
{
    /**
     * Send security alert
     */
    public function sendAlert(
        string $type,
        string $message,
        array $metadata = [],
        array $channels = ['log']
    ): void {
        foreach ($channels as $channel) {
            switch ($channel) {
                case 'log':
                    $this->sendToLog($type, $message, $metadata);
                    break;
                case 'email':
                    $this->sendToEmail($type, $message, $metadata);
                    break;
                case 'webhook':
                    $this->sendToWebhook($type, $message, $metadata);
                    break;
            }
        }
    }

    /**
     * Send alert to log
     */
    protected function sendToLog(string $type, string $message, array $metadata): void
    {
        Log::warning("Security Alert [{$type}]: {$message}", $metadata);
    }

    /**
     * Send alert to email
     */
    protected function sendToEmail(string $type, string $message, array $metadata): void
    {
        $recipients = config('security.alerts.email_recipients', []);
        
        if (empty($recipients)) {
            return;
        }

        // TODO: Implement email sending
        // Mail::to($recipients)->send(new SecurityAlertMail($type, $message, $metadata));
    }

    /**
     * Send alert to webhook
     */
    protected function sendToWebhook(string $type, string $message, array $metadata): void
    {
        $webhookUrl = config('security.alerts.webhook_url');
        
        if (!$webhookUrl) {
            return;
        }

        try {
            \Http::post($webhookUrl, [
                'type' => $type,
                'message' => $message,
                'metadata' => $metadata,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send webhook alert', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
