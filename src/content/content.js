/**
 * Keka Attendance Extension - Simple & Clean
 * Enhanced with real clock-in/clock-out functionality
 */

// Simple wait for element function
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

// Parse time like "1h 20m" to minutes
function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    // Clean the string and handle various formats
    const cleanStr = timeStr.trim().toLowerCase();
    
    // Handle formats like "0h 7m", "1h 20m", "45m", "2h", etc.
    const hours = (cleanStr.match(/(\d+)h/) || [0, 0])[1];
    const minutes = (cleanStr.match(/(\d+)m/) || [0, 0])[1];
    
    const parsedHours = parseInt(hours) || 0;
    const parsedMinutes = parseInt(minutes) || 0;
    
    const totalMinutes = parsedHours * 60 + parsedMinutes;
    
    // Return 0 if parsing resulted in NaN or negative values
    return isNaN(totalMinutes) || totalMinutes < 0 ? 0 : totalMinutes;
}

// Convert minutes to "Xh Ym" format
function formatTime(minutes) {
    // Handle invalid input
    if (isNaN(minutes) || minutes < 0) return '0m';
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Add minutes to current time
function addToCurrentTime(minutes) {
    // Handle invalid input
    if (isNaN(minutes) || minutes < 0) {
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    
    const future = new Date(Date.now() + minutes * 60000);
    return future.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Calculate clock-in time by subtracting gross time from current time
function calculateClockInTime(grossMinutes) {
    // Handle invalid input
    if (isNaN(grossMinutes) || grossMinutes < 0) {
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    
    const now = new Date();
    const clockInTime = new Date(now.getTime() - (grossMinutes * 60000));
    return clockInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Calculate when 8 hours will be completed based on clock-in time and break time
function calculate8HourCompletion(grossMinutes, effectiveMinutes) {
    // Handle invalid input
    if (isNaN(grossMinutes) || isNaN(effectiveMinutes) || grossMinutes < 0 || effectiveMinutes < 0) {
        return 'Invalid Data';
    }
    
    const now = new Date();
    const clockInTime = new Date(now.getTime() - (grossMinutes * 60000));
    
    // Calculate remaining effective minutes needed to reach 8 hours (480 minutes)
    const remainingEffectiveMinutes = 480 - effectiveMinutes;
    
    if (remainingEffectiveMinutes <= 0) {
        return 'Completed';
    }
    
    // Calculate average break rate (break minutes per work minute)
    const breakMinutes = grossMinutes - effectiveMinutes;
    
    // Prevent division by zero
    if (effectiveMinutes === 0) {
        // If no effective time yet, assume minimal break rate
        const estimatedAdditionalGrossMinutes = remainingEffectiveMinutes * 1.1; // 10% buffer for breaks
        const completionTime = new Date(now.getTime() + (estimatedAdditionalGrossMinutes * 60000));
        return completionTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    
    const breakRate = breakMinutes / effectiveMinutes;
    
    // Ensure break rate is reasonable (prevent extreme values)
    const reasonableBreakRate = Math.max(0, Math.min(breakRate, 2)); // Cap at 200% break rate
    
    // Estimate additional gross time needed (including future breaks)
    const estimatedAdditionalGrossMinutes = remainingEffectiveMinutes * (1 + reasonableBreakRate);
    
    // Add to current time
    const completionTime = new Date(now.getTime() + (estimatedAdditionalGrossMinutes * 60000));
    return completionTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Get attendance data from page with enhanced detection
function getAttendanceData() {
    console.log('Keka Pro: Starting data extraction...');
    
    // First, try to find the exact text patterns from the page
    const allElements = document.querySelectorAll('*');
    let effective = '', gross = '';
    let foundElements = [];
    
    // Log all text content for debugging
    const pageText = document.body.textContent;
    console.log('Keka Pro: Page contains "Effective":', pageText.includes('Effective'));
    console.log('Keka Pro: Page contains "Gross":', pageText.includes('Gross'));
    
    // Search through all elements for exact matches
    for (const element of allElements) {
        const text = element.textContent || '';
        
        // Look for "Effective: 0h 31m" pattern
        if (text.includes('Effective:')) {
            const effectiveMatch = text.match(/Effective:\s*(\d+h\s*\d+m|\d+m|\d+h)/i);
            if (effectiveMatch && effectiveMatch[1]) {
                effective = effectiveMatch[1].trim();
                foundElements.push(`Effective found in: ${element.tagName} - "${text.substring(0, 50)}..."`);
                console.log('Keka Pro: Found Effective:', effective, 'in element:', element.tagName);
            }
        }
        
        // Look for "Gross: 0h 31m" pattern  
        if (text.includes('Gross:')) {
            const grossMatch = text.match(/Gross:\s*(\d+h\s*\d+m|\d+m|\d+h)/i);
            if (grossMatch && grossMatch[1]) {
                gross = grossMatch[1].trim();
                foundElements.push(`Gross found in: ${element.tagName} - "${text.substring(0, 50)}..."`);
                console.log('Keka Pro: Found Gross:', gross, 'in element:', element.tagName);
            }
        }
    }
    
    // Also try the old method as fallback
    if (!effective || !gross) {
        console.log('Keka Pro: Trying fallback method...');
        const paragraphs = document.querySelectorAll('p, div, span');
        for (const p of paragraphs) {
            const text = p.textContent;
            if (text.includes('Effective:')) {
                const match = text.match(/Effective:\s*(.+)/i);
                if (match) effective = match[1].trim();
            }
            if (text.includes('Gross:')) {
                const match = text.match(/Gross:\s*(.+)/i);
                if (match) gross = match[1].trim();
            }
        }
    }
    
    // Log what we found for debugging
    console.log('Keka Pro: Final search results - Effective:', effective, 'Gross:', gross);
    console.log('Keka Pro: Found in elements:', foundElements);
    
    // Check if we have meaningful data
    if (!effective || !gross) {
        console.log('Keka Pro: Missing attendance data, continuing search...');
        return null;
    }
    
    // Parse and validate the time values
    const effectiveMinutes = parseTime(effective);
    const grossMinutes = parseTime(gross);
    
    console.log('Keka Pro: Parsed minutes - Effective:', effectiveMinutes, 'Gross:', grossMinutes);
    
    // Additional validation to ensure we have valid numbers
    const validEffectiveMinutes = isNaN(effectiveMinutes) ? 0 : effectiveMinutes;
    const validGrossMinutes = isNaN(grossMinutes) ? 0 : grossMinutes;
    
    // Accept any valid data, even if small (like 31 minutes)
    if (validEffectiveMinutes === 0 && validGrossMinutes === 0) {
        console.log('Keka Pro: Parsed data is zero, waiting for real data');
        return null;
    }
    
    console.log('Keka Pro: Valid attendance data confirmed - Effective:', validEffectiveMinutes, 'min, Gross:', validGrossMinutes, 'min');
    
    return {
        effective: formatTime(validEffectiveMinutes),
        gross: formatTime(validGrossMinutes),
        effectiveMinutes: validEffectiveMinutes,
        grossMinutes: validGrossMinutes
    };
}

// Add attendance info to page with retry mechanism
function addAttendanceInfo(retryCount = 0) {
    const maxRetries = 20;
    
    // Don't add if already exists
    if (document.querySelector('.keka-pro')) return true;
    
    const data = getAttendanceData();
    
    // If data is not available and we haven't exceeded retries, try again
    if (!data && retryCount < maxRetries) {
        console.log(`Keka Pro: Retry ${retryCount + 1}/${maxRetries} - Waiting for data...`);
        // Use exponential backoff: start with 3 seconds, increase gradually
        const delay = Math.min(3000 + (retryCount * 500), 8000);
        setTimeout(() => addAttendanceInfo(retryCount + 1), delay);
        return false;
    }
    
    // If still no data after all retries, give up
    if (!data) {
        console.log('Keka Pro: Could not find attendance data after all retries');
        return false;
    }
    
    // Calculate info
    const remaining = 480 - data.effectiveMinutes; // 8 hours = 480 minutes
    const completionTime = calculate8HourCompletion(data.grossMinutes, data.effectiveMinutes);
    const breakTime = formatTime(data.grossMinutes - data.effectiveMinutes);
    const clockInTime = calculateClockInTime(data.grossMinutes);
    
    // Create info box
    const infoBox = document.createElement('div');
    infoBox.className = 'keka-pro';
    infoBox.style.cssText = `
        margin: 10px 0;
        padding: 10px;
        background: #f0f8ff;
        border-left: 4px solid #007bff;
        border-radius: 4px;
        font-size: 13px;
    `;
    
    infoBox.innerHTML = `
        <p style="margin: 3px 0; color: ${remaining > 0 ? '#d63384' : '#198754'};"><strong>8 Hours At:</strong> ${completionTime}</p>
        <p style="margin: 3px 0; color: #6c757d;"><strong>Break Time:</strong> ${breakTime}</p>
        <p style="margin: 3px 0; color: #0d6efd;"><strong>Clock-in:</strong> ${clockInTime}</p>
    `;
    
    // Find where to insert (after Gross line)
    const grossElement = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('Gross:'));
    if (grossElement) {
        grossElement.parentNode.insertBefore(infoBox, grossElement.nextSibling);
        console.log('Keka Pro: Successfully added attendance info');
        return true;
    }
    
    return false;
}

// Enhanced initialization with multiple timing strategies
function init() {
    if (!location.href.includes('#/me/attendance/logs')) return;
    
    console.log('Keka Pro: Initializing on attendance page');
    
    // Clear any existing extension elements first
    const existing = document.querySelector('.keka-pro');
    if (existing) {
        existing.remove();
        console.log('Keka Pro: Removed existing extension element');
    }
    
    // Strategy 1: Wait for page to be more stable before starting
    setTimeout(() => addAttendanceInfo(), 2000);
    
    // Strategy 2: Medium delay for AJAX content
    setTimeout(() => addAttendanceInfo(), 4000);
    
    // Strategy 3: Longer delay for slow loading
    setTimeout(() => addAttendanceInfo(), 6000);
    
    // Strategy 4: Extended delay for very slow connections
    setTimeout(() => addAttendanceInfo(), 10000);
    
    // Strategy 5: Continuous monitoring for data appearance
    waitForAttendanceData();
}

// Wait specifically for attendance data elements with better async handling
function waitForAttendanceData() {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts over 60 seconds
    
    const checkForData = () => {
        attempts++;
        console.log(`Keka Pro: Checking for data (attempt ${attempts}/${maxAttempts})`);
        
        const data = getAttendanceData();
        
        if (data && !document.querySelector('.keka-pro')) {
            console.log('Keka Pro: Found valid attendance data, adding info');
            addAttendanceInfo();
            return true;
        }
        
        if (attempts >= maxAttempts) {
            console.log('Keka Pro: Max attempts reached, stopping data checks');
            return false;
        }
        
        // Continue checking
        setTimeout(checkForData, 2000);
        return false;
    };
    
    // Start checking
    checkForData();
}

// Enhanced page change detection with async data loading
function observePageChanges() {
    let lastUrl = location.href;
    let dataCheckTimeout = null;
    
    const observer = new MutationObserver((mutations) => {
        // Check for URL changes
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('Keka Pro: URL changed to:', lastUrl);
            
            // Clear existing extension elements
            const existing = document.querySelector('.keka-pro');
            if (existing) existing.remove();
            
            // Reinitialize if on attendance page
            if (location.href.includes('#/me/attendance/logs')) {
                setTimeout(init, 1000);
            }
            return;
        }
        
        // Check for any text content changes that might contain attendance data
        const hasAttendanceContent = mutations.some(mutation => {
            return Array.from(mutation.addedNodes).some(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const text = node.textContent || '';
                    return text.includes('Effective') || text.includes('Gross') || 
                           text.includes('TOTAL HOURS') || text.includes('0h') || 
                           text.includes('31m') || text.match(/\d+h\s*\d+m/);
                }
                return false;
            });
        });
        
        // Also check for text content changes in existing nodes
        const hasTextChanges = mutations.some(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const target = mutation.target;
                if (target && target.textContent) {
                    const text = target.textContent;
                    return text.includes('Effective') || text.includes('Gross');
                }
            }
            return false;
        });
        
        if ((hasAttendanceContent || hasTextChanges) && location.href.includes('#/me/attendance/logs')) {
            console.log('Keka Pro: Detected attendance content changes');
            
            // Clear any existing timeout
            if (dataCheckTimeout) {
                clearTimeout(dataCheckTimeout);
            }
            
            // Try immediately and then with delays
            if (!document.querySelector('.keka-pro')) {
                console.log('Keka Pro: Immediate data extraction attempt');
                addAttendanceInfo();
                
                // Also try after a short delay
                dataCheckTimeout = setTimeout(() => {
                    if (!document.querySelector('.keka-pro')) {
                        console.log('Keka Pro: Delayed data extraction attempt');
                        addAttendanceInfo();
                    }
                }, 1000);
            }
        }
    });
    
    observer.observe(document, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false
    });
    
    return observer;
}

