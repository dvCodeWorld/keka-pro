# Keka Pro Extension

A powerful browser extension that enhances Keka attendance management with real clock-in/clock-out functionality, intelligent attendance tracking, automated scheduling, and a modern tabbed interface.

## 🚀 Features

### **Real Attendance Management**
- **One-Click Clock-In** - Directly clock in through the extension popup
- **Two-Step Clock-Out** - Secure clock-out process matching Keka's native flow
- **Real-Time Status Detection** - Automatically detects your current attendance state
- **Live Time Display** - Shows current time with date in a professional interface
- **Background Execution** - Scheduled tasks run even when popup is closed

### **Smart Attendance Analytics**
- **Work Hours Completion Tracker** - Shows exactly when you'll complete required work hours
- **Configurable Work Hours** - Easily change from 8 to 9 hours (or any value) in one place
- **Break Time Calculator** - Displays total break time taken
- **Clock-In Time Display** - Shows your actual clock-in time
- **Effective vs Gross Hours** - Clear breakdown of your work hours
- **Intelligent Calculations** - Accurate time predictions based on break patterns

### **Modern Tabbed Interface**
- **Dashboard Tab** - Real-time clock display and quick actions
- **Schedule Tab** - Advanced scheduling with modern form controls
- **Tasks Tab** - View and manage scheduled attendance actions
- **Compact Design** - All features accessible without scrolling (380×500px)
- **Professional Styling** - Glass-morphism effects and gradient designs

### **Intelligent Automation**
- **Auto Clock-Out** - Automatically clocks out after completing required effective work hours
- **Early Clock-Out Reminders** - Reminds you every 3 minutes if you clock out before completing required hours
- **Smart Detection** - Automatically stops reminders when you clock back in or complete required hours
- **Configurable Policy** - Single constant to change work hours policy (8h, 9h, 7.5h, etc.)

### **Enhanced User Experience**
- **Keka-Native Interface** - UI designed to match Keka's look and feel
- **Modern Radio Buttons** - Card-style selection with hover effects
- **Success/Error Feedback** - Clear notifications with smooth animations
- **Persistent Scheduling** - Chrome alarms ensure tasks execute on time
- **Intelligent Storage** - Remembers preferences and scheduled tasks

## 📦 Installation

### **For Chrome/Edge/Chromium Browsers:**

1. **Download the Extension**
   ```bash
   git clone https://github.com/your-repo/keka-pro-extension.git
   cd keka-pro-extension
   ```

2. **Load in Browser**
   - Open Chrome/Edge and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right)
   - Click **"Load unpacked"**
   - Select the project folder
   - Extension will appear in your toolbar

3. **Verify Installation**
   - Look for the Keka Pro icon in your browser toolbar
   - Navigate to your Keka attendance page
   - Click the extension icon to open the popup

