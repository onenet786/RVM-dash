import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverIndexPath = path.join(__dirname, '..', 'server', 'index.js');

let content = fs.readFileSync(serverIndexPath, 'utf8');

// 1. Add nodemailer import if not present
if (!content.includes("import nodemailer from 'nodemailer';")) {
  content = content.replace(
    "import bcrypt from 'bcryptjs';",
    "import bcrypt from 'bcryptjs';\nimport nodemailer from 'nodemailer';"
  );
}

// 2. Define the new Google 2FA block
const newGoogle2FABlock = `// ==========================================
// GOOGLE OAUTH & TWO-STEP VERIFICATION VIA GMAIL
// ==========================================

const pendingGoogle2FA = new Map();

function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function sendGoogle2FAEmail(toEmail, code, userName = 'Eco Citizen') {
  console.log(\`[Google 2FA] Verification code generated for \${toEmail}: \${code}\`);
  const transporter = getMailTransporter();
  if (!transporter) {
    console.warn(\`[Google 2FA] SMTP_USER or SMTP_PASS not configured in .env. 6-digit code logged above for testing.\`);
    return { sent: false, note: 'SMTP credentials not configured in environment' };
  }

  const fromAddress = process.env.SMTP_FROM || \`"Trash to Cash Verification" <\${process.env.SMTP_USER}>\`;
  const htmlContent = \`
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; color: #ffffff; padding: 20px; }
      .container { max-width: 500px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px 24px; text-align: center; }
      .logo { font-size: 24px; font-weight: 800; color: #10b981; margin-bottom: 8px; letter-spacing: 0.5px; }
      .tagline { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
      .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
      .desc { font-size: 14px; color: #cbd5e1; line-height: 1.5; margin-bottom: 24px; }
      .code-box { background: #1e293b; border: 2px dashed #10b981; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
      .code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #34d399; font-family: monospace; }
      .expiry { font-size: 12px; color: #f59e0b; margin-top: 6px; }
      .security-note { font-size: 12px; color: #64748b; line-height: 1.4; border-top: 1px solid #1e293b; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">🌿 Trash to Cash</div>
      <div class="tagline">Smart Recycling & Rewards</div>
      <div class="title">Two-Step Verification Code</div>
      <p class="desc">Hello <strong>\${userName}</strong>,<br/>Use the verification code below to complete your Google sign-in:</p>
      <div class="code-box">
        <div class="code">\${code}</div>
        <div class="expiry">⏱ Valid for 10 minutes</div>
      </div>
      <p class="security-note">
        If you did not request this login code, someone may be attempting to sign in to your Trash to Cash account. Please ignore this email or update your account security settings.
      </p>
    </div>
  </body>
  </html>
  \`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: \`Your Trash to Cash Verification Code: \${code}\`,
      text: \`Hello \${userName},\\n\\nYour Trash to Cash two-step verification code is: \${code}\\n\\nThis code will expire in 10 minutes.\\n\\nIf you did not request this, please ignore this email.\`,
      html: htmlContent
    });
    console.log(\`[Google 2FA] Verification email successfully sent to \${toEmail}\`);
    return { sent: true };
  } catch (err) {
    console.error(\`[Google 2FA Error] Failed to send email to \${toEmail}:\`, err.message);
    return { sent: false, error: err.message };
  }
}

// 1. Initiate Google Two-Step Verification (Sends OTP to Gmail)
async function handleGoogleInitiate2FA(req, res) {
  try {
    const { credential, idToken, email: rawEmail, name: rawName, picture: rawPicture } = req.body;
    let email = (rawEmail || '').trim().toLowerCase();
    let name = rawName || '';
    let picture = rawPicture || '';

    // Decode JWT payload if provided
    const tokenToVerify = credential || idToken;
    if (tokenToVerify && typeof tokenToVerify === 'string') {
      try {
        const parts = tokenToVerify.split('.');
        if (parts.length === 3) {
          const parsed = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (parsed && parsed.email) {
            email = parsed.email.trim().toLowerCase();
            name = name || parsed.name || parsed.given_name || email.split('@')[0];
            picture = picture || parsed.picture || '';
          }
        }
      } catch (decErr) {
        console.warn('[Google JWT Decode Warning]', decErr.message);
      }
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid Google email is required' });
    }

    if (!name) name = email.split('@')[0];

    // Cryptographic 6-digit OTP code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingGoogle2FA.set(email, {
      code,
      expiresAt,
      googleUser: { email, name, picture, idToken: tokenToVerify }
    });

    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          "UPDATE users SET otp = $1, otp_expiry = NOW() + INTERVAL '10 minutes' WHERE LOWER(email) = $2",
          [code, email]
        );
      } catch (dbErr) {}
    }

    const emailResult = await sendGoogle2FAEmail(email, code, name);

    const parts = email.split('@');
    const maskedUser = parts[0].length > 2 
      ? parts[0][0] + '*'.repeat(Math.max(1, parts[0].length - 2)) + parts[0][parts[0].length - 1] 
      : parts[0][0] + '*';
    const maskedEmail = \`\${maskedUser}@\${parts[1]}\`;

    res.json({
      success: true,
      requires2FA: true,
      email,
      maskedEmail,
      name,
      message: \`A 6-digit verification code has been sent to \${email}\`,
      emailSent: emailResult.sent,
      debugCode: (!process.env.SMTP_USER || !process.env.SMTP_PASS) ? code : undefined
    });
  } catch (err) {
    console.error('[Google Initiate 2FA Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/auth/google/initiate-2fa', handleGoogleInitiate2FA);
app.post('/auth/google/initiate-2fa', handleGoogleInitiate2FA);

// 2. Verify Google Two-Step Verification OTP & Complete Login
async function handleGoogleVerify2FA(req, res) {
  try {
    const { email: rawEmail, otp, credential, idToken } = req.body;
    if (!rawEmail || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const email = rawEmail.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    let isValid = false;
    let storedUserData = null;

    const pending = pendingGoogle2FA.get(email);
    if (pending && pending.code === cleanOtp && Date.now() < pending.expiresAt) {
      isValid = true;
      storedUserData = pending.googleUser;
      pendingGoogle2FA.delete(email);
    }

    const pool = getPgPool();
    if (!isValid && pool) {
      try {
        const uRes = await pool.query(
          "SELECT user_id, otp, otp_expiry, full_name, profile_image, username FROM users WHERE LOWER(email) = $1 LIMIT 1",
          [email]
        );
        if (uRes.rows.length > 0) {
          const u = uRes.rows[0];
          if (u.otp === cleanOtp && (!u.otp_expiry || new Date() <= new Date(u.otp_expiry))) {
            isValid = true;
            storedUserData = {
              email,
              name: u.full_name || u.username || email.split('@')[0],
              picture: u.profile_image || ''
            };
          }
        }
      } catch (e) {}
    }

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code. Please check your Gmail or request a new code.' 
      });
    }

    const name = (storedUserData?.name || email.split('@')[0]).trim();
    const picture = storedUserData?.picture || '';
    const googleId = \`g_\${Date.now()}\`;
    const domain = email.includes('@') ? email.split('@')[1].toLowerCase().trim() : '';

    // Multi-tenant enterprise domain matching
    let userType = 'CITIZEN';
    let matchedOrg = inMemoryOrganizations.find(o => o.domain.toLowerCase() === domain && o.status === 'active');
    if (pool) {
      try {
        const orgRes = await pool.query(
          'SELECT * FROM organizations WHERE LOWER(domain) = $1 AND status = $2 LIMIT 1',
          [domain, 'active']
        );
        if (orgRes.rows.length > 0) matchedOrg = orgRes.rows[0];
      } catch {}
    }

    let deptId = null;
    let deptName = 'General Office';
    if (matchedOrg) {
      userType = 'ENTERPRISE';
      if (pool) {
        try {
          const deptRes = await pool.query('SELECT * FROM departments WHERE org_id = $1 ORDER BY dept_id ASC LIMIT 1', [matchedOrg.org_id]);
          if (deptRes.rows.length > 0) {
            deptId = deptRes.rows[0].dept_id;
            deptName = deptRes.rows[0].name;
          }
        } catch {}
      }
    }

    let userId = email;
    let pointsBalance = 0;
    let employeeId = null;

    if (pool) {
      try {
        const existing = await pool.query(
          'SELECT * FROM users WHERE LOWER(email) = $1 OR user_id = $1 LIMIT 1',
          [email]
        );
        if (existing.rows.length > 0) {
          const row = existing.rows[0];
          userId = row.user_id;
          pointsBalance = Number(row.points_balance) || 0;
          employeeId = row.employee_id || null;
          deptId = row.dept_id || deptId;

          await pool.query(\`
            UPDATE users 
            SET full_name = $1, profile_image = COALESCE(NULLIF($2, ''), profile_image),
                auth_provider = 'google', user_type = $3,
                org_id = COALESCE($4, org_id), dept_id = COALESCE($5, dept_id),
                otp = NULL, otp_expiry = NULL,
                last_login = NOW(), last_active = NOW(), is_online = TRUE
            WHERE user_id = $6;
          \`, [name, picture, userType, matchedOrg?.org_id || null, deptId, userId]);
        } else {
          employeeId = \`EMP-\${Math.floor(1000 + Math.random() * 9000)}\`;
          await pool.query(\`
            INSERT INTO users (
              user_id, username, full_name, email, mobile, profile_image,
              google_id, auth_provider, user_type, org_id, dept_id, employee_id,
              points_balance, role_id, is_online, last_login, last_active, created_at,
              otp, otp_expiry
            ) VALUES (
              $1, $1, $2, $1, NULL, $3,
              $4, 'google', $5, $6, $7, $8,
              0, 'user', TRUE, NOW(), NOW(), NOW(), NULL, NULL
            );
          \`, [userId, name, picture, googleId, userType, matchedOrg?.org_id || null, deptId, employeeId]);
        }
      } catch (upsertErr) {
        console.warn('[Google 2FA User Upsert Warning]', upsertErr.message);
      }
    }

    // Fetch user recycle metrics & stats
    let bottles = 0;
    let cups = 0;
    let glass = 0;
    let paper = 0;
    let totalWeightKg = 0;
    let totalCo2Kg = 0;
    let totalSessions = 0;
    let earnedPoints = 0;
    let redeemedPoints = 0;
    let recentSessions = [];

    if (pool) {
      try {
        const statsRes = await pool.query(\`
          SELECT 
            COALESCE(SUM(bottles), 0) AS total_bottles,
            COALESCE(SUM(cups), 0) AS total_cups,
            COALESCE(SUM(glass), 0) AS total_glass,
            COALESCE(SUM(paper), 0) AS total_paper,
            COALESCE(SUM(weight_kg), 0) AS total_weight,
            COALESCE(SUM(co2_kg), 0) AS total_co2,
            COALESCE(SUM(points), 0) AS total_earned_points,
            COUNT(session_id) AS session_count
          FROM recyclingsessions_typed
          WHERE user_id = $1 OR user_id = $2;
        \`, [userId, email]);

        if (statsRes.rows.length > 0) {
          const s = statsRes.rows[0];
          bottles = parseInt(s.total_bottles || 0);
          cups = parseInt(s.total_cups || 0);
          glass = parseInt(s.total_glass || 0);
          paper = parseInt(s.total_paper || 0);
          totalWeightKg = parseFloat(s.total_weight || 0);
          totalCo2Kg = parseFloat(s.total_co2 || 0);
          totalSessions = parseInt(s.session_count || 0);
          earnedPoints = parseInt(s.total_earned_points || 0);
        }
      } catch (e) {}
    }

    const token = jwt.sign(
      { userId, email, name, userType, orgId: matchedOrg?.org_id || null, deptId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      message: \`Verification successful! Welcome \${name}.\`,
      user: {
        id: userId,
        userId,
        email,
        username: name,
        fullName: name,
        picture,
        userType,
        points: pointsBalance,
        pointsBalance,
        authProvider: 'google',
        employeeId,
        organization: matchedOrg ? {
          orgId: matchedOrg.org_id,
          name: matchedOrg.name,
          domain: matchedOrg.domain,
          logoUrl: matchedOrg.logo_url,
          department: deptName
        } : null
      },
      recycleDetails: {
        points: pointsBalance,
        currentBalance: pointsBalance,
        earnedPoints,
        totalEarnedPoints: earnedPoints,
        redeemedPoints,
        totalRedeemedPoints: redeemedPoints,
        bottles,
        plasticCount: bottles,
        cups,
        aluminiumCount: cups,
        glassCount: glass,
        paperCount: paper,
        totalItems: bottles + cups + glass + paper,
        totalWeightKg: totalWeightKg > 0 ? parseFloat(totalWeightKg.toFixed(2)) : parseFloat((bottles * 0.025 + cups * 0.015).toFixed(2)),
        co2AvoidedKg: totalCo2Kg > 0 ? parseFloat(totalCo2Kg.toFixed(2)) : parseFloat((bottles * 0.08 + cups * 0.15).toFixed(2)),
        totalSessions,
        recentSessions
      }
    });
  } catch (err) {
    console.error('[Google Verify 2FA Error]', err);
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/auth/google/verify-2fa', handleGoogleVerify2FA);
app.post('/auth/google/verify-2fa', handleGoogleVerify2FA);

// 3. Resend Google Two-Step Verification Code
async function handleGoogleResend2FA(req, res) {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail || !rawEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    const email = rawEmail.trim().toLowerCase();
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    let existingData = pendingGoogle2FA.get(email) || {};
    pendingGoogle2FA.set(email, {
      ...existingData,
      code,
      expiresAt
    });

    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          "UPDATE users SET otp = $1, otp_expiry = NOW() + INTERVAL '10 minutes' WHERE LOWER(email) = $2",
          [code, email]
        );
      } catch (e) {}
    }

    const name = existingData.googleUser?.name || email.split('@')[0];
    const emailResult = await sendGoogle2FAEmail(email, code, name);

    res.json({
      success: true,
      message: \`A new 6-digit verification code has been sent to \${email}\`,
      emailSent: emailResult.sent,
      debugCode: (!process.env.SMTP_USER || !process.env.SMTP_PASS) ? code : undefined
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
app.post('/api/auth/google/resend-2fa', handleGoogleResend2FA);
app.post('/auth/google/resend-2fa', handleGoogleResend2FA);

// Main /api/auth/google endpoint (if otp is provided, verifies; otherwise initiates 2FA)
app.post('/api/auth/google', async (req, res) => {
  if (req.body.otp) {
    return handleGoogleVerify2FA(req, res);
  }
  return handleGoogleInitiate2FA(req, res);
});`;