// Initialize with multiple triggers
function startExtension() {
    // DOM ready state check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also try after window load
    if (document.readyState !== 'complete') {
        window.addEventListener('load', () => setTimeout(init, 1000));
    }
    
    // Start observing page changes for SPA navigation and content updates
    observePageChanges();
    
    // Start monitoring for clock-in status
    startClockInMonitoring();
}

// Clock-in status monitoring
function startClockInMonitoring() {
    console.log('Keka Pro: Starting clock-in status monitoring');
    
    // Check immediately
    setTimeout(checkClockInStatus, 3000);
    
    // Then check periodically
    setInterval(checkClockInStatus, 30000); // Every 30 seconds
}

// Check if user is currently clocked in
function checkClockInStatus() {
    if (!location.href.includes('#/me/attendance/logs')) return;
    
    try {
        // Look for clock-out button or "Web Clock-out" text
        const clockOutButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.toLowerCase().includes('clock-out') || 
            btn.textContent.toLowerCase().includes('clock out')
        );
        
        // Also check for "Web Clock-out" text in the page
        const pageText = document.body.textContent;
        const hasClockOutText = pageText.includes('Web Clock-out') || pageText.includes('Clock-out');
        
        // Look for current time display (like "09:52:13 AM")
        const timePattern = /\d{2}:\d{2}:\d{2}\s*(AM|PM)/;
        const hasCurrentTime = timePattern.test(pageText);
        
        const isCurrentlyClockedIn = clockOutButton || (hasClockOutText && hasCurrentTime);
        
        console.log('Keka Pro: Clock-in status check:', {
            hasClockOutButton: !!clockOutButton,
            hasClockOutText,
            hasCurrentTime,
            isCurrentlyClockedIn
        });
        
        if (isCurrentlyClockedIn) {
            handleDetectedClockIn();
        }
        
    } catch (error) {
        console.error('Keka Pro: Error checking clock-in status:', error);
    }
}

