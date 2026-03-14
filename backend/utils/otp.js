// In-memory OTP store: { phone: { otp, expiry } }
const otpStore = {};

const twilio = require('twilio');
const TWILIO_SID = 'AC266474bfeeae6e893154bcfcb581ba58';
const TWILIO_TOKEN = '6a2a02b2541db75ac57a2af5030b4e9f';
const TWILIO_PHONE = '+15005550006'; // Twilio test number (replace with real number in production)

const client = twilio(TWILIO_SID, TWILIO_TOKEN);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(phone, name) {
  const otp = generateOTP();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store OTP
  otpStore[phone] = { otp, expiry };

  // Always log to console as fallback
  console.log('\n========================================');
  console.log(`📱 OTP for ${name} (${phone}): ${otp}`);
  console.log('========================================\n');

  // Try sending via Twilio SMS (for alerts use case)
  try {
    await client.messages.create({
      body: `🔐 ShipAlert OTP: ${otp}\n\nYour one-time password for login.\nValid for 5 minutes.\n\nDo not share this with anyone.`,
      from: TWILIO_PHONE,
      to: `+91${phone}`
    });
    console.log(`✅ OTP SMS sent to +91${phone}`);
  } catch (err) {
    console.log(`⚠️  Twilio SMS failed (check credentials): ${err.message}`);
    console.log(`✅ OTP is displayed in console for demo: ${otp}`);
  }

  return otp;
}

function verifyOTP(phone, inputOtp) {
  const record = otpStore[phone];
  if (!record) return { valid: false, reason: 'No OTP found for this phone' };
  if (Date.now() > record.expiry) {
    delete otpStore[phone];
    return { valid: false, reason: 'OTP expired' };
  }
  if (record.otp !== inputOtp) {
    return { valid: false, reason: 'Invalid OTP' };
  }
  delete otpStore[phone];
  return { valid: true };
}

module.exports = { sendOTP, verifyOTP, generateOTP };
