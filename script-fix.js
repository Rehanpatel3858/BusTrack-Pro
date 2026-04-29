/**
 * CRITICAL FIX FOR setTempRole ERROR
 * 
 * This file contains ONLY the setTempRole function and global exports
 * to fix the "Uncaught ReferenceError: setTempRole is not defined" error.
 * 
 * INSTRUCTIONS:
 * 1. This is a temporary fix file
 * 2. Add this BEFORE your main script.js in index.html:
 *    <script src="script-fix.js"></script>
 *    <script src="script.js" defer></script>
 * 
 * OR manually fix script.js by:
 * 1. Removing all merge conflict markers (<<<<<<< , =======, >>>>>>>)
 * 2. Ensuring setTempRole is at global scope (not inside any function)
 * 3. Adding window.setTempRole = setTempRole; at the end
 */

// ============================================
// setTempRole Function - GLOBAL SCOPE
// ============================================
function setTempRole(role) {
    console.log("Role selected:", role);
    localStorage.setItem("tempRole", role);
    
    // Redirect based on role
    if (role === "driver") {
        window.location.href = "driver.html";
    } else if (role === "admin") {
        window.location.href = "admin.html";
    } else {
        // Parent uses the main index.html dashboard
        // Just hide login and show the role selection form
        console.log("Parent role selected - using main dashboard");
        // Don't redirect, just show the auth form
        const roleSelection = document.getElementById('role-selection-v3');
        const authForm = document.getElementById('auth-form-v3');
        if (roleSelection) roleSelection.style.display = 'none';
        if (authForm) authForm.style.display = 'block';
    }
}

// ============================================
// Make it globally accessible (CRITICAL!)
// ============================================
window.setTempRole = setTempRole;

// Verify it's working
console.log('✅ setTempRole function loaded');
console.log('✅ Type:', typeof window.setTempRole);
console.log('✅ Role buttons should now work!');
