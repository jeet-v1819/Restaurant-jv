import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  subscribe,
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderCancelled,
  emitPaymentPaid,
  emitTableStatusChanged,
  emitFoodAvailabilityChanged,
  emitWaiterRequest,
  emitWaiterResolved,
  emitSessionClosed,
} from '@/lib/bus';

// Map of query channel -> bus events the client wants to hear about
const CHANNEL_EVENTS = {
  kitchen: ['order_created', 'order_updated', 'order_cancelled', 'food_availability_changed'],
  admin: [
    'order_created',
    'order_updated',
    'payment_paid',
    'table_status_changed',
    'waiter_request',
    'waiter_resolved',
    'session_closed',
    'food_availability_changed',
  ],
  billing: ['payment_paid', 'table_status_changed', 'session_closed'],
  customer: ['order_updated', 'food_availability_changed'],
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channels = (searchParams.get('channels') || '').split(',').filter(Boolean);
  const role = session.user.role;

  // Build the set of events this client should receive
  const wantedEvents = new Set();
  for (const channel of channels) {
    const events = CHANNEL_EVENTS[channel] || [];
    for (const e of events) wantedEvents.add(e);
  }
  // Always include availability changes so menus update everywhere
  wantedEvents.add('food_availability_changed');

  // Role-based filtering: customers must not see staff-only events
  const staffEvents = new Set(['payment_paid', 'waiter_request', 'waiter_resolved']);
  if (role === 'CUSTOMER') {
    for (const e of staffEvents) wantedEvents.delete(e);
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = (event, data) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    return writer.write(encoder.encode(payload));
  };

  // Initial hello so clients know the stream is open
  writer.write(encoder.encode('event: connected\ndata: {"ok":true}\n\n'));

  const listeners = [];

  for (const event of wantedEvents) {
    const unsubscribe = subscribe(event, (payload) => {
      send(event, payload);
    });
    listeners.push(unsubscribe);
  }

  // Heartbeat to keep the connection alive
  const heartbeat = setInterval(() => send('heartbeat', { t: Date.now() }), 25000);

  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeat);
    for (const unsubscribe of listeners) unsubscribe();
    writer.write(encoder.encode('event: close\ndata: {}\n\n')).then(() => writer.close());
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// Re-export emitters so other modules can import from a single place if needed
export {
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderCancelled,
  emitPaymentPaid,
  emitTableStatusChanged,
  emitFoodAvailabilityChanged,
  emitWaiterRequest,
  emitWaiterResolved,
  emitSessionClosed,
};