4. **Configure Work Hours (Optional)**
   - Default is 8 hours of effective work time
   - To change (e.g., to 9 hours), see [Configuration](#-configuration) section below

## 🎯 Usage

### **Tabbed Interface Navigation**

The extension features a modern 3-tab interface for organized functionality:

#### **📊 Dashboard Tab (Default)**
1. **Real-Time Clock Display**
   - Shows current time in 12-hour format with AM/PM
   - Displays current date below the time
   - Updates every second automatically

2. **Attendance Information**
   - Shows current status (Clocked In/Out)
   - Displays total hours worked
   - Shows last action timestamp

3. **Quick Actions**
   - **Web Clock-In** - One-click to clock in
   - **Web Clock-out** - First step of two-step clock-out
   - **Clock-out + Cancel** - Confirmation buttons for final clock-out

#### **⏰ Schedule Tab**
1. **Action Type Selection**
   - Modern card-style radio buttons
   - Choose between Clock In or Clock Out
   - Visual feedback on selection

2. **Time Configuration**
   - **Scheduled Time** - Set specific time (HH:MM format)
   - **Auto Time** - Add minutes to current time (1-480 minutes)
   - Real-time validation and feedback

3. **Task Scheduling**
   - Click **"SCHEDULE TASK"** to create persistent task
   - Tasks survive browser restarts
   - Background execution via Chrome alarms

#### **📋 Tasks Tab**
1. **Active Tasks View**
   - Lists all scheduled tasks
   - Shows task type and scheduled time
   - Real-time status updates

2. **Task Management**
   - Cancel pending tasks
   - View task history
   - Clear completed tasks

### **Basic Clock-In/Clock-Out Workflow**

1. **Navigate to Keka**
   - Go to your Keka attendance page (`https://your-company.keka.com/#/me/attendance/logs`)
   - Extension automatically detects page and status

2. **Immediate Clock In**
   - Open extension popup (Dashboard tab)
   - Click **"Web Clock-In"** button
   - Success notification confirms action

3. **Two-Step Clock Out**
   - Click **"Web Clock-out"** button
   - Confirmation buttons appear
   - Click **"Clock-out"** to confirm or **"Cancel"** to abort

### **Advanced Scheduling**

1. **Schedule Future Action**
   - Switch to **Schedule** tab
   - Select action type (Clock In/Out)
   - Set time or use auto-time
   - Click **"SCHEDULE TASK"**

2. **Monitor Scheduled Tasks**
   - Switch to **Tasks** tab
   - View all pending tasks
   - Cancel if needed

3. **Background Execution**
   - Tasks run automatically at scheduled time
   - Works even when browser is closed
   - Retry mechanism for failed attempts

## ⚙️ Configuration

### **Changing Work Hours Policy**

The extension uses a **centralized configuration** system. To change the required work hours from 8 to any other value (e.g., 9 hours, 7.5 hours):

**ONE FILE. ONE LINE. ONE NUMBER.**

1. Open `src/config/constants.js`
2. Find line 33: `export const REQUIRED_WORK_HOURS = 8;`
3. Change `8` to your required hours (e.g., `9` for 9 hours)
4. Save and reload the extension

**Example:**
```javascript
// For 9-hour work policy
export const REQUIRED_WORK_HOURS = 9;

// For 7.5-hour work policy
export const REQUIRED_WORK_HOURS = 7.5;
```

**What Changes Automatically:**
- ✅ Auto clock-out timing (clocks out after X hours effective time)
- ✅ Early clock-out reminders (reminds if you clock out before X hours)
- ✅ Display labels ("X Hours At:" on attendance page)
- ✅ All notifications and messages
- ✅ All time calculations

**Detailed Guide:** See `HOW_TO_CHANGE_WORK_HOURS.md` for comprehensive instructions.

### **Other Configuration Options**

In the same `constants.js` file, you can also customize:

```javascript
// Auto clock-out buffer (default: 1 minute)
export const AUTO_CLOCKOUT_BUFFER_MINUTES = 1;

// Early clock-out reminder interval (default: 3 minutes)
export const EARLY_CLOCKOUT_REMINDER_INTERVAL = 3;

// Regular clock-out reminder interval (default: 2 minutes)
export const REGULAR_CLOCKOUT_REMINDER_INTERVAL = 2;
```

## 🏗️ Project Structure

```
keka-pro-extension/
├── manifest.json                 # Extension configuration (Manifest V3)
├── package.json                  # Project metadata and scripts
├── HOW_TO_CHANGE_WORK_HOURS.md  # Guide for changing work hours policy
├── EARLY_CLOCKOUT_REMINDER_TEST.md  # Test plan for early clock-out feature
├── test-early-clockout.js       # Automated test script
├── src/
│   ├── config/
│   │   └── constants.js         # ⚙️ CENTRALIZED CONFIGURATION (change work hours here)
│   ├── popup/
│   │   ├── index.html           # Simple welcome page
│   │   ├── main.html            # Main popup interface with tabbed design
│   │   ├── popup.js             # Popup logic, message handling & UI management
│   │   └── popup.css            # Keka-inspired styling with glass-morphism
│   ├── content/
│   │   └── content.js           # Keka page interaction, DOM manipulation & calculations
│   ├── background/
│   │   └── background.js        # Service worker for task scheduling & persistence
│   └── assets/
│       ├── icons/               # Extension icons (PNG, ICO, SVG)
│       │   ├── favicon.png
│       │   ├── favicon.ico
│       │   └── keka-full-dark-24.svg
│       └── images/              # UI assets (empty)
├── docs/                        # Documentation (empty)
└── README.md                    # This file
```

## 🔧 Technical Details

### **Architecture**
- **Manifest V3** compliance for modern browsers
- **Message Passing** between popup and content script
- **Chrome Extension APIs** for tab management and storage
- **Real-time DOM Monitoring** for dynamic Keka content

### **Key Components**

#### **Configuration** (`config/constants.js`)
- **Centralized Work Hours** - Single source of truth for required work hours policy
- **Auto-Calculated Values** - Automatically derives minutes and labels from hours
- **Configurable Intervals** - Customizable reminder and buffer times
- **Well Documented** - Comprehensive comments explaining each constant
- **ES6 Module** - Exports constants for use across all scripts

#### **Content Script** (`content.js`)
- **DOM Monitoring** - Watches Keka page for attendance elements with MutationObserver
- **Button Interaction** - Finds and clicks clock-in/out buttons with intelligent selectors
- **Data Extraction** - Parses effective/gross hours and calculates metrics with NaN protection
- **SPA Compatibility** - Handles dynamic content loading and navigation
- **Enhanced Calculations** - Robust time parsing with comprehensive error handling
- **Status Detection** - Real-time clock-in status monitoring with multiple validation methods
- **Early Clock-Out Detection** - Detects when user clocks out before completing required hours
- **Break Calculations** - Accurate break time tracking and work hours completion predictions

#### **Popup Interface** (`popup.js`)
- **Tabbed Navigation** - Manages 3-tab interface (Dashboard, Schedule, Tasks) with smooth transitions
- **Real-Time Updates** - Clock display updates every second with date formatting
- **Message Passing** - Communicates with content script and background worker
- **Enhanced Error Handling** - Comprehensive null reference protection and graceful fallbacks
- **State Management** - Tracks attendance status, scheduled tasks, and UI state
- **Auto-Scheduling** - Intelligent task scheduling with time validation
- **Task Management** - Complete task lifecycle management with persistence

#### **Background Service Worker** (`background.js`)
- **Chrome Alarms** - Persistent task scheduling using browser APIs
- **Task Execution** - Runs scheduled actions even when popup is closed
- **Storage Management** - Handles task persistence and cleanup
- **Auto Clock-Out** - Intelligent automatic clock-out based on **effective** work hours
- **Early Clock-Out Reminders** - 3-minute interval reminders if clocked out before required hours
- **Smart Detection** - Auto-stops reminders when user clocks back in or completes required hours
- **Dynamic Calculations** - Estimates completion time based on current break rate
- **Smart Notifications** - Clock-out reminders and task completion alerts
- **Error Recovery** - Retry mechanisms for failed executions
- **Debug Support** - Comprehensive alarm debugging and monitoring

#### **Modern Styling** (`popup.css`)
- **Tabbed Interface** - Professional tab navigation with hover effects
- **Glass-morphism** - Modern backdrop blur and transparency effects
- **Gradient Designs** - Enhanced buttons with gradient backgrounds
- **Card-Style Controls** - Modern radio buttons and form elements
- **Responsive Animations** - Smooth transitions and micro-interactions
- **Compact Layout** - Fixed 380×500px dimensions without scrolling

### **Browser Compatibility**
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Chromium-based browsers
- ❌ Firefox (Manifest V2 required)
- ❌ Safari (Different extension system)

## 🔐 Permissions & Security

### **Required Permissions**
```json
{
  "permissions": ["activeTab", "storage", "alarms", "notifications"],
  "host_permissions": ["https://*.keka.com/*"]
}
```

- **`activeTab`** - Interact with the currently active Keka tab
- **`storage`** - Store task data and user preferences locally
- **`alarms`** - Schedule persistent background tasks
- **`notifications`** - Display task completion and reminder notifications
- **`host_permissions`** - Access to all Keka subdomains for your company

### **Privacy & Data**
- **No data collection** - Extension works entirely locally
- **No external requests** - Only interacts with Keka pages
- **Local storage only** - Preferences stored in browser storage
- **No tracking** - No analytics or user monitoring

## 🚨 Troubleshooting

### **Common Issues**

#### **"Button not found" errors**
- Ensure you're on the correct Keka attendance page
- Refresh the page and try again
- Check if Keka's interface has changed

#### **Extension not working**
- Verify you're on a `*.keka.com` domain
- Check that the extension is enabled in `chrome://extensions/`
- Try reloading the extension

#### **Clock actions not working**
- Make sure you're logged into Keka
- Verify the attendance page has loaded completely
- Check browser console for error messages

### **Debug Mode**
Open browser developer tools (F12) and check the console for detailed logs:
- `Keka Pro: [action]` - Extension activity logs
- Error messages will show specific issues

## 🔄 Version History

### **Version 3.0** (Current)
- 🎨 **Modern Tabbed Interface** - Dashboard, Schedule, and Tasks tabs
- 🔘 **Enhanced Radio Buttons** - Card-style selection with hover effects
- 🎯 **Improved UX** - Better form controls and visual feedback
- ⚙️ **Centralized Configuration** - Single constant to change work hours policy (8h → 9h)
- 🔧 **Fixed Calculations** - Accurate work hours completion and break time with NaN protection
- 🚀 **Background Service Worker** - Persistent task execution with Chrome alarms
- 💫 **Visual Polish** - Gradient buttons, glass-morphism, smooth animations
- 🛡️ **Enhanced Error Handling** - Comprehensive null reference protection and graceful fallbacks
- 📱 **Compact Design** - Fixed dimensions (380×500px) without scrolling
- 🔄 **Auto Clock-Out** - Intelligent automatic clock-out based on **effective** work hours
- 🔔 **Early Clock-Out Reminders** - 3-minute reminders if clocked out before required hours
- 🧠 **Smart Detection** - Auto-stops reminders when clocked back in or hours completed
- 📊 **Real-Time Status Detection** - Advanced clock-in status monitoring
- 🔔 **Smart Notifications** - Clock-out reminders and task notifications

### **Version 2.0**
- ✨ Real clock-in/clock-out functionality
- ✨ Keka-native UI design
- ✨ Two-step clock-out process
- ✨ Real-time status detection
- ✨ Enhanced error handling
- ✨ Message passing architecture

### **Version 1.0**
- 📊 Basic attendance information display
- ⏰ 8-hour completion calculator
- 📈 Break time tracking
- 🕐 Clock-in time display

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📋 What's New in v3.0

### **🎨 Interface Redesign**
- **Tabbed Navigation** - Organized functionality across 3 dedicated tabs
- **Modern Controls** - Card-style radio buttons replace basic circles
- **Professional Styling** - Glass-morphism effects and gradient designs
- **Compact Layout** - All features fit in 380×500px without scrolling
- **Dual HTML Structure** - Welcome page (index.html) and main interface (main.html)

### **🔧 Enhanced Functionality**
- **Centralized Configuration** - Change work hours policy in one place (8h, 9h, 7.5h, etc.)
- **Background Execution** - Scheduled tasks run via Chrome alarms
- **Auto Clock-Out** - Intelligent automatic clock-out based on **effective** work hours
- **Early Clock-Out Reminders** - 3-minute interval reminders if clocked out early
- **Smart Auto-Stop** - Reminders stop when you clock back in or complete required hours
- **Dynamic Calculations** - Estimates completion time based on current break patterns
- **Smart Notifications** - Clock-out reminders and task alerts
- **Improved Calculations** - Fixed time prediction algorithms with NaN protection
- **Enhanced Error Handling** - Comprehensive null reference protection throughout
- **Visual Feedback** - Enhanced animations and status messages
- **Debug Support** - Advanced alarm debugging and monitoring tools

### **🚀 Performance Improvements**
- **Faster Load Times** - Optimized CSS and JavaScript
- **Smoother Animations** - Cubic-bezier transitions for premium feel
- **Better Responsiveness** - Improved event handling and state management
- **Robust Calculations** - Enhanced time parsing with comprehensive validation
- **Memory Management** - Efficient storage and cleanup of task data

## ⚠️ Disclaimer

This extension is not officially affiliated with Keka. Use at your own discretion and ensure compliance with your company's policies regarding attendance tracking tools.

## 🤝 Support

For issues, feature requests, or contributions:
- Check the browser console for detailed error logs
- Ensure you're on the correct Keka attendance page
- Verify extension permissions are granted
- Report bugs with specific error messages and steps to reproduce
