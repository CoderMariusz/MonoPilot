#!/usr/bin/env node

/**
 * Create organization-logos storage bucket
 */

const SUPABASE_ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = 'pgroxddbtaevdegnidaz';

console.log('🔄 Creating organization-logos storage bucket...\n');

async function main() {
  try {
    // Create storage bucket
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/storage/buckets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'organization-logos',
        id: 'organization-logos',
        public: true,
        file_size_limit: 2097152, // 2MB in bytes
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check if bucket already exists
      if (response.status === 409 || errorText.includes('already exists')) {
        console.log('ℹ️  Bucket already exists, checking if it needs updates...\n');

        // Update bucket to ensure it's public
        const updateResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/storage/buckets/organization-logos`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public: true,
            file_size_limit: 2097152,
            allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
          })
        });

        if (!updateResponse.ok) {
          console.log('⚠️  Could not update bucket settings, but it exists');
        } else {
          console.log('✅ Bucket updated successfully!');
        }
      } else {
        console.error('❌ Failed to create bucket:', response.status, response.statusText);
        console.error('Response:', errorText);
        process.exit(1);
      }
    } else {
      const result = await response.json();
      console.log('✅ Bucket created successfully!');
      console.log('\n📋 Bucket details:');
      console.log('   - Name: organization-logos');
      console.log('   - Public: Yes');
      console.log('   - Max file size: 2MB');
      console.log('   - Allowed types: JPG, PNG, WebP\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
