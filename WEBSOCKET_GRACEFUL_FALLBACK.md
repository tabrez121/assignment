# WebSocket Graceful Fallback & Demo Mode

## Overview

When the WebSocket connection cannot be established (real backend server unavailable), the application gracefully falls back to **demo mode** with sample alarm data. This ensures users always see a functional interface with realistic data.

---

## How It Works

### Connection Flow

```
1. App starts → Attempts WebSocket connection to ws://localhost:8080/api/alarms
   ↓
2. Initial connection fails (timeout after 5 seconds)
   ↓
3. Auto-retry logic kicks in (3 attempts with exponential backoff)
   - Attempt 1: Wait 2 seconds, retry
   - Attempt 2: Wait 4 seconds, retry
   - Attempt 3: Wait 8 seconds, final attempt
   ↓
4. All attempts exhausted → Enter Demo Mode
   ↓
5. Demo Mode: Show sample alarms, offer manual reconnect option
```

### Console Messages

**Connection Attempt:**
```
✅ Connected to alarm stream
```

**Connection Lost:**
```
⚠️ Disconnected from alarm stream
⚠️ WebSocket reconnecting in 2000ms (attempt 1/3)
⚠️ WebSocket reconnecting in 4000ms (attempt 2/3)
⚠️ WebSocket reconnecting in 8000ms (attempt 3/3)
📊 WebSocket unavailable - demo mode active with sample data
📊 Demo alarms loaded: 5
```

### User Interface

**Status Indicator:**
- 🟢 **Connected** - Real-time updates active
- 🔴 **Disconnected** - Demo mode with sample data

**Alert Message:**
```
ℹ️ Demo Mode: Real-time updates unavailable. 
   Showing sample alarm data. Try the Reconnect button 
   or wait for automatic reconnection.
```

**Buttons:**
- **Reconnect** - Manually attempt to restore connection

---

## Demo Alarm Data

When in demo mode, the app displays 5 realistic warehouse alarms:

### 1. Critical: Power Supply Failure
- **Site:** Warehouse A (site-1)
- **Severity:** 🔴 CRITICAL
- **Status:** Active
- **Time:** 15 minutes ago

### 2. High: Temperature Threshold
- **Site:** Warehouse B (site-2)
- **Severity:** 🟠 HIGH
- **Status:** Active
- **Time:** 8 minutes ago

### 3. High: Humidity Level Critical
- **Site:** Distribution Center (site-3)
- **Severity:** 🟠 HIGH
- **Status:** Active
- **Time:** 5 minutes ago

### 4. Medium: Connection Timeout
- **Site:** Warehouse A (site-1)
- **Severity:** 🟡 MEDIUM
- **Status:** Active
- **Time:** 3 minutes ago

### 5. Low: Maintenance Reminder
- **Site:** Regional Hub (site-4)
- **Severity:** 🟢 LOW
- **Status:** Active
- **Time:** 1 minute ago

---

## Features in Demo Mode

### ✅ Full Functionality
- All alarm management features work
- Acknowledge alarms
- Resolve alarms
- Clear resolved alarms
- View alarm details
- Responsive design

### ✅ Status Management
- Active alarms display
- Acknowledged alarms section
- Resolved alarms section
- Color-coded severity levels

### ✅ User Experience
- "NEW" badges on demo alarms
- Smooth animations
- Professional styling
- Clear status indicators
- Helpful error messages

---

## Connection Configuration

### Current Settings (Optimized)

**File:** `src/hooks/useWebSocket.ts`

```typescript
{
  shouldReconnect: true,      // Enable auto-reconnect
  maxRetries: 3,              // Maximum 3 reconnection attempts
  retryDelay: 2000,           // Initial 2 second delay
  connectionTimeout: 5000     // 5 second connection timeout
}
```

### Exponential Backoff Calculation

```
Attempt 1: 2000ms × 2^0 = 2 seconds
Attempt 2: 2000ms × 2^1 = 4 seconds
Attempt 3: 2000ms × 2^2 = 8 seconds
Total max wait time: 14 seconds + initial 5s timeout = ~19 seconds
```

---

## Deployment Scenarios

### Local Development (No Real Server)

**Expected Behavior:**
1. WebSocket attempts for ~19 seconds
2. Falls back to demo mode
3. Shows informational alert
4. Displays sample alarms
5. Offers manual reconnect

