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
    const referredBy = localStorage.getItem('referredBy') || localStorage.getItem('signup_ref_by') || 'direct';

    try {
        // 1. Insert into users table
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

        // 2. Insert into referrals table if user came via someone's referral link
        if (referredBy && referredBy !== 'direct') {
            await supabaseClient
                .from('referrals')
                .insert([
                    {
                        referrer_code: referredBy,
                        referee_email: email,
                        step_signup: true,
                        step_profile: false,
                        step_survey: false,
                        commission_status: 'Pending'
                    }
                ]);
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