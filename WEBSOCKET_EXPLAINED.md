# WebSocket Connection Explanation & Demo Mode Guide

## 🎯 What's Happening - Complete Explanation

### The Console Errors You're Seeing are EXPECTED

When you click "Reconnect" and see these messages:
```
🔄 Manual reconnection requested
WebSocket connection to 'ws://localhost:8080/api/alarms' failed: 
❌ WebSocket error: WebSocket connection failed - using mock data
⚠️ Disconnected from alarm stream
⚠️ WebSocket reconnecting in 2000ms (attempt 1/3)
⚠️ WebSocket reconnecting in 4000ms (attempt 2/3)
⚠️ WebSocket reconnecting in 8000ms (attempt 3/3)
```

**This is CORRECT behavior!** Here's what's happening:

---

## 📊 Connection Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ App Starts or User Clicks "Reconnect"                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
         ✅ Attempt WebSocket Connection
         ws://localhost:8080/api/alarms
                     ↓
        ⏱️  Wait 5 seconds for timeout
                     ↓
         ❌ Server not responding
         (No backend running)
                     ↓
         Try Again with RETRY LOGIC
                     ↓
    ┌─ Retry 1: Wait 2 seconds, try again
    │              ↓ Still fails
    │
    ├─ Retry 2: Wait 4 seconds, try again
    │              ↓ Still fails
    │
    ├─ Retry 3: Wait 8 seconds, try again
    │              ↓ Still fails
    │
    └─ Max Retries Reached
                     ↓
    📊 DEMO MODE ACTIVATED
    ✅ Show sample alarm data
    ✅ All features work normally
    ✅ User can still manage alarms
```

---

## 🎨 What You Should See in the UI

### Status Area (Top Right)
```
Status: 🔴 Disconnected
Button: "Reconnect"
```

### Alert Box (Below Header)
```
ℹ️ Demo Mode: Real-time updates unavailable. 
   Showing sample alarm data.
```

### Alarms List
```
✅ 5 Demo Alarms Displayed:

1. 🔴 CRITICAL - Power supply failure detected
   Site: site-1 | 15 minutes ago

2. 🟠 HIGH - Temperature threshold exceeded
   Site: site-2 | 8 minutes ago

3. 🟠 HIGH - Humidity level critical
   Site: site-3 | 5 minutes ago

4. 🟡 MEDIUM - Connection timeout - device unresponsive
   Site: site-1 | 3 minutes ago

5. 🟢 LOW - Maintenance reminder - filter replacement due
   Site: site-4 | 1 minute ago
```

---

## 🔌 WebSocket Connection Scenarios

### Scenario 1: NO Backend Server Running (Default)

**Expected Flow:**
1. App starts
2. Attempts to connect to `ws://localhost:8080/api/alarms`
3. 5-second timeout with no response
4. Auto-retries: 2s, 4s, 8s delays
5. After 3 failed attempts → **Demo Mode Active**
6. Demo alarms display ✅
7. User can use all features with sample data

**Console Log:**
```
⏱️ WebSocket connection timeout after 5s
⚠️ WebSocket reconnecting in 2000ms (attempt 1/3)
⚠️ WebSocket reconnecting in 4000ms (attempt 2/3)
⚠️ WebSocket reconnecting in 8000ms (attempt 3/3)
📊 WebSocket unavailable - demo mode active with sample data
```

### Scenario 2: Backend Server IS Running

**Expected Flow:**
1. App starts
2. Attempts to connect to `ws://localhost:8080/api/alarms`
3. Connection succeeds within 5 seconds
4. Status changes to "Connected" ✅
5. Real-time data flows in
6. Demo alarms replaced with real alarms

**Console Log:**
```
✅ WebSocket connected
✅ Connected to alarm stream
```

### Scenario 3: User Clicks "Reconnect" Button (No Backend)

**Expected Flow:**
1. User clicks "Reconnect" button
2. Current connection closes
3. Retry counter resets to 0
4. Attempts to connect again
5. Same 3-attempt retry logic runs
6. Falls back to demo mode

**Console Log:**
```
🔄 Manual reconnection requested
⏱️ WebSocket connection timeout after 5s
⚠️ WebSocket reconnecting in 2000ms (attempt 1/3)
⚠️ WebSocket reconnecting in 4000ms (attempt 2/3)
⚠️ WebSocket reconnecting in 8000ms (attempt 3/3)
📊 WebSocket unavailable - demo mode active with sample data
```

---

## ✅ Demo Mode is NOT an Error

**Demo Mode Features:**
- ✅ Full alarm management (acknowledge, resolve)
- ✅ All UI features work normally
- ✅ Realistic sample data
- ✅ Severity color coding
- ✅ Responsive design
- ✅ Animations and styling

**Demo Mode is Intentional:**
- It's a graceful fallback
- Shows app works without backend
- Allows testing all features
- Provides better UX than blank screen

---

## 🧪 How to Test Different Scenarios

