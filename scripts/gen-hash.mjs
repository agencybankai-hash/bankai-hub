import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('bankai2024', 12);
console.log('HASH:', hash);
