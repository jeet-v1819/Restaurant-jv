import { EventEmitter } from 'node:events';

// In-memory event bus used for real-time synchronization between panels.
// Works within a single server instance (dev). For multi-instance/serverless
// deployments clients also poll regularly (see useRealTime hook), so updates
// are still delivered reliably.
const bus = new EventEmitter();
bus.setMaxListeners(100);

export const emitOrderCreated = (payload) => bus.emit('order_created', payload);
export const emitOrderUpdated = (payload) => bus.emit('order_updated', payload);
export const emitOrderCancelled = (payload) => bus.emit('order_cancelled', payload);
export const emitPaymentPaid = (payload) => bus.emit('payment_paid', payload);
export const emitTableStatusChanged = (payload) => bus.emit('table_status_changed', payload);
export const emitFoodAvailabilityChanged = (payload) => bus.emit('food_availability_changed', payload);
export const emitWaiterRequest = (payload) => bus.emit('waiter_request', payload);
export const emitWaiterResolved = (payload) => bus.emit('waiter_resolved', payload);
export const emitSessionClosed = (payload) => bus.emit('session_closed', payload);

export function subscribe(event, listener) {
  bus.on(event, listener);
  return () => bus.off(event, listener);
}

export function emit(event, payload) {
  bus.emit(event, payload);
}

export default bus;
