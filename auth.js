// Initialize Supabase Client for Auth
const SUPABASE_URL = "https://jppkjcaikmblcmijgklp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UcxfzJomZkwbOBz-BrZC4w_KgLoy5yl";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    
    const urlParams = new URLSearchParams(window.location.search);
    const referredBy = urlParams.get('ref') || localStorage.getItem('referredBy') || localStorage.getItem('signup_ref_by') || 'direct';

    console.log("Final Registered Referred By:", referredBy);

    try {
        // 1. Insert into users table
        const { error } = await supabaseClient
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
            ]);

        if (error) {
            if (error.message.includes('duplicate key')) {
                alert('❌ This email address is already registered! Please login instead.');
            } else {
                alert('❌ Signup Error: ' + error.message);
            }
            return;
        }

        // 2. Insert into referrals table using UPSERT to prevent duplicate/failed entries
        if (referredBy && referredBy !== 'direct') {
            const { error: refError } = await supabaseClient
                .from('referrals')
                .upsert([
                    {
                        referrer_code: referredBy,
                        referee_email: email,
                        step_signup: true,
                        step_profile: false,
                        step_survey: false,
                        commission_status: 'Pending'
                    }
                ], { onConflict: 'referee_email' }); // Agar referee pehle se hai toh crash nahi hoga, update ho jayega
            
            if (refError) {
                console.error("❌ Referrals Insert Error:", refError.message);
                alert("⚠️ Account created, but referral tracking failed: " + refError.message);
            } else {
                console.log("✅ Referral tracked successfully in database!");
            }
        }

        localStorage.setItem('userName', fullName);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('walletBalance', '0.00');
        localStorage.setItem('profileCompleted', 'false');
        localStorage.setItem('userRefCode', uniqueRefCode);

        alert('🎉 Account created successfully! Please complete your profile.');
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
        alert('❌ Please fill in both email and password!');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            alert('❌ User not found with this email!');
            return;
        }

        if (data.password !== password) {
            alert('❌ Incorrect password! Please try again.');
            return;
        }

        // Save session locally
        localStorage.setItem('userName', data.full_name);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('walletBalance', data.wallet_balance || '0.00');
        localStorage.setItem('profileCompleted', data.profile_completed ? 'true' : 'false');
        localStorage.setItem('userRefCode', data.unique_ref_code || '');

        alert('🎉 Login successful! Welcome back.');
        window.location.href = 'dashboard.html';

    } catch (err) {
        console.error('Login error:', err);
        alert('❌ Network error during login.');
    }
}