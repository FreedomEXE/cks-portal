/**
 * Test Create API directly with fetch
 */

const testCreateAPI = async () => {
  console.log('🧪 Testing Create API directly...\n');

  const contractorData = {
    role: 'contractor',
    company_name: 'Test Contractor API',
    contact_person: 'Jane Doe', 
    email: 'jane@testapi.com',
    phone: '555-9999',
    address: '456 API Street',
    website: 'https://apitest.com',
    cks_manager: 'mgr-000'
  };

  try {
    const response = await fetch('http://localhost:5000/api/admin/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(contractorData)
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response ok: ${response.ok}`);
    
    const result = await response.text();
    console.log(`Response body: ${result}`);

    if (response.ok) {
      console.log('✅ Contractor created successfully!');
      const data = JSON.parse(result);
      console.log('Created contractor:', data);
    } else {
      console.log('❌ Failed to create contractor');
      try {
        const errorData = JSON.parse(result);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', result);
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

testCreateAPI();