// Replace the old Google OAuth section
const startRegex = /\/\/ =+\r?\n\/\/ GOOGLE OAUTH & MULTI-TENANT ENTERPRISE API\r?\n\/\/ =+/;
const endRegex = /\/\/ =+\r?\n\/\/ 1b\. GMAIL & WORK EMAIL PASSWORDLESS SSO \(OTP VERIFICATION\)\r?\n\/\/ =+/;

const startMatch = content.match(startRegex);
const endMatch = content.match(endRegex);

if (!startMatch || !endMatch) {
  console.error("Markers not found! startMatch:", !!startMatch, "endMatch:", !!endMatch);
  process.exit(1);
}

const startIndex = startMatch.index;
const endIndex = endMatch.index;

content = content.substring(0, startIndex) + newGoogle2FABlock + "\n\n" + content.substring(endIndex);

// Also add sendGoogle2FAEmail inside handleSendSsoCode if not already there
if (!content.includes("await sendGoogle2FAEmail(cleanEmail, code, existingName || 'Eco Citizen');")) {
  content = content.replace(
    "console.log(`[Gmail/Work SSO] Verification OTP for ${cleanEmail}: ${code}`);",
    "console.log(`[Gmail/Work SSO] Verification OTP for ${cleanEmail}: ${code}`);\n    await sendGoogle2FAEmail(cleanEmail, code, existingName || 'Eco Citizen');"
  );
}

fs.writeFileSync(serverIndexPath, content, 'utf8');
console.log("Successfully patched server/index.js! File size:", fs.statSync(serverIndexPath).size);
