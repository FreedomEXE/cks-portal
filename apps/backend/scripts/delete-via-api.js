// Delete all users via API calls
const fetch = require('node-fetch');

async function deleteAllViaAPI() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api';  console.log('Fetching all entities from directory...');

  try {
    // Get all entities
    const types = ['managers', 'contractors', 'customers', 'centers', 'crew'];

    for (const type of types) {
      console.log(`\nFetching ${type}...`);
      const response = await fetch(`${baseURL}/directory/${type}`);
      if (!response.ok) {
        console.log(`  Could not fetch ${type}`);
        continue;
      }

      const data = await response.json();
      const items = data.data || [];

      console.log(`  Found ${items.length} ${type}`);

      // Archive each one
      for (const item of items) {
        const entityType = type === 'crew' ? 'crew' : type.slice(0, -1); // Remove 's' except for crew
        const entityId = item[`${entityType}_id`] || item.id;

        if (!entityId) continue;

        console.log(`  Archiving ${entityType} ${entityId}...`);

        try {
          const archiveResponse = await fetch(`${baseURL}/archive/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType,
              entityId,
              reason: 'Testing - bulk delete'
            })
          });

          if (!archiveResponse.ok) {
            console.log(`    Failed to archive ${entityId}`);
          }
        } catch (err) {
          console.log(`    Error archiving ${entityId}:`, err.message);
        }
      }
    }

    console.log('\n✅ Completed archiving all entities');
    console.log('Note: Entities are soft-deleted. Use hard delete if needed.');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if node-fetch is installed
try {
  require.resolve('node-fetch');
  deleteAllViaAPI();
} catch(e) {
  console.error('node-fetch is required but not installed.');
  console.error('Please install it manually: npm install node-fetch@2');
  console.error('Then run this script again.');
  process.exit(1);
}
