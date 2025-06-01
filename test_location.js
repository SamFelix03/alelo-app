// Test script to verify location functionality
// Run with: node test_location.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocationFunctions() {
  console.log('🧪 Testing Alelo App Location Functions\n');

  try {
    // Test 1: Check if PostGIS extension is enabled
    console.log('1. Testing PostGIS extension...');
    const { data: extensions, error: extError } = await supabase
      .from('pg_extension')
      .select('extname')
      .eq('extname', 'postgis');
    
    if (extError) {
      console.log('❌ PostGIS check failed:', extError.message);
    } else {
      console.log('✅ PostGIS extension is enabled');
    }

    // Test 2: Check if sample data exists
    console.log('\n2. Testing sample data...');
    const { data: sellers, error: sellersError } = await supabase
      .from('sellers')
      .select('seller_id, name, current_location, is_open');

    if (sellersError) {
      console.log('❌ Failed to fetch sellers:', sellersError.message);
    } else {
      console.log(`✅ Found ${sellers.length} sellers in database`);
      sellers.forEach(seller => {
        console.log(`   - ${seller.name} (${seller.is_open ? 'Open' : 'Closed'})`);
      });
    }

    // Test 3: Test find_nearby_sellers function
    console.log('\n3. Testing find_nearby_sellers function...');
    const { data: nearbySellers, error: nearbyError } = await supabase
      .rpc('find_nearby_sellers', {
        buyer_lat: 37.7749,  // San Francisco coordinates
        buyer_lng: -122.4194,
        radius_km: 10.0
      });

    if (nearbyError) {
      console.log('❌ find_nearby_sellers failed:', nearbyError.message);
    } else {
      console.log(`✅ Found ${nearbySellers.length} nearby sellers`);
      nearbySellers.forEach(seller => {
        console.log(`   - ${seller.name}: ${seller.distance_km.toFixed(2)}km away`);
      });
    }

    // Test 4: Test location update function
    console.log('\n4. Testing update_seller_location function...');
    if (sellers && sellers.length > 0) {
      const testSeller = sellers[0];
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_seller_location', {
          seller_uuid: testSeller.seller_id,
          lat: 37.7849,  // Slightly different coordinates
          lng: -122.4094
        });

      if (updateError) {
        console.log('❌ update_seller_location failed:', updateError.message);
      } else {
        console.log('✅ Successfully updated seller location');
      }
    }

    // Test 5: Check location history
    console.log('\n5. Testing location history...');
    const { data: history, error: historyError } = await supabase
      .from('seller_location_history')
      .select('seller_id, timestamp')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (historyError) {
      console.log('❌ Failed to fetch location history:', historyError.message);
    } else {
      console.log(`✅ Found ${history.length} location history entries`);
    }

    console.log('\n🎉 Location functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Instructions for running the test
console.log('📋 To run this test:');
console.log('1. Install @supabase/supabase-js: npm install @supabase/supabase-js');
console.log('2. Update the supabaseUrl and supabaseKey variables above');
console.log('3. Run: node test_location.js\n');

// Uncomment the line below to run the test
// testLocationFunctions(); 