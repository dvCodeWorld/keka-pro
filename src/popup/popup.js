/**
 * Keka Pro Extension - Attendance Management
 * Handles clock in/out functionality with auto-scheduling and persistence
 */

class KekaProManager {
    constructor() {
        this.storageKey = 'kekaProData';
        this.currentTask = null;
        this.checkInterval = null;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.updateUI();
        this.startTimeChecker();
        this.updateTimeDisplay();
        this.startTimeDisplayUpdater();
        this.checkKekaPageStatus();
    }

    /**
     * Bind event listeners to form elements
     */
    bindEvents() {
        const runBtn = document.getElementById('runBtn');
        const autoMinutesInput = document.getElementById('autoMinutes');
        
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        // Keka-style buttons
        const webClockInBtn = document.getElementById('webClockInBtn');
        const webClockOutBtn = document.getElementById('webClockOutBtn');
        const confirmClockOutBtn = document.getElementById('confirmClockOutBtn');
        const cancelClockOutBtn = document.getElementById('cancelClockOutBtn');
        
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
        
        if (runBtn) {
            runBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Auto-calculate time when minutes input changes
        if (autoMinutesInput) {
            autoMinutesInput.addEventListener('input', () => {
                this.calculateAutoTime();
            });
            
            // Set default value for auto minutes
            if (!autoMinutesInput.value) {
                autoMinutesInput.value = '15';
                this.calculateAutoTime();
            }
        }

        // Keka-style clock-in button
        if (webClockInBtn) {
            webClockInBtn.addEventListener('click', () => {
                this.handleClockIn();
            });
        }

        // Keka-style clock-out button (first click)
        if (webClockOutBtn) {
            webClockOutBtn.addEventListener('click', () => {
                this.showClockOutConfirmation();
            });
        }

        // Confirm clock-out button (second click)
        if (confirmClockOutBtn) {
            confirmClockOutBtn.addEventListener('click', () => {
                this.handleClockOut();
            });
        }

        // Cancel clock-out button
        if (cancelClockOutBtn) {
            cancelClockOutBtn.addEventListener('click', () => {
                this.hideClockOutConfirmation();
            });
        }
    }

    /**
     * Format date to custom format: "Dec, 20 | 19:22:00"
     * @param {Date} date - Date object to format
     * @returns {string} - Formatted date string
     */
    formatCustomDateTime(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const month = months[date.getMonth()];
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return `${month}, ${day} | ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Calculate and set time based on current time + minutes
     */
    calculateAutoTime() {
        const minutesInput = document.getElementById('autoMinutes');
        const timeInput = document.getElementById('time');
        const minutes = parseInt(minutesInput.value) || 0;
        
        if (minutes > 0) {
            const now = new Date();
            // Add at least 1 minute to ensure it's always in the future
            const minMinutes = Math.max(minutes, 1);
            now.setMinutes(now.getMinutes() + minMinutes);
            
            // Format time as HH:MM for time input
            const hours = now.getHours().toString().padStart(2, '0');
            const mins = now.getMinutes().toString().padStart(2, '0');
            timeInput.value = `${hours}:${mins}`;
        }
    }

    /**
     * Validate if selected time is not in the past
     * @param {string} timeString - Time in HH:MM format
     * @returns {boolean} - True if time is valid (future), false if in past
     */
    validateTime(timeString) {
        const now = new Date();
        const [hours, minutes] = timeString.split(':');
        const selectedTime = new Date();
        selectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If selected time is today but in the past, it's invalid
        if (selectedTime <= now) {
            return false;
        }
        
        return true;
    }

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        // Create or update error message element
        let errorElement = document.getElementById('errorMessage');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'errorMessage';
            errorElement.className = 'error-message';
            
            // Insert after the form
            const form = document.getElementById('attendanceForm');
            form.parentNode.insertBefore(errorElement, form.nextSibling);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Handle form submission
     */
    handleSubmit() {
        const timeForRadios = document.querySelectorAll('input[name="timeFor"]');
        const timeInput = document.getElementById('time');
        
        let selectedAction = null;
        timeForRadios.forEach(radio => {
            if (radio.checked) {
                selectedAction = radio.value;
            }
        });

        if (!selectedAction) {
            this.showError('Please select Check In or Check Out');
            return;
        }

        if (!timeInput.value) {
            this.showError('Please select a time');
            return;
        }

        // Validate time is not in the past
        if (!this.validateTime(timeInput.value)) {
            this.showError('Cannot schedule task for past time. Please select a future time.');
            return;
        }

        // Remove previous task if exists
        if (this.currentTask) {
            this.cancelCurrentTask();
        }

        // Create new task
        this.createTask(selectedAction, timeInput.value);
    }

    /**
     * Create a new scheduled task
     * @param {string} action - 'in' or 'out'
     * @param {string} time - Time in HH:MM format
     */
    async createTask(action, time) {
        const now = new Date();
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date();
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If scheduled time is in the past, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const taskData = {
            id: Date.now(),
            action: action,
            scheduledTime: scheduledTime,
            status: 'pending',
            createdAt: new Date()
        };

        // Send to background script for persistent scheduling
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'scheduleTask',
                taskData: taskData
            });
            
            if (response && response.success) {
                this.currentTask = taskData;
                this.saveToStorage();
                this.updateUI();
                this.showSuccessMessage(`Task scheduled for ${scheduledTime.toLocaleString()}`);
                console.log(`Task created: ${action === 'in' ? 'Clock In' : 'Clock Out'} scheduled for ${scheduledTime.toLocaleString()}`);
            } else {
                this.showErrorMessage(response?.message || 'Failed to schedule task');
            }
        } catch (error) {
            console.error('Error scheduling task:', error);
            this.showErrorMessage('Failed to schedule task');
        }
    }

    /**
     * Cancel the current active task
     */
    async cancelCurrentTask() {
        if (this.currentTask) {
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'cancelTask',
                    taskId: this.currentTask.id
                });
                
                if (response && response.success) {
                    console.log(`Task cancelled: ${this.currentTask.action === 'in' ? 'Clock In' : 'Clock Out'}`);
                    this.currentTask = null;
                    this.saveToStorage();
                    this.updateUI();
                    this.showSuccessMessage('Task cancelled successfully');
                } else {
                    this.showErrorMessage(response?.message || 'Failed to cancel task');
                }
            } catch (error) {
                console.error('Error cancelling task:', error);
                this.showErrorMessage('Failed to cancel task');
            }
        }
    }

    /**
     * Cancel a specific task by ID
     * @param {string} taskId - ID of the task to cancel
     */
    async cancelTaskById(taskId) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'cancelTask',
                taskId: taskId
            });
            
            if (response && response.success) {
                console.log(`Task cancelled: ${taskId}`);
                
                // If this is the current task, clear it
                if (this.currentTask && this.currentTask.id.toString() === taskId.toString()) {
                    this.currentTask = null;
                    this.saveToStorage();
                }
                
                this.updateUI();
                this.showSuccessMessage('Task cancelled successfully');
                
                // Refresh the tasks display
                this.loadScheduledTasks();
            } else {
                this.showErrorMessage(response?.message || 'Failed to cancel task');
            }
        } catch (error) {
            console.error('Error cancelling task:', error);
            this.showErrorMessage('Failed to cancel task');
        }
    }

    /**
     * Handle immediate clock-in action
     */
    async handleClockIn() {
        try {
            // Send message to content script to perform actual clock-in
            const response = await this.sendMessageToContentScript({ action: 'clockIn' });
            
            if (response && response.success) {
                console.log('🟢 CLOCK IN SUCCESS - Employee clocked in successfully!');
                this.updateAttendanceInfo('Clocked In', new Date());
                this.updateAttendanceButtons('clocked_in');
                
                // Schedule auto clock-out after 8 hours 1 minute
                try {
                    const autoClockOutResponse = await chrome.runtime.sendMessage({
                        action: 'clockInSuccess'
                    });
                    
                    if (autoClockOutResponse && autoClockOutResponse.success) {
                        const scheduledTime = new Date(autoClockOutResponse.scheduledTime);
                        this.showSuccessMessage(`Successfully clocked in! Auto clock-out scheduled for ${scheduledTime.toLocaleTimeString()}.`);
                        console.log('🕐 AUTO CLOCK-OUT SCHEDULED for:', scheduledTime.toLocaleString());
                    } else {
                        this.showSuccessMessage('Successfully clocked in!');
                        console.warn('⚠️ Auto clock-out scheduling failed:', autoClockOutResponse?.message);
                    }
                } catch (autoError) {
                    console.error('❌ AUTO CLOCK-OUT SCHEDULING ERROR:', autoError);
                    this.showSuccessMessage('Successfully clocked in!');
                }
            } else {
                console.error('❌ CLOCK IN FAILED:', response?.message || 'Unknown error');
                this.showErrorMessage(response?.message || 'Failed to clock in. Please try again.');
            }
        } catch (error) {
            console.error('❌ CLOCK IN ERROR:', error);
            this.showErrorMessage('Error occurred while clocking in. Make sure you are on the Keka attendance page.');
        }
    }

    /**
     * Show clock-out confirmation buttons
     */
    showClockOutConfirmation() {
        const webClockOutBtn = document.getElementById('webClockOutBtn');
        const clockOutConfirmation = document.getElementById('clockOutConfirmation');
        
        if (webClockOutBtn) webClockOutBtn.style.display = 'none';
        if (clockOutConfirmation) clockOutConfirmation.style.display = 'flex';
    }

    /**
     * Hide clock-out confirmation buttons
     */
    hideClockOutConfirmation() {
        const webClockOutBtn = document.getElementById('webClockOutBtn');
        const clockOutConfirmation = document.getElementById('clockOutConfirmation');
        
        if (webClockOutBtn) webClockOutBtn.style.display = 'block';
        if (clockOutConfirmation) clockOutConfirmation.style.display = 'none';
    }

    /**
     * Handle immediate clock-out action (two-step process)
     */
    async handleClockOut() {
        try {
            // Step 1: Click "Web Clock-out" button
            const step1Response = await this.sendMessageToContentScript({ action: 'clockOutStep1' });
            
            if (step1Response && step1Response.success) {
                console.log('🟡 CLOCK OUT STEP 1 SUCCESS');
                
                // Step 2: Wait a moment then click final "Clock-out" button
                setTimeout(async () => {
                    try {
                        const step2Response = await this.sendMessageToContentScript({ action: 'clockOutStep2' });
                        
                        if (step2Response && step2Response.success) {
                            console.log('🔴 CLOCK OUT SUCCESS - Employee clocked out successfully!');
                            this.updateAttendanceInfo('Clocked Out', new Date());
                            this.updateAttendanceButtons('clocked_out');
                            this.hideClockOutConfirmation();
                            
                            // Cancel auto clock-out since user manually clocked out
                            try {
                                const cancelAutoResponse = await chrome.runtime.sendMessage({
                                    action: 'clockOutSuccess'
                                });
                                
                                if (cancelAutoResponse && cancelAutoResponse.success) {
                                    this.showSuccessMessage('Successfully clocked out! Auto clock-out cancelled.');
                                    console.log('🚫 AUTO CLOCK-OUT CANCELLED - Manual clock-out completed');
                                } else {
                                    this.showSuccessMessage('Successfully clocked out!');
                                    console.warn('⚠️ Auto clock-out cancellation failed:', cancelAutoResponse?.message);
                                }
                            } catch (cancelError) {
                                console.error('❌ AUTO CLOCK-OUT CANCELLATION ERROR:', cancelError);
                                this.showSuccessMessage('Successfully clocked out!');
                            }
                        } else {
                            console.error('❌ CLOCK OUT STEP 2 FAILED:', step2Response?.message);
                            this.showErrorMessage('Failed to complete clock-out. Please try manually.');
                            this.hideClockOutConfirmation();
                        }
                    } catch (error) {
                        console.error('❌ CLOCK OUT STEP 2 ERROR:', error);
                        this.showErrorMessage('Error in final clock-out step.');
                        this.hideClockOutConfirmation();
                    }
                }, 1000);
            } else {
                console.error('❌ CLOCK OUT STEP 1 FAILED:', step1Response?.message);
                this.showErrorMessage(step1Response?.message || 'Failed to initiate clock-out. Please try again.');
                this.hideClockOutConfirmation();
            }
        } catch (error) {
            console.error('❌ CLOCK OUT ERROR:', error);
            this.showErrorMessage('Error occurred while clocking out. Make sure you are on the Keka attendance page.');
            this.hideClockOutConfirmation();
        }
    }

    /**
     * Update attendance information display
     * @param {string} status - Current attendance status
     * @param {Date} lastAction - Time of last action
     */
    updateAttendanceInfo(status, lastAction) {
        const attendanceInfo = document.getElementById('attendanceInfo');
        const attendanceStatusText = document.getElementById('attendanceStatusText');
        const lastActionElement = document.getElementById('lastAction');
        
        attendanceInfo.style.display = 'block';
        attendanceStatusText.textContent = status;
        lastActionElement.textContent = this.formatCustomDateTime(lastAction);
    }

    /**
     * Update attendance action buttons based on current state
     * @param {string} state - 'clocked_in', 'clocked_out', or 'initial'
     */
    updateAttendanceButtons(state) {
        const webClockInBtn = document.getElementById('webClockInBtn');
        const webClockOutBtn = document.getElementById('webClockOutBtn');
        const clockOutConfirmation = document.getElementById('clockOutConfirmation');
        
        // Hide all buttons first
        if (webClockInBtn) webClockInBtn.style.display = 'none';
        if (webClockOutBtn) webClockOutBtn.style.display = 'none';
        if (clockOutConfirmation) clockOutConfirmation.style.display = 'none';
        
        switch(state) {
            case 'clocked_in':
                if (webClockOutBtn) webClockOutBtn.style.display = 'block';
                break;
            case 'clocked_out':
                if (webClockInBtn) webClockInBtn.style.display = 'block';
                break;
            default:
                if (webClockInBtn) webClockInBtn.style.display = 'block';
                break;
        }
    }

    /**
     * Update real-time display
     */
    updateTimeDisplay() {
        const now = new Date();
        const timeHours = document.getElementById('timeHours');
        const timePeriod = document.getElementById('timePeriod');
        const currentDate = document.getElementById('currentDate');
        
        // Format time in 12-hour format
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const displayHours = hours.toString().padStart(2, '0');
        
        timeHours.textContent = `${displayHours}:${minutes}:${seconds}`;
        timePeriod.textContent = ampm;
        
        // Format date
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const dayName = days[now.getDay()];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        
        currentDate.textContent = `${dayName}, ${day} ${month} ${year}`;
    }

    /**
     * Start time display updater
     */
    startTimeDisplayUpdater() {
        // Update time display every second
        setInterval(() => {
            this.updateTimeDisplay();
        }, 1000);
    }

    /**
     * Send message to content script
     * @param {Object} message - Message to send
     * @returns {Promise} - Response from content script
     */
    sendMessageToContentScript(message) {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    /**
     * Show success message to user
     * @param {string} message - Success message to display
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show message to user
     * @param {string} message - Message to display
     * @param {string} type - Message type ('success', 'error', 'info')
     */
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageElement = document.getElementById('statusMessage');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'statusMessage';
            messageElement.className = 'status-message';
            
            // Insert at top of container
            const container = document.querySelector('.keka-extension-container');
            container.appendChild(messageElement);
        }
        
        messageElement.textContent = message;
        messageElement.className = `status-message status-${type}`;
        messageElement.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageElement) {
                messageElement.style.display = 'none';
            }
        }, 3000);
    }

    /**
     * Load scheduled tasks from background script
     */
    async loadScheduledTasks() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'getScheduledTasks'
            });
            
            if (response && response.success) {
                this.displayTasks(response.tasks);
            }
        } catch (error) {
            console.error('Error loading scheduled tasks:', error);
        }
    }

    /**
     * Display tasks in the tasks tab
     * @param {Array} tasks - Array of task objects
     */
    displayTasks(tasks) {
        const taskList = document.getElementById('taskList');
        const noTasks = document.getElementById('noTasks');
        const activeTaskContainer = document.getElementById('activeTaskContainer');
        
        if (tasks.length === 0) {
            activeTaskContainer.style.display = 'none';
            noTasks.style.display = 'flex';
            return;
        }
        
        activeTaskContainer.style.display = 'block';
        noTasks.style.display = 'none';
        
        taskList.innerHTML = tasks.map(task => {
            const actionText = task.action === 'in' ? 'Clock In' : 'Clock Out';
            const scheduledTime = new Date(task.scheduledTime).toLocaleString();
            
            return `
                <div class="task-item">
                    <div class="task-info">
                        <div class="task-type">${actionText}</div>
                        <div class="task-time">Scheduled: ${scheduledTime}</div>
                    </div>
                    <button class="cancel-task-btn" 
                            data-task-id="${task.id}"
                            tabindex="0" 
                            role="button" 
                            aria-label="Cancel ${actionText} task"
                            title="Cancel this task">
                        ✕
                    </button>
                </div>
            `;
        }).join('');
        
        // Add event listeners to cancel buttons
        this.addCancelButtonListeners();
    }

    /**
     * Add event listeners to cancel buttons
     */
    addCancelButtonListeners() {
        const cancelButtons = document.querySelectorAll('.cancel-task-btn');
        cancelButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const taskId = button.getAttribute('data-task-id');
                if (taskId) {
                    this.cancelTaskById(taskId);
                }
            });
            
            // Add keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const taskId = button.getAttribute('data-task-id');
                    if (taskId) {
                        this.cancelTaskById(taskId);
                    }
                }
            });
        });
    }

    /**
     * Execute the scheduled action (now with real functionality)
     * @param {string} action - 'in' or 'out'
     */
    async executeAction(action) {
        if (action === 'in') {
            await this.handleClockIn();
        } else {
            await this.handleClockOut();
        }
        
        // Mark task as completed
        if (this.currentTask) {
            this.currentTask.status = 'completed';
            this.currentTask.completedAt = new Date();
        }
    }

    /**
     * Check if it's time to execute the scheduled task
     */
    checkScheduledTime() {
        if (!this.currentTask || this.currentTask.status !== 'pending') {
            return;
        }

        const now = new Date();
        const scheduledTime = new Date(this.currentTask.scheduledTime);
        
        // Check if current time matches or exceeds scheduled time
        if (now >= scheduledTime) {
            this.currentTask.status = 'active';
            this.executeAction(this.currentTask.action);
            this.saveToStorage();
            this.updateUI();
            
            // Remove completed task after 5 seconds
            setTimeout(() => {
                this.currentTask = null;
                this.saveToStorage();
                this.updateUI();
            }, 5000);
        }
    }

    /**
     * Start the time checker interval
     */
    startTimeChecker() {
        // Check every second for precise timing
        this.checkInterval = setInterval(() => {
            this.checkScheduledTime();
        }, 1000);
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Name of tab to switch to
     */
    switchTab(tabName) {
        // Remove active class from all tabs and panes
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Add active class to selected tab and pane
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Pane`).classList.add('active');
        
        // Load tasks if switching to tasks tab
        if (tabName === 'tasks') {
            this.loadScheduledTasks();
        }
    }

