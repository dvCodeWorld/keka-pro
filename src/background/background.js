/**
 * Keka Pro Extension - Background Service Worker
 * Handles scheduled tasks and persistent functionality
 */

class KekaProBackground {
    constructor() {
        this.init();
    }

    /**
     * Initialize background service worker
     */
    init() {
        // Listen for alarm events (scheduled tasks)
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleScheduledTask(alarm);
        });

        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open
        });

        console.log('Keka Pro: Background service worker initialized');
    }

    /**
     * Handle messages from popup
     * @param {Object} request - Message request
     * @param {Object} sender - Message sender
     * @param {Function} sendResponse - Response callback
     */
    async handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'scheduleTask':
                const result = await this.scheduleTask(request.taskData);
                sendResponse(result);
                break;
            
            case 'cancelTask':
                const cancelResult = await this.cancelScheduledTask(request.taskId);
                sendResponse(cancelResult);
                break;
            
            case 'getScheduledTasks':
                const tasks = await this.getScheduledTasks();
                sendResponse({ success: true, tasks });
                break;
            
            case 'clockInSuccess':
                const autoClockOutResult = await this.scheduleAutoClockOut();
                const stopNotificationsResult = await this.stopClockOutReminders();
                sendResponse(autoClockOutResult);
                break;
            
            case 'clockOutSuccess':
                const cancelAutoResult = await this.cancelAutoClockOut();
                const startNotificationsResult = await this.startClockOutReminders();
                sendResponse(cancelAutoResult);
                break;
            
            case 'debugAlarms':
                const debugResult = await this.debugAlarms();
                sendResponse(debugResult);
                break;
            
            default:
                sendResponse({ success: false, message: 'Unknown action' });
        }
    }

    /**
     * Schedule a task using Chrome alarms
     * @param {Object} taskData - Task information
     */
    async scheduleTask(taskData) {
        try {
            const alarmName = `keka-task-${taskData.id}`;
            const scheduledTime = new Date(taskData.scheduledTime);
            const delayInMinutes = (scheduledTime.getTime() - Date.now()) / (1000 * 60);

            if (delayInMinutes <= 0) {
                return { success: false, message: 'Cannot schedule task in the past' };
            }

            // Create Chrome alarm
            await chrome.alarms.create(alarmName, {
                delayInMinutes: delayInMinutes
            });

            // Store task data
            await chrome.storage.local.set({
                [alarmName]: taskData
            });

            console.log(`Keka Pro: Scheduled task ${taskData.action} for ${scheduledTime.toLocaleString()}`);
            return { success: true, message: 'Task scheduled successfully' };

        } catch (error) {
            console.error('Keka Pro: Error scheduling task:', error);
            return { success: false, message: 'Failed to schedule task' };
        }
    }

    /**
     * Cancel a scheduled task
     * @param {string} taskId - Task ID to cancel
     */
    async cancelScheduledTask(taskId) {
        try {
            const alarmName = `keka-task-${taskId}`;
            
            // Clear the alarm
            await chrome.alarms.clear(alarmName);
            
            // Remove from storage
            await chrome.storage.local.remove(alarmName);

            console.log(`Keka Pro: Cancelled scheduled task ${taskId}`);
            return { success: true, message: 'Task cancelled successfully' };

        } catch (error) {
            console.error('Keka Pro: Error cancelling task:', error);
            return { success: false, message: 'Failed to cancel task' };
        }
    }

    /**
     * Get all scheduled tasks
     */
    async getScheduledTasks() {
        try {
            const alarms = await chrome.alarms.getAll();
            const kekaAlarms = alarms.filter(alarm => alarm.name.startsWith('keka-task-'));
            
            const tasks = [];
            for (const alarm of kekaAlarms) {
                const taskData = await chrome.storage.local.get(alarm.name);
                if (taskData[alarm.name]) {
                    tasks.push({
                        ...taskData[alarm.name],
                        scheduledFor: alarm.scheduledTime
                    });
                }
            }

            return tasks;
        } catch (error) {
            console.error('Keka Pro: Error getting scheduled tasks:', error);
            return [];
        }
    }

    /**
     * Handle scheduled task execution
     * @param {Object} alarm - Chrome alarm object
     */
    async handleScheduledTask(alarm) {
        console.log(`Keka Pro: Alarm triggered: ${alarm.name} at ${new Date().toLocaleString()}`);
        
        if (!alarm.name.startsWith('keka-task-') && alarm.name !== 'keka-auto-clockout' && alarm.name !== 'keka-clockout-reminder') {
            console.log(`Keka Pro: Ignoring non-Keka alarm: ${alarm.name}`);
            return;
        }
        
        // Handle clock-out reminder notifications
        if (alarm.name === 'keka-clockout-reminder') {
            await this.showClockOutReminderNotification();
            return;
        }

        try {
            // Get task data from storage
            const taskData = await chrome.storage.local.get(alarm.name);
            const task = taskData[alarm.name];

            if (!task) {
                console.error('Keka Pro: Task data not found for alarm:', alarm.name);
                console.log('Keka Pro: Available storage keys:', Object.keys(await chrome.storage.local.get()));
                return;
            }

            const taskType = task.isAutoClockOut ? 'auto clock-out' : 'scheduled task';
            console.log(`Keka Pro: Executing ${taskType}: ${task.action} scheduled for ${task.scheduledTime}`);

            // Find Keka tab
            const tabs = await chrome.tabs.query({ url: 'https://*.keka.com/*' });
            console.log(`Keka Pro: Found ${tabs.length} Keka tabs`);
            
            if (tabs.length === 0) {
                console.error('Keka Pro: No Keka tabs found for scheduled task');
                // Try to open Keka tab if it's an auto clock-out
                if (task.isAutoClockOut) {
                    console.log('Keka Pro: Opening Keka tab for auto clock-out');
                    const newTab = await chrome.tabs.create({ 
                        url: 'https://giddh.keka.com/#/me/attendance/logs',
                        active: false 
                    });
                    // Wait for tab to load
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    tabs.push(newTab);
                } else {
                    await this.storeFailedTask(task, 'No Keka tab found');
                    return;
                }
            }

            // Execute the task on the Keka tab
            console.log(`Keka Pro: Sending message to tab ${tabs[0].id}`);
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
                action: task.action === 'in' ? 'clockIn' : 'clockOutStep1'
            }).catch(error => {
                console.error('Keka Pro: Error sending message to content script:', error);
                return { success: false, message: error.message };
            });

            if (response && response.success) {
                const taskType = task.isAutoClockOut ? 'Auto clock-out' : 'Scheduled task';
                console.log(`Keka Pro: ${taskType} ${task.action} executed successfully`);
                
                // If it's clock-out, execute step 2
                if (task.action === 'out') {
                    setTimeout(async () => {
                        try {
                            const step2Response = await chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'clockOutStep2'
                            });
                            
                            console.log('Keka Pro: Clock-out step 2 response:', step2Response);
                            
                            // Show notification for auto clock-out
                            if (task.isAutoClockOut) {
                                await chrome.notifications.create({
                                    type: 'basic',
                                    iconUrl: 'src/assets/icons/favicon.png',
                                    title: 'Keka Pro - Auto Clock-out',
                                    message: 'You have been automatically clocked out after 8 hours 1 minute.'
                                });
                                console.log('Keka Pro: Auto clock-out notification sent');
                            }
                        } catch (error) {
                            console.error('Keka Pro: Error in clock-out step 2:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('Keka Pro: Scheduled task failed:', response?.message);
                await this.storeFailedTask(task, response?.message || 'Unknown error');
            }

            // Clean up storage
            await chrome.storage.local.remove(alarm.name);
            console.log(`Keka Pro: Cleaned up storage for ${alarm.name}`);

        } catch (error) {
            console.error('Keka Pro: Error executing scheduled task:', error);
            console.error('Keka Pro: Error stack:', error.stack);
        }
    }

    /**
     * Schedule automatic clock-out after 8 hours and 1 minute
     */
    async scheduleAutoClockOut() {
        try {
            // Cancel any existing auto clock-out
            await this.cancelAutoClockOut();
            
            const clockInTime = new Date();
            const autoClockOutTime = new Date(clockInTime.getTime() + (8 * 60 + 1) * 60 * 1000); // 8 hours 1 minute
            
            const taskData = {
                id: 'auto-clockout',
                action: 'out',
                scheduledTime: autoClockOutTime,
                status: 'pending',
                createdAt: clockInTime,
                isAutoClockOut: true
            };
            
            const alarmName = 'keka-auto-clockout';
            const delayInMinutes = (autoClockOutTime.getTime() - Date.now()) / (1000 * 60);
            
            // Chrome alarms have a minimum delay of 1 minute, ensure we meet this requirement
            const actualDelay = Math.max(delayInMinutes, 1);
            
            console.log(`Keka Pro: Scheduling auto clock-out with delay: ${actualDelay} minutes (${delayInMinutes} calculated)`);
            
            // Create Chrome alarm
            await chrome.alarms.create(alarmName, {
                delayInMinutes: actualDelay
            });
            
            // Verify alarm was created
            const createdAlarm = await chrome.alarms.get(alarmName);
            if (!createdAlarm) {
                throw new Error('Failed to create Chrome alarm');
            }
            
            console.log(`Keka Pro: Chrome alarm created successfully. Scheduled for: ${new Date(createdAlarm.scheduledTime).toLocaleString()}`);
            
            // Store task data
            await chrome.storage.local.set({
                [alarmName]: taskData,
                clockInTime: clockInTime.toISOString(),
                autoClockOutScheduled: true,
                autoClockOutTime: autoClockOutTime.toISOString()
            });
            
            console.log(`Keka Pro: Auto clock-out scheduled for ${autoClockOutTime.toLocaleString()}`);
            return { success: true, message: 'Auto clock-out scheduled for 8 hours 1 minute', scheduledTime: autoClockOutTime };
            
        } catch (error) {
            console.error('Keka Pro: Error scheduling auto clock-out:', error);
            return { success: false, message: `Failed to schedule auto clock-out: ${error.message}` };
        }
    }
    
    /**
     * Cancel automatic clock-out
     */
    async cancelAutoClockOut() {
        try {
            const alarmName = 'keka-auto-clockout';
            
            // Clear the alarm
            const cleared = await chrome.alarms.clear(alarmName);
            console.log(`Keka Pro: Auto clock-out alarm cleared: ${cleared}`);
            
            // Remove from storage
            await chrome.storage.local.remove([alarmName, 'clockInTime', 'autoClockOutScheduled', 'autoClockOutTime']);
            
            console.log('Keka Pro: Auto clock-out cancelled and storage cleaned');
            return { success: true, message: 'Auto clock-out cancelled' };
            
        } catch (error) {
            console.error('Keka Pro: Error cancelling auto clock-out:', error);
            return { success: false, message: 'Failed to cancel auto clock-out' };
        }
    }

    /**
     * Store failed task for user notification
     * @param {Object} task - Failed task data
     * @param {string} reason - Failure reason
     */
    async storeFailedTask(task, reason) {
        try {
            const failedTasks = await chrome.storage.local.get('failedTasks') || { failedTasks: [] };
            failedTasks.failedTasks.push({
                ...task,
                failedAt: new Date().toISOString(),
                reason: reason
            });
            
            await chrome.storage.local.set({ failedTasks: failedTasks.failedTasks });
        } catch (error) {
            console.error('Keka Pro: Error storing failed task:', error);
        }
    }

    /**
     * Start clock-out reminder notifications every 2 minutes
     */
    async startClockOutReminders() {
        try {
            // Clear any existing reminders first
            await this.stopClockOutReminders();
            
            // Create recurring alarm for every 2 minutes
            await chrome.alarms.create('keka-clockout-reminder', {
                delayInMinutes: 2,
                periodInMinutes: 2
            });
            
            // Store reminder state
            await chrome.storage.local.set({
                clockOutRemindersActive: true,
                clockOutReminderStartTime: new Date().toISOString()
            });
            
            console.log('Keka Pro: Clock-out reminders started (every 2 minutes)');
            return { success: true, message: 'Clock-out reminders started' };
            
        } catch (error) {
            console.error('Keka Pro: Error starting clock-out reminders:', error);
            return { success: false, message: 'Failed to start clock-out reminders' };
        }
    }

    /**
     * Stop clock-out reminder notifications
     */
    async stopClockOutReminders() {
        try {
            // Clear the recurring alarm
            await chrome.alarms.clear('keka-clockout-reminder');
            
            // Remove reminder state from storage
            await chrome.storage.local.remove(['clockOutRemindersActive', 'clockOutReminderStartTime']);
            
            console.log('Keka Pro: Clock-out reminders stopped');
            return { success: true, message: 'Clock-out reminders stopped' };
            
        } catch (error) {
            console.error('Keka Pro: Error stopping clock-out reminders:', error);
            return { success: false, message: 'Failed to stop clock-out reminders' };
        }
    }

    /**
     * Show clock-out reminder notification
     */
    async showClockOutReminderNotification() {
        try {
            // Check if reminders are still active
            const reminderState = await chrome.storage.local.get('clockOutRemindersActive');
            if (!reminderState.clockOutRemindersActive) {
                return;
            }
            
            // Show notification
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Keka Pro - Clock In Reminder',
                message: 'You are clocked out! Please clock in if you forgot!',
                priority: 2
            });
            
            console.log('Keka Pro: Clock-out reminder notification shown');
            
        } catch (error) {
            console.error('Keka Pro: Error showing clock-out reminder notification:', error);
        }
    }

    /**
     * Debug method to check alarm status and storage
     */
    async debugAlarms() {
        try {
            const allAlarms = await chrome.alarms.getAll();
            const storage = await chrome.storage.local.get();
            
            const kekaAlarms = allAlarms.filter(alarm => 
                alarm.name.startsWith('keka-') || alarm.name.includes('auto-clockout')
            );
            
            const debugInfo = {
                currentTime: new Date().toLocaleString(),
                totalAlarms: allAlarms.length,
                kekaAlarms: kekaAlarms.map(alarm => ({
                    name: alarm.name,
                    scheduledTime: new Date(alarm.scheduledTime).toLocaleString(),
                    periodInMinutes: alarm.periodInMinutes || 'N/A'
                })),
                relevantStorage: Object.keys(storage).filter(key => 
                    key.includes('keka') || key.includes('clockIn') || key.includes('auto')
                ).reduce((obj, key) => {
                    obj[key] = storage[key];
                    return obj;
                }, {})
            };
            
            console.log('Keka Pro: Debug info:', debugInfo);
            return { success: true, debugInfo };
            
        } catch (error) {
            console.error('Keka Pro: Error in debug:', error);
            return { success: false, message: error.message };
        }
    }
}

// Initialize background service worker
new KekaProBackground();
