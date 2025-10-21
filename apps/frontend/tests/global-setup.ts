import { request } from 'undici';

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://127.0.0.1:3030';

async function callMCP(command: string) {
  try {
    console.log(`Calling MCP command: ${command}`);
    const response = await request(`${MCP_BASE_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cmd: command }),
    });

    const result = await response.body.json();
    
    if (result.ok) {
      console.log(`MCP command ${command} completed successfully`);
      return result;
    } else {
      throw new Error(`MCP command ${command} failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`Failed to call MCP command ${command}:`, error);
    throw error;
  }
}

export default async function globalSetup() {
  console.log('Starting global setup for Playwright tests...');
  
  try {
    // Check if MCP server is running
    console.log('Checking MCP server availability...');
    await callMCP('db.status');
    
    // Reset database to clean state
    console.log('Resetting database...');
    await callMCP('db.reset');
    
    // Seed database with test data
    console.log('Seeding database with test data...');
    await callMCP('db.seed');
    
    console.log('Global setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  }
}
