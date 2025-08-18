import { storage } from '../storage.js';

// Database is automatically initialized when storage is created
// This file can be used for additional seeding if needed

export function initializeDatabase() {
  console.log('Database initialized with default fee structure');
  return storage;
}
