import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== BooksSwap Diagnostic ===\n');

console.log('1. Node Version:', process.version);
console.log('2. Current Directory:', process.cwd());

console.log('\n3. Required Files:');
const files = ['dist/index.cjs', 'package.json', 'node_modules'];
files.forEach(f => {
  const exists = existsSync(join(__dirname, f));
  console.log(`   ${f}: ${exists ? '✓ Found' : '✗ MISSING'}`);
});

console.log('\n4. Environment Variables:');
const vars = ['DATABASE_URL', 'JWT_SECRET', 'PORT', 'NODE_ENV'];
vars.forEach(v => {
  const value = process.env[v];
  if (v === 'DATABASE_URL' && value) {
    console.log(`   ${v}: ✓ Set (${value.substring(0, 20)}...)`);
  } else {
    console.log(`   ${v}: ${value ? '✓ Set' : '✗ NOT SET'}`);
  }
});

console.log('\n5. Testing Database Connection...');
if (!process.env.DATABASE_URL) {
  console.log('   ✗ Cannot test - DATABASE_URL not set');
} else {
  try {
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log('   ✓ Database connected successfully');
    await client.end();
  } catch (e) {
    console.log('   ✗ Database connection failed:', e.message);
  }
}

console.log('\n6. Testing Server Start...');
try {
  const port = process.env.PORT || 5000;
  const { default: express } = await import('express');
  const app = express();
  app.get('/', (req, res) => res.send('OK'));
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`   ✓ Server can bind to port ${port}`);
    console.log(`   Test URL: http://localhost:${port}`);
    server.close();
    console.log('\n=== Diagnostic Complete ===');
  });
} catch (e) {
  console.log('   ✗ Server failed to start:', e.message);
}
