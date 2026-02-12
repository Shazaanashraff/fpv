// ============================================
// SHOPIFY PHONE FIELD DIAGNOSTIC SCRIPT
// ============================================
// Instructions:
// 1. Open your Shopify registration page
// 2. Fill out the form and verify phone with OTP
// 3. Open browser console (F12)
// 4. Paste this entire script and press Enter
// 5. Share the output with developer
// ============================================

(function() {
    console.log('\n%c╔═══════════════════════════════════════════════════╗', 'color: #2196F3; font-weight: bold;');
    console.log('%c║  SHOPIFY PHONE FIELD DIAGNOSTIC TOOL v1.0         ║', 'color: #2196F3; font-weight: bold;');
    console.log('%c╚═══════════════════════════════════════════════════╝\n', 'color: #2196F3; font-weight: bold;');

    const results = {
        timestamp: new Date().toISOString(),
        tests: [],
        errors: [],
        warnings: [],
        summary: ''
    };

    function test(name, fn) {
        try {
            const result = fn();
            results.tests.push({ name, passed: true, value: result });
            console.log(`%c✅ PASS%c ${name}`, 'color: #4CAF50; font-weight: bold;', 'color: inherit;', result);
            return true;
        } catch (error) {
            results.tests.push({ name, passed: false, error: error.message });
            results.errors.push(`${name}: ${error.message}`);
            console.log(`%c❌ FAIL%c ${name}`, 'color: #F44336; font-weight: bold;', 'color: inherit;', error.message);
            return false;
        }
    }

    function warn(message) {
        results.warnings.push(message);
        console.log(`%c⚠️ WARNING%c ${message}`, 'color: #FF9800; font-weight: bold;', 'color: inherit;');
    }

    console.log('%c\n📋 Running diagnostics...', 'color: #673AB7; font-weight: bold;');
    console.log('─'.repeat(50));

    // Test 1: Find form
    const form = document.querySelector('#custom-register-form');
    test('Form element exists', () => {
        if (!form) throw new Error('Form #custom-register-form not found');
        return 'Found';
    });

    // Test 2: Find visible phone input
    const phoneInput = document.querySelector('#RegisterFormPhone');
    test('Visible phone input exists', () => {
        if (!phoneInput) throw new Error('Input #RegisterFormPhone not found');
        return 'Found';
    });

    // Test 3: Find hidden phone input
    const phoneHiddenInput = document.querySelector('#RegisterFormPhoneHidden');
    test('Hidden phone input exists', () => {
        if (!phoneHiddenInput) throw new Error('Input #RegisterFormPhoneHidden not found');
        return 'Found';
    });

    // Test 4: Check name attribute
    test('Hidden input has correct name', () => {
        const name = phoneHiddenInput?.getAttribute('name');
        if (name !== 'customer[phone]') throw new Error(`Expected "customer[phone]", got "${name}"`);
        return name;
    });

    // Test 5: Check hidden input value
    const phoneValue = phoneHiddenInput?.value;
    test('Hidden input has phone value', () => {
        if (!phoneValue || phoneValue === '') throw new Error('Hidden input is empty');
        if (!phoneValue.startsWith('+')) warn('Phone value does not start with + (may not be E.164 format)');
        return phoneValue;
    });

    // Test 6: Check if hidden input is in form
    test('Hidden input is inside form', () => {
        if (!form?.contains(phoneHiddenInput)) throw new Error('Hidden input is not a child of the form');
        return 'Yes';
    });

    // Test 7: Check backup input
    const phoneBackupInput = document.querySelector('#phoneBackup');
    test('Backup phone input exists', () => {
        if (!phoneBackupInput) throw new Error('Input #phoneBackup not found');
        return `Found (value: ${phoneBackupInput.value || 'empty'})`;
    });

    // Test 8: Check FormData
    let formDataPhone = null;
    test('FormData contains phone', () => {
        if (!form) throw new Error('Form not found');
        const formData = new FormData(form);
        formDataPhone = formData.get('customer[phone]');
        if (!formDataPhone) throw new Error('customer[phone] not in FormData');
        return formDataPhone;
    });

    // Test 9: Verify phone format
    test('Phone is in E.164 format', () => {
        const e164Regex = /^\+[1-9]\d{6,14}$/;
        if (!e164Regex.test(phoneValue)) {
            throw new Error(`Phone "${phoneValue}" does not match E.164 format (+[country][number])`);
        }
        return 'Valid E.164';
    });

    // Test 10: Check for duplicate phone inputs
    test('No duplicate phone inputs', () => {
        const allPhoneInputs = Array.from(document.querySelectorAll('input[name="customer[phone]"]'));
        if (allPhoneInputs.length > 1) {
            warn(`Found ${allPhoneInputs.length} inputs with name "customer[phone]" - only one should exist!`);
        }
        return `${allPhoneInputs.length} input(s) found`;
    });

    // Summary
    console.log('\n' + '─'.repeat(50));
    console.log('%c📊 SUMMARY', 'color: #673AB7; font-weight: bold;');
    console.log('─'.repeat(50));

    const passed = results.tests.filter(t => t.passed).length;
    const failed = results.tests.filter(t => !t.passed).length;
    const total = results.tests.length;

    console.log(`Tests run: ${total}`);
    console.log(`%cPassed: ${passed}`, 'color: #4CAF50;');
    if (failed > 0) {
        console.log(`%cFailed: ${failed}`, 'color: #F44336;');
    }
    if (results.warnings.length > 0) {
        console.log(`%cWarnings: ${results.warnings.length}`, 'color: #FF9800;');
    }

    console.log('\n%c📦 FORM DATA PREVIEW', 'color: #673AB7; font-weight: bold;');
    console.log('─'.repeat(50));
    if (form) {
        const formData = new FormData(form);
        const entries = Array.from(formData.entries());
        
        entries.forEach(([key, value]) => {
            if (key.includes('phone')) {
                console.log(`%c${key}:%c ${value}`, 'color: #4CAF50; font-weight: bold;', 'color: inherit;');
            } else if (key.includes('password')) {
                console.log(`${key}: ********`);
            } else {
                console.log(`${key}: ${value}`);
            }
        });
    }

    // Final verdict
    console.log('\n' + '─'.repeat(50));
    console.log('%c🎯 VERDICT', 'color: #673AB7; font-weight: bold;');
    console.log('─'.repeat(50));

    if (failed === 0 && formDataPhone) {
        console.log('%c✅ ALL SYSTEMS GO!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        console.log('%cThe phone number SHOULD be submitted to Shopify correctly.', 'color: #4CAF50;');
        console.log(`\nPhone value ready to submit: %c${formDataPhone}`, 'color: #2196F3; font-weight: bold;');
        
        console.log('\n%c📝 What happens when you click "Create Account":', 'color: #673AB7;');
        console.log('  1. Browser sends POST request to Shopify');
        console.log(`  2. Includes field: customer[phone] = ${formDataPhone}`);
        console.log('  3. Shopify creates customer with this phone number');
        console.log('  4. Check Shopify Admin → Customers to verify');
        
        if (results.warnings.length > 0) {
            console.log('\n%c⚠️ Warnings to review:', 'color: #FF9800; font-weight: bold;');
            results.warnings.forEach(w => console.log(`  • ${w}`));
        }
    } else {
        console.log('%c❌ ISSUES DETECTED!', 'color: #F44336; font-weight: bold; font-size: 14px;');
        console.log('%cThe phone number will NOT be submitted correctly.', 'color: #F44336;');
        console.log('\n%c🔧 Errors found:', 'color: #F44336; font-weight: bold;');
        results.errors.forEach(e => console.log(`  • ${e}`));
        
        console.log('\n%c💡 Recommended actions:', 'color: #2196F3; font-weight: bold;');
        console.log('  1. Share this output with the developer');
        console.log('  2. Check if phone verification completed successfully');
        console.log('  3. Try clearing cache and reloading the page');
    }

    console.log('\n' + '═'.repeat(50));
    
    // Make results available globally
    window.phoneFieldDiagnostics = results;
    console.log('\n%cℹ️ Full results saved to: window.phoneFieldDiagnostics', 'color: #9E9E9E;');
    console.log('%cℹ️ Copy results: copy(window.phoneFieldDiagnostics)', 'color: #9E9E9E;');
    
    return results;
})();
