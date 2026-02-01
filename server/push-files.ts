import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) throw new Error('GitHub not connected');
  return accessToken;
}

async function getGitHubClient() {
  return new Octokit({ auth: await getAccessToken() });
}

const IGNORE = ['node_modules', '.git', '.cache', 'dist', '.replit', 'replit.nix', '.upm', '.local', 'attached_assets'];

function getAllFiles(dir: string, base = ''): { path: string; content: string; isBinary: boolean }[] {
  const files: { path: string; content: string; isBinary: boolean }[] = [];
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    if (IGNORE.includes(entry)) continue;
    const fullPath = path.join(dir, entry);
    const relativePath = base ? `${base}/${entry}` : entry;
    
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath, relativePath));
    } else {
      try {
        const content = fs.readFileSync(fullPath);
        const isBinary = /\.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(entry);
        files.push({
          path: relativePath,
          content: isBinary ? content.toString('base64') : content.toString('utf-8'),
          isBinary
        });
      } catch (e) {}
    }
  }
  return files;
}

async function pushFiles() {
  const octokit = await getGitHubClient();
  const owner = 'Flowing80';
  const repo = 'booksswap';
  
  console.log('Collecting files...');
  const files = getAllFiles('/home/runner/workspace');
  console.log(`Found ${files.length} files to push\n`);
  
  // Upload each file using contents API
  for (const file of files) {
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.path,
        message: `Add ${file.path}`,
        content: file.isBinary ? file.content : Buffer.from(file.content).toString('base64'),
        branch: 'main'
      });
      console.log(`✓ ${file.path}`);
    } catch (e: any) {
      if (e.status === 422 && e.message.includes('sha')) {
        console.log(`~ ${file.path} (exists)`);
      } else if (e.status === 404) {
        // Branch doesn't exist, create it first
        console.log(`Creating main branch...`);
        try {
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'README.md',
            message: 'Initial commit',
            content: Buffer.from('# BooksSwap\n\nA community book swapping platform').toString('base64')
          });
          console.log('✓ README.md (created branch)');
          // Retry the original file
          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: file.path,
            message: `Add ${file.path}`,
            content: file.isBinary ? file.content : Buffer.from(file.content).toString('base64'),
            branch: 'main'
          });
          console.log(`✓ ${file.path}`);
        } catch (e2: any) {
          console.log(`✗ ${file.path}: ${e2.message}`);
        }
      } else {
        console.log(`✗ ${file.path}: ${e.message}`);
      }
    }
  }
  
  console.log('\n✅ Done! Your code is at:');
  console.log(`https://github.com/${owner}/${repo}`);
}

pushFiles().catch(err => console.error('Error:', err.message));