### Production (Real Server Available)

**Expected Behavior:**
1. WebSocket connects within 5 seconds
2. Shows "Connected" status
3. Receives real alarm data
4. Updates in real-time
5. Auto-reconnects if connection drops

### Production (Server Temporarily Down)

**Expected Behavior:**
1. Real-time connection fails
2. Auto-retries for ~19 seconds
3. Falls back to last known data or demo data
4. User can manually reconnect once server is back
5. Auto-reconnection resumes on next server recovery

---

## Error Handling

### Timeout Errors
```typescript
// After 5 seconds of CONNECTING state
Error: "WebSocket connection timeout - falling back to mock data"
```

### Connection Errors
```typescript
Error: "WebSocket connection failed - using mock data"
```

### Max Retries Exceeded
```typescript
Error: "Real-time updates unavailable - demo mode active"
```

### Parse Errors
```
Warning: "Failed to parse WebSocket message: {data}"
(Does not crash the app, message is logged and skipped)
```

---

## Testing Connection

### Test Real Server Connection
```bash
# Assuming backend is running on ws://localhost:8080/api/alarms
npm run dev
# Open browser to http://localhost:5173
# Check console for: ✅ Connected to alarm stream
```

### Test Fallback to Demo Mode
```bash
# With backend NOT running
npm run dev
# Open browser to http://localhost:5173
# Wait ~20 seconds
# Check console for: 📊 Demo mode active with sample data
# Verify 5 demo alarms appear in the UI
```

### Test Manual Reconnect
```bash
# In demo mode, click "Reconnect" button
# Start backend server
# Should reconnect and show: ✅ Connected to alarm stream
```

---

## CSS Styling

### Demo Mode Alert
```css
.alert-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-color: var(--primary-color);
  color: #1e40af;
  border-left: 4px solid var(--primary-color);
}
```

### Disconnected Status Indicator
```css
.status-indicator.disconnected {
  background-color: var(--error-color);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## Best Practices

### For Users
1. ✅ Check console for connection status (browser DevTools)
2. ✅ Try "Reconnect" button if demo mode appears
3. ✅ Demo data is realistic and safe to interact with
4. ✅ All alarm acknowledgments/resolutions work in demo mode

### For Developers
1. ✅ Keep WebSocket timeout at 5 seconds
2. ✅ Keep max retries at 3 (balanced between UX and resource usage)
3. ✅ Use exponential backoff for retries
4. ✅ Provide clear console logging for debugging
5. ✅ Always have demo data available

### For DevOps
1. ✅ Ensure backend WebSocket server is running on `localhost:8080`
2. ✅ Use proper WebSocket upgrade headers
3. ✅ Implement heartbeat/ping to detect dead connections
4. ✅ Monitor connection drop rates in logs

---

## Performance Impact

### Initial Load
- **No WebSocket:** ~0.5 seconds
- **WebSocket Success:** ~1-2 seconds (real-time updates start)
- **WebSocket Fallback:** ~20 seconds total (then switches to demo mode)

### Memory Usage
- **Demo Mode:** Minimal (5 mock alarms in memory)
- **Real-time Mode:** Varies based on alarm volume

### Network Usage
- **Demo Mode:** Minimal (no network requests)
- **Real-time Mode:** WebSocket connection + periodic updates

---

## Future Enhancements

### Possible Improvements
1. **Persistent Demo Data** - Save acknowledged/resolved state to localStorage
2. **Configurable Retry Policy** - Allow per-deployment config
3. **Server Health Check** - Periodic pings to detect recovery
4. **Auto-Refresh in Demo Mode** - Simulate new alarms every N seconds
5. **Connection Analytics** - Log failure reasons for debugging
6. **Custom Error Messages** - Context-aware messages per failure type

---

## Summary

The WebSocket graceful fallback system ensures:
- ✅ **Resilience** - Works with or without backend
- ✅ **User Experience** - Always shows relevant data
- ✅ **Debugging** - Clear console logs for troubleshooting
- ✅ **Professional** - Demo mode feels intentional, not like an error
- ✅ **Production Ready** - Handles both happy and sad paths

**Demo mode is a feature, not a bug!**

---

**Last Updated:** January 27, 2026
**Status:** ✅ Production Ready
**Version:** 1.0
