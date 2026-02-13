/**
 * Test Script for Early Clock-Out Reminder Feature
 * Run this in the browser console on Keka attendance page
 */

// Test 1: Simulate early clock-out with 4h 42m effective time
async function testEarlyClockOut() {
    console.log('=== TEST 1: Early Clock-Out (4h 42m effective) ===');
    
    const attendanceData = {
        effectiveMinutes: 282, // 4h 42m
        grossMinutes: 358      // 5h 58m
    };
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'earlyClockOut',
            attendanceData: attendanceData
        });
        
        console.log('Response:', response);
        
        if (response.success) {
            console.log('✓ Test 1 PASSED: Early clock-out reminders started');
            console.log(`  Remaining: ${response.remainingMinutes} minutes`);
        } else {
            console.error('✗ Test 1 FAILED:', response.message);
        }
    } catch (error) {
        console.error('✗ Test 1 ERROR:', error);
    }
}

// Test 2: Simulate clock-out after 8 hours (should not start reminders)
async function testCompletedClockOut() {
    console.log('\n=== TEST 2: Clock-Out After 8 Hours ===');
    
    const attendanceData = {
        effectiveMinutes: 485, // 8h 5m
        grossMinutes: 550      // 9h 10m
    };
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'earlyClockOut',
            attendanceData: attendanceData
        });
        
        console.log('Response:', response);
        
        if (response.success && response.message.includes('8 hours completed')) {
            console.log('✓ Test 2 PASSED: No reminders started (8 hours completed)');
        } else {
            console.error('✗ Test 2 FAILED: Should not start reminders');
        }
    } catch (error) {
        console.error('✗ Test 2 ERROR:', error);
    }
}

// Test 3: Check if alarms are created
async function checkAlarms() {
    console.log('\n=== TEST 3: Check Alarms ===');
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'debugAlarms'
        });
        
        console.log('All Keka Alarms:', response.debugInfo.kekaAlarms);
        
        const hasEarlyClockOutAlarm = response.debugInfo.kekaAlarms.some(
            alarm => alarm.name === 'keka-early-clockout-reminder'
        );
        
        if (hasEarlyClockOutAlarm) {
            console.log('✓ Test 3 PASSED: Early clock-out alarm exists');
            const alarm = response.debugInfo.kekaAlarms.find(
                a => a.name === 'keka-early-clockout-reminder'
            );
            console.log(`  Scheduled for: ${alarm.scheduledTime}`);
            console.log(`  Period: ${alarm.periodInMinutes} minutes`);
        } else {
            console.log('ℹ Test 3 INFO: No early clock-out alarm (may have been stopped)');
        }
        
        console.log('\nStorage:', response.debugInfo.relevantStorage);
    } catch (error) {
        console.error('✗ Test 3 ERROR:', error);
    }
}

// Test 4: Test with edge case - 0 effective minutes
async function testZeroEffectiveTime() {
    console.log('\n=== TEST 4: Zero Effective Time ===');
    
    const attendanceData = {
        effectiveMinutes: 0,
        grossMinutes: 0
    };
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'earlyClockOut',
            attendanceData: attendanceData
        });
        
        console.log('Response:', response);
        
        if (response.success && response.remainingMinutes === 480) {
            console.log('✓ Test 4 PASSED: Handles zero effective time correctly');
            console.log(`  Remaining: ${response.remainingMinutes} minutes (8 hours)`);
        } else {
            console.error('✗ Test 4 FAILED');
        }
    } catch (error) {
        console.error('✗ Test 4 ERROR:', error);
    }
}

// Test 5: Test with edge case - exactly 8 hours
async function testExactly8Hours() {
    console.log('\n=== TEST 5: Exactly 8 Hours ===');
    
    const attendanceData = {
        effectiveMinutes: 480, // Exactly 8 hours
        grossMinutes: 540
    };
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'earlyClockOut',
            attendanceData: attendanceData
        });
        
        console.log('Response:', response);
        
        if (response.success && response.message.includes('8 hours completed')) {
            console.log('✓ Test 5 PASSED: Exactly 8 hours handled correctly');
        } else {
            console.error('✗ Test 5 FAILED');
        }
    } catch (error) {
        console.error('✗ Test 5 ERROR:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  Early Clock-Out Reminder Feature Test Suite  ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    await testEarlyClockOut();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCompletedClockOut();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testZeroEffectiveTime();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testExactly8Hours();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await checkAlarms();
    
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              Test Suite Complete               ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\nTo manually stop reminders, run: stopReminders()');
}

// Helper function to stop reminders
async function stopReminders() {
    console.log('Stopping early clock-out reminders...');
    const cleared = await chrome.alarms.clear('keka-early-clockout-reminder');
    console.log('Alarm cleared:', cleared);
    
    await chrome.storage.local.remove([
        'earlyClockOutRemindersActive',
        'earlyClockOutStartTime',
        'earlyClockOutEffectiveMinutes',
        'earlyClockOutGrossMinutes',
        'earlyClockOutRemainingMinutes'
    ]);
    console.log('Storage cleaned');
}

// Export functions for manual testing
window.testEarlyClockOut = testEarlyClockOut;
window.testCompletedClockOut = testCompletedClockOut;
window.checkAlarms = checkAlarms;
window.runAllTests = runAllTests;
window.stopReminders = stopReminders;

console.log('Test functions loaded! Run: runAllTests()');