    /**
     * Check if user is on Keka page and get status
     */
    async checkKekaPageStatus() {
        try {
            const response = await this.sendMessageToContentScript({ action: 'getStatus' });
            if (response && response.success !== false) {
                console.log('Keka Pro: Page status:', response);
                // Update UI based on actual Keka page status
                if (response.status === 'clocked_in') {
                    this.updateAttendanceButtons('clocked_in');
                } else if (response.status === 'clocked_out') {
                    this.updateAttendanceButtons('clocked_out');
                }
            }
        } catch (error) {
            console.log('Keka Pro: Not on Keka page or content script not ready');
            // Default to initial state
            this.updateAttendanceButtons('initial');
        }
    }

    /**
     * Update the UI to show current task status and handle form visibility
     */
    updateUI() {
        // Initialize attendance buttons to default state
        this.updateAttendanceButtons('initial');
        
        // Load tasks in tasks tab if it's active
        const tasksTab = document.getElementById('tasksPane');
        if (tasksTab && tasksTab.classList.contains('active')) {
            this.loadScheduledTasks();
        }
    }

    /**
     * Save current state to localStorage
     */
    saveToStorage() {
        const data = {
            currentTask: this.currentTask,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                if (data.currentTask) {
                    // Convert string dates back to Date objects
                    data.currentTask.scheduledTime = new Date(data.currentTask.scheduledTime);
                    data.currentTask.createdAt = new Date(data.currentTask.createdAt);
                    if (data.currentTask.completedAt) {
                        data.currentTask.completedAt = new Date(data.currentTask.completedAt);
                    }
                    
                    // Check if task is still valid (not too old)
                    const now = new Date();
                    const taskAge = now - data.currentTask.createdAt;
                    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                    
                    if (taskAge < maxAge && data.currentTask.status !== 'completed') {
                        this.currentTask = data.currentTask;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    /**
     * Get current task info for debugging
     */
    getCurrentTaskInfo() {
        return this.currentTask;
    }
}

// Make manager available globally for debugging and cancel button
window.kekaManager = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.kekaManager = new KekaProManager();
});
