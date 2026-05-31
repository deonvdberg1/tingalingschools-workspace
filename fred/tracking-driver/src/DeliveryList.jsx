import React from 'react';

export default function DeliveryList({ deliveries, onUpdateStatus }) {
  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="delivery-list">
        <h3>Today's Deliveries</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, padding: 16, textAlign: 'center' }}>
          No deliveries scheduled for today.
        </p>
      </div>
    );
  }

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered');
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

  return (
    <div className="delivery-list">
      <h3>Active ({activeDeliveries.length})</h3>
      {activeDeliveries.map(d => (
        <DeliveryItem 
          key={d.id} 
          delivery={d} 
          onUpdateStatus={onUpdateStatus} 
        />
      ))}

      {completedDeliveries.length > 0 && (
        <>
          <h3 style={{ marginTop: 12 }}>Completed ({completedDeliveries.length})</h3>
          {completedDeliveries.map(d => (
            <DeliveryItem 
              key={d.id} 
              delivery={d} 
              onUpdateStatus={onUpdateStatus} 
            />
          ))}
        </>
      )}
    </div>
  );
}

function DeliveryItem({ delivery, onUpdateStatus }) {
  const isEnRoute = delivery.status === 'en_route';
  const isDelivered = delivery.status === 'delivered';
  const isProblem = delivery.status === 'problem';
  const isPending = delivery.status === 'pending';

  return (
    <div className="delivery-item" style={{
      opacity: isDelivered ? 0.6 : 1,
      borderColor: isProblem ? '#ef4444' : isEnRoute ? '#2563eb' : 'var(--surface-2)',
    }}>
      <div className="customer-name">{delivery.customer_name}</div>
      {delivery.customer_address && (
        <div className="customer-address">{delivery.customer_address}</div>
      )}
      <div className={`delivery-status ${delivery.status}`}>
        {delivery.status.replace('_', ' ')}
      </div>

      {!isDelivered && (
        <div className="action-buttons">
          {isPending && (
            <button 
              className="btn btn-primary btn-small"
              onClick={() => onUpdateStatus(delivery.id, 'en_route')}
            >
              Start Route
            </button>
          )}
          {isEnRoute && (
            <>
              <button 
                className="btn btn-success btn-small"
                onClick={() => onUpdateStatus(delivery.id, 'delivered')}
              >
                Delivered
              </button>
              <button 
                className="btn btn-warning btn-small"
                onClick={() => onUpdateStatus(delivery.id, 'problem', 'Customer unavailable')}
              >
                Problem
              </button>
            </>
          )}
          {isProblem && (
            <button 
              className="btn btn-success btn-small"
              onClick={() => onUpdateStatus(delivery.id, 'delivered', 'Resolved')}
            >
              Mark Delivered
            </button>
          )}
        </div>
      )}

      {delivery.notes && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, fontStyle: 'italic' }}>
          {delivery.notes}
        </div>
      )}
    </div>
  );
}
