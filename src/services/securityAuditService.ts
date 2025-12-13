/**
 * Security Audit Service
 * Log các sự kiện bảo mật ở client-side
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export type SecurityEventType =
  | 'login_attempt'
  | 'logout'
  | 'password_change_attempt'
  | 'sensitive_data_access'
  | 'unusual_activity';

export interface SecurityEvent {
  event_type: SecurityEventType;
  metadata?: Record<string, any>;
  timestamp: number;
}

/**
 * Log security event ở client-side
 */
export function logSecurityEvent(
  eventType: SecurityEventType,
  metadata?: Record<string, any>
): void {
  const event: SecurityEvent = {
    event_type: eventType,
    metadata,
    timestamp: Date.now(),
  };

  // Lưu vào localStorage để có thể gửi lên server sau
  const events = JSON.parse(
    localStorage.getItem('postmanlocal_security_events') || '[]'
  );
  events.push(event);

  // Giữ tối đa 100 events
  if (events.length > 100) {
    events.shift();
  }

  localStorage.setItem('postmanlocal_security_events', JSON.stringify(events));

  // Có thể gửi lên server nếu cần (async, không block)
  sendSecurityEventsToServer().catch(console.error);
}

/**
 * Gửi security events lên server
 */
async function sendSecurityEventsToServer(): Promise<void> {
  const events = JSON.parse(
    localStorage.getItem('postmanlocal_security_events') || '[]'
  );

  if (events.length === 0) {
    return;
  }

  try {
    // TODO: Implement API endpoint để nhận security events
    // const response = await fetch(`${API_BASE_URL}/security/events`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ events }),
    // });

    // if (response.ok) {
    //   localStorage.removeItem('postmanlocal_security_events');
    // }
  } catch (error) {
    // Silent fail, sẽ thử lại lần sau
    console.error('Failed to send security events:', error);
  }
}

/**
 * Clear security events
 */
export function clearSecurityEvents(): void {
  localStorage.removeItem('postmanlocal_security_events');
}
