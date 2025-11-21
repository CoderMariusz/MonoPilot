#!/usr/bin/env node

/**
 * Create organization-logos storage bucket using Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

console.log('🔄 Creating organization-logos storage bucket...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    // Create storage bucket
    const { data, error } = await supabase.storage.createBucket('organization-logos', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Bucket "organization-logos" already exists!\n');

        // Update bucket to ensure correct settings
        const { data: updateData, error: updateError } = await supabase.storage.updateBucket('organization-logos', {
          public: true,
          fileSizeLimit: 2097152,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        });

        if (updateError) {
          console.log('⚠️  Could not update bucket settings:', updateError.message);
        } else {
          console.log('✅ Bucket settings updated successfully!');
        }
      } else {
        console.error('❌ Failed to create bucket:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Bucket created successfully!');
      console.log('\n📋 Bucket details:');
      console.log('   - Name: organization-logos');
      console.log('   - Public: Yes');
      console.log('   - Max file size: 2MB');
      console.log('   - Allowed types: JPG, PNG, WebP\n');
    }

    // List all buckets to confirm
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError && buckets) {
      console.log('📦 All storage buckets:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
