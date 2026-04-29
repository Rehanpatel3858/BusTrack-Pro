/**
 * CRITICAL FIXES - ALL FUNCTIONS
 * This file loads BEFORE script.js to ensure all functions are defined
 * despite merge conflicts in script.js
 */

// ============================================
// 1. setTempRole - Role Selection
// ============================================
function setTempRole(role) {
    console.log("Role selected:", role);
    localStorage.setItem("temp_role", role);
    
    if (role === "driver") {
        window.location.href = "driver.html";
    } else if (role === "admin") {
        window.location.href = "admin.html";
    } else {
        // Parent stays on index.html
        console.log("Parent role selected - showing login form");
        const roleSelection = document.getElementById('role-selection-v3');
        const authForm = document.getElementById('auth-form-v3');
        if (roleSelection) roleSelection.style.display = 'none';
        if (authForm) authForm.style.display = 'block';
    }
}

// ============================================
// 2. processLogin - Login Handler (CRITICAL!)
// ============================================
function processLogin() {
    console.log("processLogin called");
    
    const role = localStorage.getItem("temp_role");
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    
    console.log("Login attempt:", { role, username });
    
    if (!username || !password) {
        alert("Please enter both username and password");
        return;
    }
    
    // Hardcoded users
    const USERS = {
        'admin': { password: 'schooladmin789', role: 'admin', busId: null },
        'student01': { password: 'pass01', role: 'parent', busId: 'bus01' },
        'student02': { password: 'pass02', role: 'parent', busId: 'bus02' },
        'student03': { password: 'pass03', role: 'parent', busId: 'bus03' },
        'student04': { password: 'pass04', role: 'parent', busId: 'bus04' },
        'student05': { password: 'pass05', role: 'parent', busId: 'bus05' },
        'stu1703': { password: '1703', role: 'parent', busId: null },
        'bus01': { password: 'drive123', role: 'driver', busId: 'bus01' },
        'bus02': { password: 'drive123', role: 'driver', busId: 'bus02' },
        'bus03': { password: 'drive123', role: 'driver', busId: 'bus03' },
        'bus04': { password: 'drive123', role: 'driver', busId: 'bus04' },
        'bus05': { password: 'drive123', role: 'driver', busId: 'bus05' },
        'bus06': { password: 'drive123', role: 'driver', busId: 'bus06' }
    };
    
    const user = USERS[username];
    
    if (user && user.password === password && user.role === role) {
        console.log("Login successful:", user.role);
        
        // Store session
        if (role !== 'driver') {
            localStorage.setItem("saved_user_role", role);
        }
        sessionStorage.setItem("active_role", role);
        sessionStorage.setItem("active_user", username);
        localStorage.setItem("active_user", username);
        
        if (user.busId) {
            sessionStorage.setItem("active_bus", user.busId);
        }
        
        sessionStorage.setItem("is_logged_in", "true");
        
        // Redirect based on role
        if (role === 'driver') {
            window.location.href = "driver.html";
        } else if (role === 'admin') {
            window.location.href = "admin.html";
        } else {
            // Parent - load dashboard on same page
            alert("Login successful! Loading dashboard...");
            // The main script.js will handle dashboard loading
            if (typeof launchDashboard === 'function') {
                launchDashboard();
            }
        }
    } else {
        alert("Access Denied: Invalid Credentials");
    }
}

// ============================================
// 3. resetLogin - Go Back to Role Selection
// ============================================
function resetLogin() {
    console.log("resetLogin called");
    const roleSelection = document.getElementById('role-selection-v3');
    const authForm = document.getElementById('auth-form-v3');
    if (roleSelection) roleSelection.style.display = 'block';
    if (authForm) authForm.style.display = 'none';
}

// ============================================
// 4. logout - Clear Session
// ============================================
function logout() {
    localStorage.removeItem('saved_user_role');
    localStorage.removeItem('temp_role');
    sessionStorage.clear();
    location.reload();
}

// ============================================
// 5. switchRole - Switch Between Roles
// ============================================
function switchRole() {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    sessionStorage.clear();
}

// ============================================
// 6. showToast - Notification
// ============================================
function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerText = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

// ============================================
// EXPORT ALL TO GLOBAL SCOPE (CRITICAL!)
// ============================================
window.setTempRole = setTempRole;
window.processLogin = processLogin;
window.resetLogin = resetLogin;
window.logout = logout;
window.switchRole = switchRole;
window.showToast = showToast;

console.log('✅ All critical functions loaded and exported');
console.log('✅ processLogin is:', typeof window.processLogin);
console.log('✅ setTempRole is:', typeof window.setTempRole);
