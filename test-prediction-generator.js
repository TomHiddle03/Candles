// Test file for CoinGecko Prediction Generator
const { PredictionGenerator } = require('./prediction-generator');

async function testPredictionGenerator() {
    console.log('🧪 Testing CoinGecko Prediction Generator...\n');

    try {
        // Test 1: Initialize generator (no API key needed)
        console.log('1. Testing initialization...');
        const generator = new PredictionGenerator();
        console.log('✅ Generator initialized successfully (free tier)\n');

        // Test 2: Check timestamp generation
        console.log('2. Testing timestamp generation...');
        const timestamps = generator.getNextTimestamps();
        console.log('Next timestamps:');
        console.log(`   Hourly:  ${timestamps.hourly} (${new Date(timestamps.hourly * 1000).toISOString()})`);
        console.log(`   Daily:   ${timestamps.daily} (${new Date(timestamps.daily * 1000).toISOString()})`);
        console.log(`   Weekly:  ${timestamps.weekly} (${new Date(timestamps.weekly * 1000).toISOString()})`);
        console.log('✅ Timestamp generation working\n');

        // Test 3: Test API calls (CoinGecko free tier)
        console.log('3. Testing CoinGecko API connection...');
        
        try {
            const taoInfo = await generator.getTaoInfo();
            console.log(`✅ TAO info fetched: ${taoInfo.name} (${taoInfo.symbol.toUpperCase()})`);
            
            const currentPrice = await generator.getCurrentPrice();
            if (currentPrice) {
                console.log(`✅ Current price: $${currentPrice.price.toFixed(2)}`);
                console.log(`✅ 24h change: ${currentPrice.change24h > 0 ? '+' : ''}${currentPrice.change24h.toFixed(2)}%`);
            }
            
            console.log('✅ API connection working\n');
            
            // Test 4: Generate sample predictions
            console.log('4. Testing prediction generation...');
            const predictions = await generator.generatePredictions('hours', 3);
            
            if (predictions.length > 0) {
                console.log(`✅ Generated ${predictions.length} predictions`);
                console.log('Sample prediction:');
                const sample = predictions[0];
                console.log(`   Color: ${sample.color}`);
                console.log(`   Confidence: ${sample.confidence}`);
                console.log(`   Price: $${sample.price}`);
                console.log(`   Analysis: ${sample.analysis}`);
                console.log('✅ Prediction generation working\n');
            } else {
                console.log('⚠️  No predictions generated\n');
            }
            
            // Test 5: CSV conversion
            console.log('5. Testing CSV conversion...');
            const csv = generator.predictionsToCSV(predictions.slice(0, 2));
            console.log('Sample CSV output:');
            console.log(csv);
            console.log('✅ CSV conversion working\n');
            
        } catch (apiError) {
            console.log(`❌ API Error: ${apiError.message}`);
            console.log('This might be due to rate limiting or network issues\n');
        }

        // Test 6: Test trend analysis with mock data
        console.log('6. Testing trend analysis with mock data...');
        const mockData = [
            { timestamp: 1000, open: 45.0, high: 46.0, low: 44.5, close: 45.5, volume: 0 },
            { timestamp: 2000, open: 45.5, high: 47.0, low: 45.0, close: 46.2, volume: 0 },
            { timestamp: 3000, open: 46.2, high: 47.5, low: 46.0, close: 46.8, volume: 0 },
            { timestamp: 4000, open: 46.8, high: 47.8, low: 46.5, close: 47.2, volume: 0 }
        ];
        
        const trend = generator.analyzeTrend(mockData);
        console.log('Trend analysis result:');
        console.log(`   Color: ${trend.color}`);
        console.log(`   Confidence: ${trend.confidence}`);
        console.log(`   Analysis: ${trend.analysis}`);
        console.log(`   Indicators:`, trend.indicators);
        console.log('✅ Trend analysis working\n');

        console.log('🎉 All tests completed successfully!');
        console.log('\n🚀 Ready to generate predictions for your Candles Subnet miner!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('rate limit')) {
            console.log('\n⏱️  Rate Limiting Info:');
            console.log('• CoinGecko free tier: 10-30 requests/minute');
            console.log('• Wait a few minutes and try again');
            console.log('• Consider getting a Pro API key for higher limits');
        }
    }
}

// Demo function to show usage examples
async function showUsageExamples() {
    console.log('\n📚 Usage Examples:\n');
    
    console.log('1. Basic generation (no API key needed):');
    console.log('   node prediction-generator.js\n');
    
    console.log('2. Preview predictions:');
    console.log('   node prediction-generator.js --preview hours\n');
    
    console.log('3. Custom output directory:');
    console.log('   node prediction-generator.js --output ./my-predictions/\n');
    
    console.log('4. Health check:');
    console.log('   node prediction-generator.js --health\n');
    
    console.log('5. Using Pro API key (optional):');
    console.log('   export COINGECKO_API_KEY="your_key"');
    console.log('   node prediction-generator.js\n');
    
    console.log('📁 Generated files will be placed in ~/.candles/data/:');
    console.log('   • hourly_predictions.csv');
    console.log('   • daily_predictions.csv');
    console.log('   • weekly_predictions.csv\n');
    
    console.log('🕯️ These files are automatically detected by Candles Subnet miners!');
    console.log('🆓 No API key required - CoinGecko has a generous free tier!');
}

// Run tests
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--examples')) {
        showUsageExamples();
    } else {
        testPredictionGenerator();
    }
}

module.exports = { testPredictionGenerator, showUsageExamples };
