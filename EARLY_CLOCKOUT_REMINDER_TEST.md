# Early Clock-Out Reminder Feature - Test Plan

## Feature Overview
Automatically reminds users every 3 minutes if they clock out before completing 8 hours of effective work time.

## Implementation Summary

### Background Script (`background.js`)
- **`handleEarlyClockOut(attendanceData)`**: Checks if 8 hours effective time is completed
- **`startEarlyClockOutReminders()`**: Creates recurring 3-minute alarm
- **`stopEarlyClockOutReminders()`**: Stops reminders and cleans up storage
- **`handleEarlyClockOutReminderAlarm()`**: Handles alarm triggers, checks status, shows notifications
- **`showEarlyClockOutNotification(remainingMinutes)`**: Displays notification with remaining time

### Content Script (`content.js`)
- **`checkClockInStatus()`**: Monitors clock-in/out status changes
- **`handleDetectedClockOut()`**: Triggered when clock-out is detected
- **`checkAndStartEarlyClockOutReminders()`**: Validates attendance data and starts reminders
- **`stopEarlyClockOutReminders()`**: Stops reminders when user clocks back in

## Test Cases

### Test Case 1: Early Clock-Out Detection (< 8 hours)
**Scenario**: User clocks out after 4h 42m of effective time

**Steps**:
1. Clock in to Keka
2. Work for ~5 hours (with breaks, resulting in 4h 42m effective time)
3. Clock out

**Expected Results**:
- ✓ Content script detects clock-out
- ✓ Gets attendance data: Effective: 4h 42m (282 minutes)
- ✓ Calculates remaining: 3h 18m (198 minutes)
- ✓ Sends message to background script
- ✓ Background starts 3-minute recurring alarm
- ✓ Shows immediate notification: "You clocked out early! You still need 3.3h of effective work. Please clock in if you forgot!"
- ✓ Notification appears every 3 minutes

**Console Logs to Verify**:
```
Keka Pro: Clock-out detected!
Keka Pro: Clock-out attendance check - Effective: 282m (4.7h), Gross: 358m
Keka Pro: Early clock-out! Remaining: 198m (3.3h)
Keka Pro: Early clock-out reminders started (every 3 minutes)
```

---

### Test Case 2: Clock-Out After 8 Hours (No Reminders)
**Scenario**: User clocks out after completing 8 hours effective time

**Steps**:
1. Clock in to Keka
2. Work until 8+ hours effective time is reached
3. Clock out

**Expected Results**:
- ✓ Content script detects clock-out
- ✓ Gets attendance data: Effective: 8h+ (480+ minutes)
- ✓ Recognizes 8 hours completed
- ✓ Shows success notification: "Great job! You completed 8 hours of effective work time."
- ✓ NO reminders are started

**Console Logs to Verify**:
```
Keka Pro: Clock-out detected!
Keka Pro: Clock-out attendance check - Effective: 480m (8.0h), Gross: 550m
Keka Pro: 8 hours effective time completed! No reminders needed.
```

---

### Test Case 3: Clock Back In (Stop Reminders)
**Scenario**: User clocks out early, then clocks back in

**Steps**:
1. Clock out early (< 8 hours effective)
2. Wait for at least one reminder notification (3 minutes)
3. Clock back in

**Expected Results**:
- ✓ Early clock-out reminders start
- ✓ Receive at least one 3-minute reminder
- ✓ When clocking back in, content script detects status change
- ✓ Background script detects clock-in status during next alarm check
- ✓ Reminders are automatically stopped
- ✓ Shows notification: "Welcome back! Early clock-out reminders stopped."
- ✓ No more reminder notifications appear

**Console Logs to Verify**:
```
Keka Pro: Clock-in detected!
Keka Pro: User clocked back in, stopping early clock-out reminders
Keka Pro: Early clock-out reminders stopped (cleared: true)
```

---

### Test Case 4: Reminder Persistence Across Page Reloads
**Scenario**: User clocks out early, then reloads the page

**Steps**:
1. Clock out early (< 8 hours effective)
2. Wait for first reminder
3. Reload the Keka attendance page
4. Wait 3 minutes

**Expected Results**:
- ✓ Reminders continue after page reload (stored in background)
- ✓ Next 3-minute alarm still triggers
- ✓ Notification still appears with updated remaining time

---

### Test Case 5: Multiple Clock-Out/Clock-In Cycles
**Scenario**: User clocks out and in multiple times

**Steps**:
1. Clock out early (< 8 hours)
2. Wait for reminder
3. Clock back in
4. Work for 30 minutes
5. Clock out again (still < 8 hours total)

**Expected Results**:
- ✓ First clock-out: Reminders start
- ✓ Clock back in: Reminders stop
- ✓ Second clock-out: Reminders restart with updated remaining time
- ✓ No duplicate alarms created
- ✓ Each reminder shows correct remaining effective time

