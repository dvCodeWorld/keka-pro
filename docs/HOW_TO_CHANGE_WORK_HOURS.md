# How to Change Work Hours Policy

## Quick Guide

To change the required work hours from the default **8 hours** to your organization's policy (e.g., 9 hours, 7.5 hours, etc.), you only need to modify **ONE SINGLE LINE** in **ONE FILE**.

---

## Step-by-Step Instructions

### 1. Open the Configuration File

Navigate to and open:
```
src/config/constants.js
```

### 2. Find the Work Hours Setting

Look for this line (around line 33):

```javascript
export const REQUIRED_WORK_HOURS = 8;
```

### 3. Change the Value

Simply change the number to your required work hours:

**For 9 hours:**
```javascript
export const REQUIRED_WORK_HOURS = 9;
```

**For 7.5 hours:**
```javascript
export const REQUIRED_WORK_HOURS = 7.5;
```

**For 10 hours:**
```javascript
export const REQUIRED_WORK_HOURS = 10;
```

### 4. Save and Reload Extension

1. Save the file
2. Go to `chrome://extensions/`
3. Click the **Reload** button on the Keka Pro extension
4. Done! ✅

---

## What This Changes

Changing `REQUIRED_WORK_HOURS` automatically updates:

### ✅ Auto Clock-Out Feature
- Clocks you out after completing the required **effective** work hours
- Example: If set to 9, auto clock-out happens after 9 hours of effective work

### ✅ Early Clock-Out Reminders
- Reminds you every 3 minutes if you clock out before completing required hours
- Example: If set to 9 and you clock out at 7h effective, you'll get reminders

### ✅ Attendance Page Display
- Shows "X Hours At:" label with your configured hours
- Example: If set to 9, displays "9 Hours At: 06:30 PM"

### ✅ All Notifications
- Success messages: "You completed X hours of effective work time"
- Reminder messages: "You still need X hours of effective work"
- Auto clock-out messages: "Clocked out after X hours"

---

## Important Notes

### ⚠️ This is EFFECTIVE Hours, Not Gross Hours

**Effective Hours** = Actual work time (excludes breaks)
**Gross Hours** = Total time including breaks

Example:
- If you set `REQUIRED_WORK_HOURS = 9`
- You work from 10:00 AM to 7:30 PM (9.5 gross hours)
- But take 30 minutes of breaks
- Your effective time = 9 hours ✅ (requirement met)

### 📊 Common Work Hour Policies

The configuration file includes these common values for reference:

| Organization Type | Hours | Value to Set |
|------------------|-------|--------------|
| Standard (most common) | 8 hours | `8` |
| Extended shift | 9 hours | `9` |
| Reduced hours | 7.5 hours | `7.5` |
| Long shift | 10 hours | `10` |
| Part-time | 6 hours | `6` |

### 🔄 Automatic Calculations

When you change `REQUIRED_WORK_HOURS`, these values are **automatically calculated**:

- `REQUIRED_WORK_MINUTES` = `REQUIRED_WORK_HOURS × 60`
- `WORK_HOURS_LABEL` = `"X Hours At:"`

**You don't need to change anything else!**

---

## Advanced Configuration (Optional)

If you want to customize other settings, you can also modify these in the same file:

### Auto Clock-Out Buffer
```javascript
export const AUTO_CLOCKOUT_BUFFER_MINUTES = 1;
```
Adds extra minutes after required hours before auto clock-out (default: 1 minute)

### Early Clock-Out Reminder Interval
```javascript
export const EARLY_CLOCKOUT_REMINDER_INTERVAL = 3;
```
How often to remind if clocked out early (default: 3 minutes)

### Regular Clock-Out Reminder Interval
```javascript
export const REGULAR_CLOCKOUT_REMINDER_INTERVAL = 2;
```
How often to remind when clocked out normally (default: 2 minutes)

---

## Troubleshooting

### Changes Not Taking Effect?

1. **Make sure you saved the file**
2. **Reload the extension** at `chrome://extensions/`
3. **Refresh the Keka page** (F5 or Cmd+R)
4. **Check the console** for any errors (F12 → Console tab)

### Verify Your Changes

After reloading, check:
- The attendance page should show "X Hours At:" with your new value
- Console logs should mention your new hour value
- Notifications should reference your new hour value

### Still Not Working?

1. Open DevTools Console (F12)
2. Type: `chrome.storage.local.get(console.log)`
3. Check if old values are cached
4. Clear extension storage if needed

---

## File Structure Reference

```
Keka Pro/
├── src/
│   ├── config/
│   │   └── constants.js          ← CHANGE THIS FILE ONLY
│   ├── background/
│   │   └── background.js         ← Uses constants (don't edit)
│   └── content/
│       └── content.js            ← Uses constants (don't edit)
└── manifest.json                 ← Don't edit
```

---

## Example: Changing from 8 to 9 Hours

**Before:**
```javascript
// src/config/constants.js
export const REQUIRED_WORK_HOURS = 8;
```

**After:**
```javascript
// src/config/constants.js
export const REQUIRED_WORK_HOURS = 9;
```

**Result:**
- ✅ Auto clock-out after 9 hours effective time
- ✅ Display shows "9 Hours At: XX:XX PM"
- ✅ Reminders say "You need 9 hours of effective work"
- ✅ All calculations use 540 minutes (9 × 60)

---

## Summary

**ONE FILE. ONE LINE. ONE NUMBER.**

```javascript
// src/config/constants.js
export const REQUIRED_WORK_HOURS = 8;  // Change this number
```

That's it! The entire extension will automatically adapt to your new work hours policy.