### Test 1: Demo Mode (Currently Running)
```
1. App is running at http://localhost:5173/
2. No backend server on ws://localhost:8080/api/alarms
3. Click "Reconnect" button
4. Watch console for retry messages
5. Should show 5 demo alarms in the UI
6. All features should work (acknowledge, resolve, etc.)
```

### Test 2: Real WebSocket Connection
```
1. Start a WebSocket server on ws://localhost:8080/api/alarms
2. Restart the app (or wait for reconnect)
3. Should connect immediately
4. Console shows: ✅ WebSocket connected
5. Status changes to "Connected"
6. Real data appears
```

### Test 3: Reconnect After Backend Comes Online
```
1. App in demo mode (no backend)
2. Start WebSocket server
3. Click "Reconnect" button
4. Should connect successfully
5. Status changes to "Connected"
6. Real data appears
```

---

## 🔍 Console Log Translation

### Connection Success
```
✅ WebSocket connected        → Connected to server
✅ Connected to alarm stream  → Data is flowing
```

### Connection Failure
```
❌ WebSocket error - connection failed  → Couldn't reach server
⏱️ WebSocket connection timeout after 5s → No response in 5 seconds
⚠️ WebSocket reconnecting in 2000ms... → Trying again in 2 seconds
```

### Demo Mode Active
```
📊 WebSocket unavailable - demo mode active with sample data
  → No backend available, using sample data
```

### User Action
```
🔄 Manual reconnection requested → User clicked Reconnect button
📊 Demo alarms loaded: 5 → Sample data loaded successfully
```

---

## 📋 What Gets Logged at Each Stage

### Stage 1: Initial Load
```
✅ WebSocket connected              (if server available)
or
⏱️ WebSocket connection timeout... (if no server)
```

### Stage 2: Initial Reconnect Attempt
```
⚠️ WebSocket reconnecting in 2000ms (attempt 1/3)
⚠️ WebSocket reconnecting in 4000ms (attempt 2/3)
⚠️ WebSocket reconnecting in 8000ms (attempt 3/3)
```

### Stage 3: Demo Mode Activated
```
📊 WebSocket unavailable - demo mode active with sample data
📊 Demo alarms loaded: 5
```

### Stage 4: User Clicks Reconnect
```
🔄 Manual reconnection requested
(Back to Stage 2)
```

---

## 🎯 Summary for Users

### ✅ Everything is Working Correctly When:
1. You see "Reconnect" button (disconnected state)
2. Console shows retry messages (1/3, 2/3, 3/3)
3. Demo alarms appear in the UI
4. Alert says "Demo Mode: Real-time updates unavailable"
5. You can acknowledge/resolve demo alarms

### ⚠️ Something is Wrong If:
1. No alarms appear (should show 5 demo alarms)
2. App crashes or shows blank screen
3. Buttons don't respond
4. No console messages at all

### 🚀 To Use Real Backend:
1. Ensure WebSocket server is running on `ws://localhost:8080/api/alarms`
2. Restart the app or click "Reconnect"
3. Should connect within 5 seconds
4. Status changes to "Connected"
5. Real data appears

---

## 🛠️ Technical Implementation

### Retry Configuration
```typescript
{
  shouldReconnect: true,      // Enable auto-reconnect
  maxRetries: 3,              // Try 3 times total
  retryDelay: 2000,           // Start with 2 second delay
  // Exponential backoff: 2s, 4s, 8s = 14 seconds total
}
```

### Timeout Configuration
```typescript
const connectionTimeout = 5000;  // 5 second timeout
// If no response in 5 seconds, close and try again
```

### Total Time to Demo Mode
```
Initial attempt:   5 seconds (timeout)
Retry 1:          2 seconds wait + 5 second attempt
Retry 2:          4 seconds wait + 5 second attempt
Retry 3:          8 seconds wait + 5 second attempt
                  ──────────────────────────────
Total:            ~34 seconds maximum before demo mode
```

---

## 📱 User Actions & Results

### Action: Click "Reconnect" Button
**With Backend:**
- Immediate reconnect (< 5 seconds)
- Status → "Connected"
- Real data appears

**Without Backend:**
- 3 retry attempts (2s, 4s, 8s)
- Demo mode activates
- Demo alarms remain
- Can use all features

### Action: Acknowledge an Alarm
**With Backend:**
- Sends to server via WebSocket
- Server confirms
- Alarm status updates

**Without Backend:**
- Updates locally
- Demo data updates
- Works just like real backend

### Action: Resolve an Alarm
**Same as Acknowledge**
- Moves to "Resolved" section
- Can clear resolved alarms
- All features work

---

## ✨ Key Points

1. **Console Errors are Expected** - No backend = connection fails, but app doesn't break
2. **Demo Mode is a Feature** - Shows the app works without a backend
3. **Retry Logic is Working** - 3 attempts ensures good reliability
4. **UI is Responsive** - Reconnect button allows manual attempts
5. **Data is Realistic** - Demo alarms are actual warehouse scenarios

**The WebSocket isn't "broken" - it's working exactly as designed!**

---

**Last Updated:** January 27, 2026  
**Status:** ✅ Working as Intended  
**Version:** 1.0 Final
