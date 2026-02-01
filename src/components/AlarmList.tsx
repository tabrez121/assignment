import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Alarm, WebSocketMessage } from '@/types';
import './AlarmList.css';

/**
 * Alarm list component with real-time updates via WebSocket
 *
 * Features:
 * - Real-time alarm updates via WebSocket
 * - Visual indicators for new alarms
 * - Status management (active, acknowledged, resolved)
 * - Connection status display
 * - Error handling and recovery
 *
 * Task 2.1 & 2.2 Implementation
 */
export const AlarmList: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [newAlarmIds, setNewAlarmIds] = useState<Set<string>>(new Set());
  const [isAcknowledging, setIsAcknowledging] = useState<Set<string>>(new Set());

  // WebSocket connection with fallback
  const {
    isConnected,
    sendMessage,
    error: wsError,
    reconnect,
  } = useWebSocket('ws://localhost:8080/api/alarms', {
    shouldReconnect: true,
    maxRetries: 3,
    retryDelay: 2000,
    onMessage: (message) => {
      handleWebSocketMessage(message);
    },
    onConnect: () => {
      console.log('✅ Connected to alarm stream');
    },
    onDisconnect: () => {
      console.log('⚠️ Disconnected from alarm stream');
    },
    onError: (error) => {
      console.log('❌ WebSocket error:', error.message);
    },
  });

  /**
   * Handle incoming WebSocket messages
   */
  const handleWebSocketMessage = (message: unknown): void => {
    const wsMsg = message as WebSocketMessage;

    if (wsMsg.event === 'alarm.created') {
      const newAlarm = wsMsg.data as unknown as Alarm;
      setAlarms((prev) => [newAlarm, ...prev]);
      setNewAlarmIds((prev) => new Set([...prev, newAlarm.id]));

      // Remove "new" highlight after 3 seconds
      setTimeout(() => {
        setNewAlarmIds((prev) => {
          const updated = new Set(prev);
          updated.delete(newAlarm.id);
          return updated;
        });
      }, 3000);
    } else if (wsMsg.event === 'alarm.acknowledged') {
      const alarmId = wsMsg.data.id as string;
      const updatedBy = wsMsg.data.acknowledgedBy as string;

      setAlarms((prev) =>
        prev.map((alarm) =>
          alarm.id === alarmId ? { ...alarm, status: 'acknowledged', acknowledgedBy: updatedBy } : alarm
        )
      );
    } else if (wsMsg.event === 'alarm.resolved') {
      const alarmId = wsMsg.data.id as string;

      setAlarms((prev) =>
        prev.map((alarm) =>
          alarm.id === alarmId
            ? { ...alarm, status: 'resolved', resolvedAt: new Date().toISOString() }
            : alarm
        )
      );
    }
  };

  /**
   * Acknowledge an alarm
   */
  const handleAcknowledge = useCallback(
    (alarmId: string) => {
      setIsAcknowledging((prev) => new Set([...prev, alarmId]));

      // Send acknowledgment through WebSocket
      sendMessage({
        action: 'acknowledge',
        alarmId,
        acknowledgedBy: 'current-user',
        timestamp: new Date().toISOString(),
      });

      // Simulate server response (in real app, wait for WebSocket response)
      setTimeout(() => {
        setAlarms((prev) =>
          prev.map((alarm) =>
            alarm.id === alarmId
              ? { ...alarm, status: 'acknowledged', acknowledgedBy: 'current-user' }
              : alarm
          )
        );
        setIsAcknowledging((prev) => {
          const updated = new Set(prev);
          updated.delete(alarmId);
          return updated;
        });
      }, 500);
    },
    [sendMessage]
  );

  /**
   * Resolve an alarm
   */
  const handleResolve = useCallback(
    (alarmId: string) => {
      // Send resolution through WebSocket
      sendMessage({
        action: 'resolve',
        alarmId,
        timestamp: new Date().toISOString(),
      });

      // Update locally
      setAlarms((prev) =>
        prev.map((alarm) =>
          alarm.id === alarmId
            ? { ...alarm, status: 'resolved', resolvedAt: new Date().toISOString() }
            : alarm
        )
      );
    },
    [sendMessage]
  );

  /**
   * Clear resolved alarms
   */
  const handleClearResolved = (): void => {
    setAlarms((prev) => prev.filter((alarm) => alarm.status !== 'resolved'));
  };

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: '#d32f2f',
      high: '#f57c00',
      medium: '#fbc02d',
      low: '#388e3c',
    };
    return colors[severity] || '#757575';
  };

  // Load initial demo alarms
  useEffect(() => {
    if (alarms.length === 0) {
      const demoAlarms: Alarm[] = [
        {
          id: 'alarm-001',
          siteId: 'site-1',
          severity: 'critical',
          message: 'Power supply failure detected',
          status: 'active',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        {
          id: 'alarm-002',
          siteId: 'site-2',
          severity: 'high',
          message: 'Temperature threshold exceeded',
          status: 'active',
          timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
        },
        {
          id: 'alarm-003',
          siteId: 'site-3',
          severity: 'high',
          message: 'Humidity level critical',
          status: 'active',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: 'alarm-004',
          siteId: 'site-1',
          severity: 'medium',
          message: 'Connection timeout - device unresponsive',
          status: 'active',
          timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
        },
        {
          id: 'alarm-005',
          siteId: 'site-4',
          severity: 'low',
          message: 'Maintenance reminder - filter replacement due',
          status: 'active',
          timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
        },
      ];
      setAlarms(demoAlarms);
      console.log('📊 Demo alarms loaded:', demoAlarms.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeAlarms = alarms.filter((a) => a.status === 'active');
  const acknowledgedAlarms = alarms.filter((a) => a.status === 'acknowledged');
  const resolvedAlarms = alarms.filter((a) => a.status === 'resolved');

  return (
    <div className="alarm-list-container">
      <div className="alarm-list-header">
        <h2>Alarm Monitor</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {!isConnected && (
            <button onClick={reconnect} className="btn btn-small">
              Reconnect
            </button>
          )}
        </div>
      </div>

      {wsError && (
        <div className="alert alert-info">
          <strong>ℹ️ Demo Mode:</strong> Real-time updates unavailable. Showing sample alarm data. {wsError.message?.includes('Max') && 'Try the Reconnect button or wait for automatic reconnection.'}
        </div>
      )}

      {/* Active Alarms */}
      <div className="alarm-section">
        <h3 className="alarm-section-title">
          Active Alarms ({activeAlarms.length})
        </h3>
        {activeAlarms.length > 0 ? (
          <div className="alarm-list">
            {activeAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`alarm-item alarm-${alarm.severity} ${
                  newAlarmIds.has(alarm.id) ? 'new' : ''
                }`}
              >
                <div className="alarm-header">
                  <div className="alarm-severity">
                    <span
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(alarm.severity) }}
                    >
                      {alarm.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="alarm-title">{alarm.message}</div>
                  {newAlarmIds.has(alarm.id) && <span className="new-badge">NEW</span>}
                </div>
                <div className="alarm-meta">
                  <span className="meta-item">ID: {alarm.id}</span>
                  <span className="meta-item">Site: {alarm.siteId}</span>
                  <span className="meta-item">
                    {new Date(alarm.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="alarm-actions">
                  <button
                    onClick={() => handleAcknowledge(alarm.id)}
                    disabled={isAcknowledging.has(alarm.id)}
                    className="btn btn-small btn-warning"
                  >
                    {isAcknowledging.has(alarm.id) ? 'Acknowledging...' : 'Acknowledge'}
                  </button>
                  <button
                    onClick={() => handleResolve(alarm.id)}
                    className="btn btn-small btn-success"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No active alarms</div>
        )}
      </div>

      {/* Acknowledged Alarms */}
      {acknowledgedAlarms.length > 0 && (
        <div className="alarm-section">
          <h3 className="alarm-section-title">
            Acknowledged Alarms ({acknowledgedAlarms.length})
          </h3>
          <div className="alarm-list">
            {acknowledgedAlarms.map((alarm) => (
              <div key={alarm.id} className="alarm-item alarm-acknowledged">
                <div className="alarm-header">
                  <span className="severity-badge acknowledged">✓</span>
                  <div className="alarm-title">{alarm.message}</div>
                </div>
                <div className="alarm-meta">
                  <span className="meta-item">Acknowledged by: {alarm.acknowledgedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Alarms */}
      {resolvedAlarms.length > 0 && (
        <div className="alarm-section">
          <div className="alarm-section-header">
            <h3 className="alarm-section-title">
              Resolved Alarms ({resolvedAlarms.length})
            </h3>
            <button onClick={handleClearResolved} className="btn btn-small btn-secondary">
              Clear
            </button>
          </div>
          <div className="alarm-list">
            {resolvedAlarms.map((alarm) => (
              <div key={alarm.id} className="alarm-item alarm-resolved">
                <div className="alarm-header">
                  <span className="severity-badge resolved">✓</span>
                  <div className="alarm-title">{alarm.message}</div>
                </div>
                <div className="alarm-meta">
                  <span className="meta-item">
                    Resolved at: {alarm.resolvedAt ? new Date(alarm.resolvedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlarmList;
