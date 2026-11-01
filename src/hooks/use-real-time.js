import { useEffect, useRef, useState } from 'react';

/**
 * Subscribes to server-sent events from /api/events with polling fallback.
 * onEvent(event, payload) callback is invoked for every relevant event.
 * Returns { connected, refetch } where refetch triggers a manual refresh.
 */
export function useRealTime({ channels = [], onEvent, refetchInterval = 8000 }) {
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const timerRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const cleanup = () => {
    if (esRef.current) {
      try { esRef.current.close(); } catch (e) {}
      esRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    cleanup();
    const params = new URLSearchParams({ channels: channels.join(',') });
    const url = `/api/events?${params.toString()}`;

    let eventSource;
    try {
      eventSource = new EventSource(url);
    } catch (e) {
      eventSource = null;
    }

    if (eventSource) {
      esRef.current = eventSource;
      eventSource.onopen = () => setConnected(true);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (onEventRef.current) onEventRef.current('message', data);
        } catch (err) {
          // ignore malformed
        }
      };
      eventSource.onerror = () => {
        setConnected(false);
        eventSource.close();
        esRef.current = null;
        // Fall back to polling when SSE is unavailable (e.g. serverless/proxy)
        startPolling();
      };
      // Handle named events
      for (const event of ['order_created', 'order_updated', 'order_cancelled', 'payment_paid', 'table_status_changed', 'food_availability_changed', 'waiter_request', 'waiter_resolved', 'session_closed', 'connected', 'heartbeat']) {
        eventSource.addEventListener(event, (e) => {
          try {
            const data = JSON.parse(e.data);
            if (onEventRef.current) onEventRef.current(event, data);
          } catch (err) {
            // ignore
          }
        });
      }
    } else {
      startPolling();
    }

    function startPolling() {
      if (timerRef.current) return;
      if (onEventRef.current) onEventRef.current('poll', { t: Date.now() });
      timerRef.current = setInterval(() => {
        if (onEventRef.current) onEventRef.current('poll', { t: Date.now() });
      }, refetchInterval);
    }

    return () => {
      cleanup();
    };
  }, [channels.join(','), refetchInterval]);

  const refetch = () => {
    if (onEventRef.current) onEventRef.current('poll', { t: Date.now() });
  };

  return { connected, refetch };
}
