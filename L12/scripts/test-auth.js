import 'dotenv/config';

console.log('--- Auth Test ---');
console.log('Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
const key = process.env.GOOGLE_PRIVATE_KEY;
console.log('Key type:', typeof key);
console.log('Key length:', key?.length);
console.log('Key starts with:', key?.substring(0, 30));

const cleanedKey = key?.replace(/\\n/g, '\n').replace(/"/g, '');
console.log('Cleaned Key starts with:', cleanedKey?.substring(0, 30));
console.log('Cleaned Key contains real newlines:', cleanedKey?.includes('\n'));
