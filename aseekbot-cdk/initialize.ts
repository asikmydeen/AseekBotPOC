#!/usr/bin/env ts-node
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to execute a command and return the output
function execCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    childProcess.exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Ensure a directory exists
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Copy files from the original project to the CDK project
function copyFiles(srcDir: string, destDir: string): void {
  ensureDirectoryExists(destDir);

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    const stats = fs.statSync(srcPath);
    if (stats.isDirectory()) {
      copyFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

// Initialize the project
async function initialize() {
  console.log('Initializing Aseekbot CDK Project');
  console.log('--------------------------------');

  try {
    // Install dependencies
    console.log('Installing dependencies...');
    await execCommand('npm install');

    // Make deployment script executable
    console.log('Making deployment script executable...');
    await execCommand('chmod +x deploy.ts');

    // Bootstrap CDK for the AWS environment
    console.log('Bootstrapping CDK for AWS environment...');
    await execCommand('cdk bootstrap');

    console.log('Initialization completed successfully!');
    console.log('To deploy the project, run:');
    console.log('  npm run build');
    console.log('  ./deploy.ts');
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

// Run the initialization
initialize().catch(error => {
  console.error('Unhandled error during initialization:', error);
  process.exit(1);
});