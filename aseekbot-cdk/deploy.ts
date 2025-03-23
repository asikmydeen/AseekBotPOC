#!/usr/bin/env ts-node
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Define the available stacks and environments
const stacks = [
  'all',        // Deploy all stacks
  'storage',    // Just the storage stack
  'processing', // Just the processing stack
  'api'         // Just the API stack
];

const environments = ['dev', 'prod'];

// Helper function to execute a command and return the output
function execCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(stderr);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask a question and get a response
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to validate input against available options
function validateOption(input: string, options: string[]): boolean {
  return options.includes(input.toLowerCase());
}

// Main deployment function
async function deploy() {
  console.log('Aseekbot CDK Deployment Script');
  console.log('------------------------------');

  // Ask for stack to deploy
  let stackToDeploy = '';
  while (!validateOption(stackToDeploy, stacks)) {
    stackToDeploy = await askQuestion(`Which stack would you like to deploy? (${stacks.join('/')}): `);
    stackToDeploy = stackToDeploy.toLowerCase();

    if (!validateOption(stackToDeploy, stacks)) {
      console.log(`Invalid stack name. Please choose one of: ${stacks.join(', ')}`);
    }
  }

  // Ask for environment
  let environment = '';
  while (!validateOption(environment, environments)) {
    environment = await askQuestion(`Which environment? (${environments.join('/')}): `);
    environment = environment.toLowerCase();

    if (!validateOption(environment, environments)) {
      console.log(`Invalid environment. Please choose one of: ${environments.join(', ')}`);
    }
  }

  // Set environment variables
  process.env.ENVIRONMENT = environment;

  // Different settings based on environment
  if (environment === 'dev') {
    process.env.AWS_S3_BUCKET_NAME = `aseekbot-files-${environment}`;
  } else if (environment === 'prod') {
    process.env.AWS_S3_BUCKET_NAME = 'aseekbot-files';
  }

  // Run cdk commands
  try {
    console.log('Building project...');
    await execCommand('npm run build');

    console.log('Running CDK synth...');
    await execCommand('cdk synth');

    let deployCommand = 'cdk deploy';

    // Determine which stacks to deploy
    if (stackToDeploy === 'all') {
      deployCommand += ' --all';
    } else if (stackToDeploy === 'storage') {
      deployCommand += ' AseekbotStorageStack';
    } else if (stackToDeploy === 'processing') {
      deployCommand += ' AseekbotProcessingStack';
    } else if (stackToDeploy === 'api') {
      deployCommand += ' AseekbotApiStack';
    }

    // Add deployment options
    deployCommand += ' --require-approval never';

    console.log(`Deploying ${stackToDeploy} stack to ${environment} environment...`);
    console.log(`Running command: ${deployCommand}`);

    // Execute the deployment
    const deployOutput = await execCommand(deployCommand);
    console.log(deployOutput);

    console.log(`Deployment of ${stackToDeploy} to ${environment} completed successfully!`);
  } catch (error) {
    console.error('Deployment failed:', error);
  } finally {
    rl.close();
  }
}

// Run the deployment
deploy().catch(error => {
  console.error('Unhandled error during deployment:', error);
  process.exit(1);
});