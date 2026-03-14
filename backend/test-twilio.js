/**
 * Test Twilio API connectivity
 * Run: node test-twilio.js
 */

require('dotenv').config();
const twilio = require('twilio');

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP;

console.log('🔍 Testing Twilio API Connectivity...\n');

// Validate credentials exist
if (!TWILIO_SID || !TWILIO_TOKEN) {
  console.error('❌ ERROR: Missing Twilio credentials in .env file');
  console.error('TWILIO_SID:', TWILIO_SID ? '✓ Set' : '✗ Missing');
  console.error('TWILIO_TOKEN:', TWILIO_TOKEN ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

console.log('📋 Credentials Loaded:');
console.log('├─ TWILIO_SID:', TWILIO_SID.substring(0, 8) + '...');
console.log('├─ TWILIO_TOKEN:', TWILIO_TOKEN.substring(0, 8) + '...');
console.log('└─ TWILIO_WHATSAPP:', TWILIO_WHATSAPP);
console.log('');

// Initialize Twilio client
const client = twilio(TWILIO_SID, TWILIO_TOKEN);

// Test API connectivity
(async () => {
  try {
    console.log('🌐 Testing API connection to Twilio...');
    
    // Fetch account details
    const account = await client.api.accounts(TWILIO_SID).fetch();
    
    console.log('\n✅ TWILIO API IS RESPONDING!\n');
    console.log('📊 Account Details:');
    console.log('├─ Status:', account.status);
    console.log('├─ Account Type:', account.type);
    console.log('├─ Account Balance: $' + account.balance);
    console.log('└─ Account SID: ' + account.sid);
    console.log('\n✅ Twilio connection is healthy!');
    
  } catch (error) {
    console.error('\n❌ TWILIO API NOT RESPONDING\n');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting Steps:');
    console.error('1. Verify TWILIO_SID and TWILIO_TOKEN in .env are correct');
    console.error('2. Check Twilio Console: https://www.twilio.com/console');
    console.error('3. Ensure credentials have not expired');
    console.error('4. Check internet connectivity');
    process.exit(1);
  }
})();
