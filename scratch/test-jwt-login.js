import jwt from 'jsonwebtoken';

const JWT_SECRET = 'rvm-isp-dev-secret-key-2026';
const testPayload = { userId: 'usr_test_123', username: 'testuser', mobile: '03001234567' };

const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '30d' });
console.log('Generated JWT Token successfully:', token);

const decoded = jwt.verify(token, JWT_SECRET);
console.log('Decoded Token:', decoded);

console.log('JWT Verification & Signing Test Passed!');
