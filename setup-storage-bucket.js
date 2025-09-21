// Script to create the screenshots bucket in Supabase Storage
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yjyziszwmrwycodfkjac.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqeXppc3p3bXJ3eWNvZGZramFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIzNTM0OCwiZXhwIjoyMDczODExMzQ4fQ.g2CW4lLH4YzXrlNufnl-3Ri_iN7RvshP3Wa557Eu-js'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorageBucket() {
  try {
    console.log('🪣 Creating screenshots bucket...')
    
    // Create the bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('screenshots', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    })
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists')
      } else {
        console.error('❌ Error creating bucket:', bucketError)
        return
      }
    } else {
      console.log('✅ Bucket created successfully:', bucketData)
    }
    
    // Verify bucket exists and is public
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }
    
    const screenshotsBucket = buckets.find(bucket => bucket.name === 'screenshots')
    if (screenshotsBucket) {
      console.log('✅ Screenshots bucket found:', {
        name: screenshotsBucket.name,
        public: screenshotsBucket.public,
        id: screenshotsBucket.id
      })
    } else {
      console.error('❌ Screenshots bucket not found in list')
    }
    
  } catch (err) {
    console.error('❌ Setup failed:', err)
  }
}

setupStorageBucket()