// Handle when we detect user is clocked in
async function handleDetectedClockIn() {
    try {
        // Check if auto clock-out is already scheduled
        const response = await chrome.runtime.sendMessage({
            action: 'debugAlarms'
        });
        
        if (response && response.success) {
            const hasAutoClockOut = response.debugInfo.kekaAlarms.some(alarm => 
                alarm.name === 'keka-auto-clockout'
            );
            
            if (hasAutoClockOut) {
                console.log('Keka Pro: Auto clock-out already scheduled');
                return;
            }
        }
        
        console.log('Keka Pro: Detected user is clocked in, scheduling auto clock-out');
        
        // Schedule auto clock-out
        const scheduleResponse = await chrome.runtime.sendMessage({
            action: 'clockInSuccess'
        });
        
        if (scheduleResponse && scheduleResponse.success) {
            console.log('Keka Pro: Auto clock-out scheduled successfully');
            
            // Show a subtle notification
            showNotification('Auto clock-out scheduled for 8 hours 1 minute from now', 'success');
        } else {
            console.error('Keka Pro: Failed to schedule auto clock-out:', scheduleResponse?.message);
        }
        
    } catch (error) {
        console.error('Keka Pro: Error handling detected clock-in:', error);
    }
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existing = document.querySelector('.keka-pro-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'keka-pro-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#bee5eb'};
        border-radius: 6px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Start the extension
startExtension();

// Handle SPA navigation with improved timing
let currentUrl = location.href;
const navigationObserver = new MutationObserver(() => {
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        console.log('Keka Pro: URL changed, reinitializing...');
        setTimeout(init, 1000);
        
        // Restart monitoring on page change
        if (location.href.includes('#/me/attendance/logs')) {
            setTimeout(checkClockInStatus, 2000);
        }
    }
});

navigationObserver.observe(document, {
    childList: true,
    subtree: true
});

// Periodic fallback check every 10 seconds
setInterval(() => {
    if (location.href.includes('#/me/attendance/logs') && !document.querySelector('.keka-pro')) {
        console.log('Keka Pro: Periodic check - attempting to add info');
        addAttendanceInfo();
    }
}, 10000);

// ===== CLOCK-IN/CLOCK-OUT FUNCTIONALITY =====

/**
 * Find and click Web Clock-In button
 */
function performClockIn() {
    console.log('Keka Pro: Attempting to clock in...');
    
    // Look for Web Clock-In link based on provided HTML structure
    const clockInSelectors = [
        'a[class*="text-link"]:has(span:contains("Web Clock-In"))',
        'a:contains("Web Clock-In")',
        'employee-attendance-request-actions a:contains("Web Clock-In")',
        '.text-link:contains("Web Clock-In")',
        'a .ki-globe + text()[contains(., "Web Clock-In")]'
    ];
    
    for (const selector of clockInSelectors) {
        try {
            // Use a more robust text-based search
            const elements = document.querySelectorAll('a, button');
            for (const element of elements) {
                if (element.textContent.includes('Web Clock-In')) {
                    console.log('Keka Pro: Found Web Clock-In button, clicking...');
                    element.click();
                    return { success: true, message: 'Clock-in initiated successfully' };
                }
            }
        } catch (error) {
            console.log(`Keka Pro: Selector failed: ${selector}`, error);
        }
    }
    
    return { success: false, message: 'Web Clock-In button not found' };
}

/**
 * Find and click Web Clock-out button (first step)
 */
function performClockOutStep1() {
    console.log('Keka Pro: Attempting first clock-out step...');
    
    // Look for Web Clock-out button
    const elements = document.querySelectorAll('button');
    for (const element of elements) {
        if (element.textContent.includes('Web Clock-out')) {
            console.log('Keka Pro: Found Web Clock-out button, clicking...');
            element.click();
            return { success: true, message: 'First clock-out step completed' };
        }
    }
    
    return { success: false, message: 'Web Clock-out button not found' };
}

/**
 * Find and click final Clock-out button (second step)
 */
function performClockOutStep2() {
    console.log('Keka Pro: Attempting final clock-out step...');
    
    // Wait a moment for the confirmation buttons to appear
    setTimeout(() => {
        const elements = document.querySelectorAll('button');
        for (const element of elements) {
            // Look for the final "Clock-out" button (not "Web Clock-out")
            if (element.textContent.trim() === 'Clock-out' && !element.textContent.includes('Web')) {
                console.log('Keka Pro: Found final Clock-out button, clicking...');
                element.click();
                return { success: true, message: 'Clock-out completed successfully' };
            }
        }
        return { success: false, message: 'Final Clock-out button not found' };
    }, 500);
    
    return { success: true, message: 'Attempting final clock-out step...' };
}

/**
 * Get current attendance status from the page
 */
function getAttendanceStatus() {
    // Check if clocked in by looking for clock-out buttons
    const hasClockOut = Array.from(document.querySelectorAll('button')).some(btn => 
        btn.textContent.includes('Web Clock-out')
    );
    
    // Check if clocked out by looking for clock-in buttons
    const hasClockIn = Array.from(document.querySelectorAll('a, button')).some(btn => 
        btn.textContent.includes('Web Clock-In')
    );
    
    if (hasClockOut) {
        return { status: 'clocked_in', message: 'Currently clocked in' };
    } else if (hasClockIn) {
        return { status: 'clocked_out', message: 'Currently clocked out' };
    } else {
        return { status: 'unknown', message: 'Status unclear' };
    }
}

// ===== MESSAGE PASSING =====

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Keka Pro: Received message:', request);
    
    switch (request.action) {
        case 'clockIn':
            const clockInResult = performClockIn();
            sendResponse(clockInResult);
            break;
            
        case 'clockOutStep1':
            const clockOutStep1Result = performClockOutStep1();
            sendResponse(clockOutStep1Result);
            break;
            
        case 'clockOutStep2':
            const clockOutStep2Result = performClockOutStep2();
            sendResponse(clockOutStep2Result);
            break;
            
        case 'getStatus':
            const statusResult = getAttendanceStatus();
            sendResponse(statusResult);
            break;
            
        case 'getAttendanceData':
            const attendanceData = getAttendanceData();
            sendResponse({ success: true, data: attendanceData });
            break;
            
        default:
            sendResponse({ success: false, message: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
});
