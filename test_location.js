// Test script for location functionality
// Run with: node test_location.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yrpfcforiwwwrvcanyhb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycGZjZm9yaXd3d3J2Y2FueWhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY1MjM1MiwiZXhwIjoyMDYyMjI4MzUyfQ.y4lTg8gufdV6Tanyj2h0As0uLluHCFwzg9QLKucQoAw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocationFunctionality() {
  console.log('Testing location functionality...');

  try {
    // Test 1: Check if sellers table exists and has data
    console.log('\n1. Checking sellers table...');
    const { data: sellers, error: sellersError } = await supabase
      .from('sellers')
      .select('*')
      .limit(5);

    if (sellersError) {
      console.error('Error fetching sellers:', sellersError);
    } else {
      console.log(`Found ${sellers.length} sellers in database`);
      sellers.forEach(seller => {
        console.log(`- ${seller.name} (${seller.is_open ? 'Open' : 'Closed'})`);
      });
    }

    // Test 2: Test the find_nearby_sellers function
    console.log('\n2. Testing find_nearby_sellers function...');
    const testLat = 37.7749; // San Francisco coordinates
    const testLng = -122.4194;
    const testRadius = 10; // 10km radius

    const { data: nearbySellers, error: functionError } = await supabase
      .rpc('find_nearby_sellers', {
        buyer_lat: testLat,
        buyer_lng: testLng,
        radius_km: testRadius
      });

    if (functionError) {
      console.error('Error calling find_nearby_sellers:', functionError);
    } else {
      console.log(`Found ${nearbySellers.length} nearby sellers`);
      nearbySellers.forEach(seller => {
        console.log(`- ${seller.name}: ${seller.distance_km.toFixed(2)}km away (${seller.is_open ? 'Open' : 'Closed'})`);
      });
    }

    // Test 3: Test location update
    console.log('\n3. Testing location update...');
    if (sellers && sellers.length > 0) {
      const testSeller = sellers[0];
      const newLat = 37.7849;
      const newLng = -122.4094;

      const { error: updateError } = await supabase
        .from('sellers')
        .update({
          current_location: `POINT(${newLng} ${newLat})`,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', testSeller.seller_id);

      if (updateError) {
        console.error('Error updating seller location:', updateError);
      } else {
        console.log(`Successfully updated location for ${testSeller.name}`);
      }
    }

    console.log('\n✅ Location functionality test completed!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testLocationFunctionality(); 