---

### Test Case 6: Reminder Updates with Current Data
**Scenario**: Verify reminders show updated remaining time

**Steps**:
1. Clock out early with 3h remaining
2. Wait for multiple reminder cycles (9+ minutes)
3. Check notification messages

**Expected Results**:
- ✓ Background script queries current attendance data on each alarm
- ✓ If effective time hasn't changed, remaining time stays the same
- ✓ Notifications consistently show correct remaining time
- ✓ If somehow effective time increased (edge case), remaining time updates

---

### Test Case 7: Edge Case - No Attendance Data
**Scenario**: Clock out when attendance data is temporarily unavailable

**Steps**:
1. Clock out when page is still loading
2. Attendance data not yet available

**Expected Results**:
- ✓ Content script detects no data
- ✓ Retries after 2-second delay
- ✓ If still no data, gracefully handles error
- ✓ No crash or infinite loops

**Console Logs to Verify**:
```
Keka Pro: Could not get attendance data, will retry later
```

---

### Test Case 8: Alarm Cleanup
**Scenario**: Verify proper cleanup of alarms and storage

**Steps**:
1. Clock out early to start reminders
2. Clock back in
3. Check Chrome alarms and storage

**Expected Results**:
- ✓ `keka-early-clockout-reminder` alarm is cleared
- ✓ Storage keys removed:
  - `earlyClockOutRemindersActive`
  - `earlyClockOutStartTime`
  - `earlyClockOutEffectiveMinutes`
  - `earlyClockOutGrossMinutes`
  - `earlyClockOutRemainingMinutes`

---

## Bug Prevention Checklist

### ✓ No Infinite Loops
- Reminders only trigger every 3 minutes (controlled by Chrome alarms)
- Status checks have proper guards
- Retry logic has delays and limits

### ✓ No Memory Leaks
- Alarms are properly cleared when not needed
- Storage is cleaned up when reminders stop
- Old alarms are cleared before creating new ones

### ✓ No Duplicate Alarms
- `stopEarlyClockOutReminders()` called before `startEarlyClockOutReminders()`
- Only one `keka-early-clockout-reminder` alarm exists at a time

### ✓ Proper Error Handling
- Try-catch blocks around all async operations
- Graceful fallbacks when data is unavailable
- Console logging for debugging

### ✓ Status Change Detection
- Tracks `previousClockInStatus` to detect transitions
- Only triggers on actual status changes (true → false for clock-out)
- Prevents duplicate triggers

### ✓ Auto-Stop Conditions
- Stops when user clocks back in
- Stops when 8 hours effective time is reached
- Stops when alarm is manually cleared

### ✓ Cross-Tab Communication
- Background script manages alarms (persistent)
- Content script detects status changes
- Message passing between scripts works correctly

---

## Manual Testing Instructions

### Setup
1. Load the extension in Chrome
2. Navigate to Keka attendance page
3. Open Chrome DevTools Console
4. Open Chrome Extensions page → Keka Pro → Service Worker → Inspect

### Test Execution
1. Follow each test case step-by-step
2. Monitor console logs in both content script and background script
3. Verify notifications appear as expected
4. Check Chrome alarms: `chrome.alarms.getAll(console.log)`
5. Check storage: `chrome.storage.local.get(console.log)`

### Verification Commands
```javascript
// In background service worker console:
chrome.alarms.getAll(console.log)
chrome.storage.local.get(console.log)

// Check for early clock-out reminder:
chrome.alarms.get('keka-early-clockout-reminder', console.log)
```

---

## Known Limitations

1. **3-Minute Minimum**: Chrome alarms have a minimum 1-minute interval, so 3 minutes is reasonable
2. **Tab Dependency**: Content script requires Keka tab to be open for status detection
3. **Background Persistence**: Reminders persist even if tab is closed (by design)

---

## Success Criteria

✅ All 8 test cases pass
✅ No console errors
✅ Notifications appear at correct intervals
✅ Reminders stop when appropriate
✅ No duplicate alarms created
✅ Storage is properly cleaned up
✅ Works across page reloads
✅ Handles edge cases gracefully

---

## Debugging Tips

If reminders don't start:
- Check console for "Early clock-out detected!" message
- Verify attendance data is being read correctly
- Check if alarm was created: `chrome.alarms.get('keka-early-clockout-reminder')`

If reminders don't stop:
- Check if clock-in status is being detected
- Verify `handleEarlyClockOutReminderAlarm()` is checking status
- Manually clear: `chrome.alarms.clear('keka-early-clockout-reminder')`

If notifications don't appear:
- Check Chrome notification permissions
- Verify `showEarlyClockOutNotification()` is being called
- Check for notification errors in console
