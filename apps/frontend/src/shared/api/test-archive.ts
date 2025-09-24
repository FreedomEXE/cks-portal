// Test file to verify archive API functionality
import { archiveAPI } from './archive';

// Test function to be called from browser console
(window as any).testArchiveAPI = async () => {
  console.log('Testing Archive API...');

  try {
    // Test listing all archived
    console.log('1. Testing listArchived() with no filter:');
    const allArchived = await archiveAPI.listArchived();
    console.log('All archived:', allArchived);

    // Test listing managers
    console.log('\n2. Testing listArchived("manager"):');
    const managers = await archiveAPI.listArchived('manager');
    console.log('Archived managers:', managers);

    // Test listing contractors
    console.log('\n3. Testing listArchived("contractor"):');
    const contractors = await archiveAPI.listArchived('contractor');
    console.log('Archived contractors:', contractors);

    return { allArchived, managers, contractors };
  } catch (error) {
    console.error('Test failed:', error);
    return error;
  }
};

// Also expose the archiveAPI object directly for inspection
(window as any).archiveAPIObject = archiveAPI;
(window as any).archiveAPIMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(archiveAPI));

console.log('Archive API test loaded. Run window.testArchiveAPI() in console to test.');
console.log('Archive API object exposed as window.archiveAPIObject');
console.log('Archive API methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(archiveAPI)));

export {};