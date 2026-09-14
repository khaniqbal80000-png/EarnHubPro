// ==========================================
// EARNHUB PRO - SUPABASE AUTH & MODAL ENGINE
// ==========================================

const SUPABASE_URL = 'https://jppkjcaikmblcmijgklp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UcxfzJomZkwbOBz-BrZC4w_KgLoy5yl';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Modal UI Control Functions
function openAuthModal(mode) {
    document.getElementById('authModal').classList.remove('hidden');
    switchAuthMode(mode);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginFormContainer');
    const signupForm = document.getElementById('signupFormContainer');
    const forgotForm = document.getElementById('forgotFormContainer');
    
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabSignup = document.getElementById('tabSignupBtn');

    // Hide all
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotForm.classList.add('hidden');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        tabLogin.className = "font-bold text-base text-amber-800 pb-1 border-b-2 border-amber-700 transition";
        tabSignup.className = "font-bold text-base text-stone-400 pb-1 border-b-2 border-transparent transition";
    } else if (mode === 'signup') {
        signupForm.classList.remove('hidden');
        tabSignup.className = "font-bold text-base text-amber-800 pb-1 border-b-2 border-amber-700 transition";
        tabLogin.className = "font-bold text-base text-stone-400 pb-1 border-b-2 border-transparent transition";
    } else if (mode === 'forgot') {
        forgotForm.classList.remove('hidden');
    }
}

// Database-Connected Signup Handler
async function handleSignup() {
    const fullName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if (!fullName || !email || !password) {
        alert('❌ Please fill in all fields!');
        return;
    }

    const uniqueRefCode = 'EH-' + Math.floor(100000 + Math.random() * 900000);
    const referredBy = localStorage.getItem('referredBy') || 'direct';

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .insert([
                { 
                    full_name: fullName, 
                    email: email, 
                    password: password, 
                    wallet_balance: 0.00,
                    profile_completed: false,
                    referred_by: referredBy,
                    unique_ref_code: uniqueRefCode
                }
            ])
            .select();

        if (error) {
            if (error.message.includes('duplicate key')) {
                alert('❌ This email address is already registered! Please login instead.');
            } else {
                alert('❌ Signup Error: ' + error.message);
            }
            return;
        }

        localStorage.setItem('userName', fullName);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('walletBalance', '0.00');
        localStorage.setItem('profileCompleted', 'false');
        localStorage.setItem('userRefCode', uniqueRefCode);

        alert('🎉 Account created successfully! Please complete your profile to unlock your dashboard and ₹15 bonus.');
        window.location.href = 'profile.html';

    } catch (err) {
        console.error('Database connection exception:', err);
        alert('❌ Network error connecting to database.');
    }
}

// Database-Connected Login Handler
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert('❌ Please enter both email and password!');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error || !data) {
            alert('❌ Invalid email or password! Please check your credentials.');
            return;
        }

        localStorage.setItem('userName', data.full_name);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('walletBalance', data.wallet_balance.toFixed(2));
        localStorage.setItem('profileCompleted', data.profile_completed ? 'true' : 'false');
        localStorage.setItem('userRefCode', data.unique_ref_code);

        alert(`👋 Welcome back, ${data.full_name}!`);

        if (!data.profile_completed) {
            window.location.href = 'profile.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (err) {
        console.error('Login exception:', err);
        alert('❌ An error occurred during login.');
    }
}

// Password Reset Handler
async function handleResetPassword() {
    const email = document.getElementById('forgotEmail').value.trim();
    const oldPassword = document.getElementById('forgotOldPassword').value.trim();
    const newPassword = document.getElementById('forgotNewPassword').value.trim();

    if (!email || !oldPassword || !newPassword) {
        alert('❌ Please fill in all fields!');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', oldPassword)
            .single();

        if (error || !data) {
            alert('❌ Incorrect email or old password!');
            return;
        }

        const { error: updateError } = await supabaseClient
            .from('users')
            .update({ password: newPassword })
            .eq('email', email);

        if (updateError) {
            alert('❌ Failed to update password: ' + updateError.message);
            return;
        }

        alert('✅ Password updated successfully! Please login with your new password.');
        switchAuthMode('login');

    } catch (err) {
        console.error('Reset password exception:', err);
        alert('❌ An error occurred during password reset.');
    }
}