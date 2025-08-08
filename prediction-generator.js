// CoinGecko Prediction Generator for Candles Subnet
// Simple, focused implementation using CoinGecko API (free tier available)

const fs = require('fs').promises;
const path = require('path');

class PredictionGenerator {
    constructor(apiKey = null) {
        this.apiKey = apiKey; // Optional - CoinGecko has free tier
        this.baseUrl = 'https://api.coingecko.com/api/v3';
        this.proBaseUrl = 'https://pro-api.coingecko.com/api/v3'; // For pro users
        this.coinId = 'bittensor'; // TAO's ID on CoinGecko
        
        // Use pro API if key is provided, otherwise free API
        this.effectiveBaseUrl = apiKey ? this.proBaseUrl : this.baseUrl;
        
        this.headers = {
            'Accept': 'application/json'
        };
        
        // Add API key header if provided
        if (apiKey) {
            this.headers['x-cg-pro-api-key'] = apiKey;
        }
        
        console.log(`🚀 Initialized CoinGecko Prediction Generator (${apiKey ? 'Pro' : 'Free'} tier)`);
    }

    // Get current UTC timestamp aligned to interval
    getNextTimestamps() {
        const now = new Date();
        
        // Next hour (start of next hour)
        const nextHour = new Date(now);
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(nextHour.getHours() + 1);
        
        // Next day (start of next day)
        const nextDay = new Date(now);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Next week (start of next Monday)
        const nextWeek = new Date(now);
        nextWeek.setHours(0, 0, 0, 0);
        const daysUntilMonday = (8 - nextWeek.getDay()) % 7;
        nextWeek.setDate(nextWeek.getDate() + (daysUntilMonday || 7));
        
        return {
            hourly: Math.floor(nextHour.getTime() / 1000),
            daily: Math.floor(nextDay.getTime() / 1000),
            weekly: Math.floor(nextWeek.getTime() / 1000)
        };
    }

    // Get TAO cryptocurrency info from CoinGecko
    async getTaoInfo() {
        const url = `${this.effectiveBaseUrl}/coins/${this.coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
        
        try {
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            console.log(`✅ Found TAO (${data.symbol.toUpperCase()}) on CoinGecko`);
            return data;
            
        } catch (error) {
            console.error('❌ Error fetching TAO info:', error.message);
            throw error;
        }
    }

    // Fetch OHLC data from CoinGecko
    async fetchOHLCData(days = 30) {
        const url = `${this.effectiveBaseUrl}/coins/${this.coinId}/ohlc?vs_currency=usd&days=${days}`;
        
        try {
            console.log('📊 Fetching OHLC data from CoinGecko...');
            
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            
            if (!data || data.length === 0) {
                throw new Error('No OHLC data available');
            }
            
            const normalizedData = this.normalizeOHLCData(data);
            console.log(`✅ Fetched ${normalizedData.length} OHLC data points`);
            return normalizedData;
            
        } catch (error) {
            console.error('❌ Error fetching OHLC data:', error.message);
            throw error;
        }
    }

    // Get current price and market data
    async getCurrentPrice() {
        const url = `${this.effectiveBaseUrl}/simple/price?ids=${this.coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;
        
        try {
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const taoData = data[this.coinId];
            
            if (!taoData) {
                throw new Error('TAO price data not found');
            }
            
            return {
                price: taoData.usd,
                marketCap: taoData.usd_market_cap,
                volume24h: taoData.usd_24h_vol,
                change24h: taoData.usd_24h_change,
                lastUpdated: taoData.last_updated_at
            };
            
        } catch (error) {
            console.error('❌ Error fetching current price:', error.message);
            return null;
        }
    }

    // Normalize CoinGecko OHLC data to standard format
    normalizeOHLCData(ohlcData) {
        return ohlcData.map(item => ({
            timestamp: Math.floor(item[0] / 1000), // Convert to seconds
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: 0 // OHLC endpoint doesn't include volume
        })).sort((a, b) => a.timestamp - b.timestamp);
    }

    // Advanced trend analysis using multiple indicators
    analyzeTrend(priceData) {
        if (priceData.length < 3) {
            return { 
                color: 'green', 
                confidence: 0.5, 
                priceChange: 0,
                analysis: 'Insufficient data'
            };
        }

        const recent = priceData.slice(-10);
        
        // 1. Price momentum (recent price changes)
        const momentum = this.calculateMomentum(recent);
        
        // 2. Moving average trend
        const maTrend = this.calculateMovingAverageTrend(recent);
        
        // 3. Volume analysis
        const volumeTrend = this.calculateVolumeTrend(recent);
        
        // 4. Volatility analysis
        const volatility = this.calculateVolatility(recent);
        
        // 5. Support/Resistance levels
        const supportResistance = this.findSupportResistance(recent);
        
        // Combine all indicators
        const indicators = {
            momentum: momentum.signal,
            movingAverage: maTrend.signal,
            volume: volumeTrend.signal,
            volatility: volatility,
            supportResistance: supportResistance.signal
        };
        
        // Calculate final prediction
        const signals = [
            momentum.signal,
            maTrend.signal,
            volumeTrend.signal,
            supportResistance.signal
        ].filter(s => s !== 0);
        
        const bullishCount = signals.filter(s => s > 0).length;
        const bearishCount = signals.filter(s => s < 0).length;
        
        // Determine color
        const color = bullishCount > bearishCount ? 'green' : 'red';
        
        // Calculate confidence based on signal agreement
        const totalSignals = signals.length;
        const agreement = Math.abs(bullishCount - bearishCount) / totalSignals;
        const volatilityFactor = Math.max(0.1, 1 - volatility * 2); // Lower volatility = higher confidence
        
        const confidence = Math.min(0.95, Math.max(0.55, 
            0.6 + (agreement * 0.25) + (volatilityFactor * 0.15)
        ));

        return {
            color,
            confidence: Number(confidence.toFixed(2)),
            priceChange: momentum.change,
            indicators,
            analysis: this.generateAnalysisText(indicators, color, confidence)
        };
    }

    calculateMomentum(data) {
        const changes = [];
        for (let i = 1; i < data.length; i++) {
            changes.push(data[i].close - data[i-1].close);
        }
        
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        const signal = avgChange > 0 ? 1 : avgChange < 0 ? -1 : 0;
        
        return { change: avgChange, signal };
    }

    calculateMovingAverageTrend(data) {
        if (data.length < 5) return { signal: 0 };
        
        const shortMA = data.slice(-3).reduce((sum, d) => sum + d.close, 0) / 3;
        const longMA = data.slice(-5).reduce((sum, d) => sum + d.close, 0) / 5;
        
        return { 
            signal: shortMA > longMA ? 1 : shortMA < longMA ? -1 : 0,
            shortMA,
            longMA
        };
    }

    calculateVolumeTrend(data) {
        const hasVolume = data.some(d => d.volume && d.volume > 0);
        if (!hasVolume) return { signal: 0 };
        
        const recent = data.slice(-3);
        const older = data.slice(-6, -3);
        
        if (older.length === 0) return { signal: 0 };
        
        const recentAvgVol = recent.reduce((sum, d) => sum + (d.volume || 0), 0) / recent.length;
        const olderAvgVol = older.reduce((sum, d) => sum + (d.volume || 0), 0) / older.length;
        
        return { 
            signal: recentAvgVol > olderAvgVol * 1.1 ? 1 : recentAvgVol < olderAvgVol * 0.9 ? -1 : 0,
            recentVolume: recentAvgVol,
            olderVolume: olderAvgVol
        };
    }

    calculateVolatility(data) {
        const prices = data.map(d => d.close);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        const variance = prices.reduce((sum, price) => 
            sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
        
        return Math.sqrt(variance) / avgPrice;
    }

    findSupportResistance(data) {
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        const currentPrice = data[data.length - 1].close;
        
        const maxHigh = Math.max(...highs);
        const minLow = Math.min(...lows);
        
        // Simple support/resistance logic
        const resistance = maxHigh;
        const support = minLow;
        
        const distanceToResistance = (resistance - currentPrice) / currentPrice;
        const distanceToSupport = (currentPrice - support) / currentPrice;
        
        let signal = 0;
        if (distanceToResistance < 0.02) { // Near resistance
            signal = -1; // Bearish
        } else if (distanceToSupport < 0.02) { // Near support
            signal = 1; // Bullish
        }
        
        return {
            signal,
            resistance,
            support,
            distanceToResistance,
            distanceToSupport
        };
    }

    generateAnalysisText(indicators, color, confidence) {
        const parts = [];
        
        if (indicators.momentum > 0) parts.push('bullish momentum');
        else if (indicators.momentum < 0) parts.push('bearish momentum');
        
        if (indicators.movingAverage > 0) parts.push('MA uptrend');
        else if (indicators.movingAverage < 0) parts.push('MA downtrend');
        
        if (indicators.volume > 0) parts.push('volume increase');
        else if (indicators.volume < 0) parts.push('volume decrease');
        
        if (indicators.supportResistance > 0) parts.push('near support');
        else if (indicators.supportResistance < 0) parts.push('near resistance');
        
        const analysis = parts.length > 0 ? parts.join(', ') : 'mixed signals';
        return `${color.toUpperCase()} (${(confidence * 100).toFixed(0)}%): ${analysis}`;
    }

    // Generate price prediction based on analysis
    generatePricePrediction(priceData, interval) {
        if (priceData.length === 0) {
            return {
                color: Math.random() > 0.5 ? 'green' : 'red',
                confidence: 0.5 + Math.random() * 0.3,
                price: 45.0 + Math.random() * 10,
                analysis: 'No historical data - random prediction'
            };
        }

        const latestCandle = priceData[priceData.length - 1];
        const trend = this.analyzeTrend(priceData);
        
        // Base prediction on current close price
        let predictedPrice = latestCandle.close;
        
        // Apply interval-specific volatility expectations
        const volatilityMultiplier = {
            'hours': 0.025,   // 2.5% max change for hourly
            'days': 0.06,     // 6% max change for daily  
            'weeks': 0.12     // 12% max change for weekly
        };
        
        const maxChange = predictedPrice * (volatilityMultiplier[interval] || 0.025);
        
        // Calculate trend strength
        const trendStrength = Math.abs(trend.priceChange) / predictedPrice;
        const trendBias = trend.color === 'green' ? 1 : -1;
        
        // Combine random walk with trend bias and confidence
        const randomComponent = (Math.random() - 0.5) * 2 * maxChange * 0.4;
        const trendComponent = maxChange * 0.4 * trendBias * Math.min(trendStrength * 15, 1);
        const confidenceComponent = maxChange * 0.2 * trendBias * (trend.confidence - 0.5) * 2;
        
        predictedPrice += randomComponent + trendComponent + confidenceComponent;
        
        // Ensure reasonable bounds
        predictedPrice = Math.max(0.1, predictedPrice);
        
        return {
            color: trend.color,
            confidence: trend.confidence,
            price: Number(predictedPrice.toFixed(2)),
            analysis: trend.analysis,
            indicators: trend.indicators
        };
    }

    // Generate predictions for multiple future intervals
    async generatePredictions(interval, count = 24) {
        console.log(`📈 Generating ${count} ${interval} predictions using CoinGecko...`);
        
        const nextTimestamps = this.getNextTimestamps();
        const baseTimestamp = nextTimestamps[interval === 'hours' ? 'hourly' : 
                                            interval === 'days' ? 'daily' : 'weekly'];
        
        // Fetch historical data for analysis
        const historicalData = await this.fetchOHLCData(30); // Get 30 days of data
        
        // Add current price for most recent data
        const currentPrice = await this.getCurrentPrice();
        if (currentPrice) {
            console.log(`💰 Current TAO price: $${currentPrice.price.toFixed(2)}`);
            console.log(`📊 24h change: ${currentPrice.change24h > 0 ? '+' : ''}${currentPrice.change24h.toFixed(2)}%`);
        }
        
        const predictions = [];
        const intervalSeconds = {
            'hours': 3600,
            'days': 86400,
            'weeks': 604800
        };
        
        for (let i = 0; i < count; i++) {
            const timestamp = baseTimestamp + (i * intervalSeconds[interval]);
            const prediction = this.generatePricePrediction(historicalData, interval);
            
            predictions.push({
                timestamp,
                color: prediction.color,
                confidence: prediction.confidence,
                price: prediction.price,
                analysis: prediction.analysis,
                indicators: prediction.indicators
            });
        }
        
        return predictions;
    }

    // Convert predictions to CSV format (compatible with miners)
    predictionsToCSV(predictions) {
        const headers = 'timestamp,color,confidence,price';
        const rows = predictions.map(p => 
            `${p.timestamp},${p.color},${p.confidence},${p.price}`
        );
        return [headers, ...rows].join('\n');
    }

    // Save predictions to CSV file
    async savePredictionsToFile(predictions, filename) {
        const csv = this.predictionsToCSV(predictions);
        
        // Create directory if it doesn't exist
        const dir = path.dirname(filename);
        await fs.mkdir(dir, { recursive: true });
        
        await fs.writeFile(filename, csv, 'utf8');
        console.log(`💾 Saved ${predictions.length} predictions to ${filename}`);
    }

    // Generate all prediction files (main function)
    async generateAllPredictionFiles(outputDir = null) {
        const homeDir = require('os').homedir();
        const defaultDir = path.join(homeDir, '.candles', 'data');
        const targetDir = outputDir || defaultDir;

        console.log('\n🕯️ Generating Candles Subnet prediction files...');
        console.log('📡 Data source: CoinGecko API');

        try {
            // Test API connection first
            await this.getTaoInfo();
            
            const intervals = [
                { name: 'hours', filename: 'hourly_predictions.csv', count: 48 },   // 48 hours
                { name: 'days', filename: 'daily_predictions.csv', count: 30 },     // 30 days
                { name: 'weeks', filename: 'weekly_predictions.csv', count: 12 }    // 12 weeks
            ];

            for (const interval of intervals) {
                const predictions = await this.generatePredictions(interval.name, interval.count);
                const filepath = path.join(targetDir, interval.filename);
                await this.savePredictionsToFile(predictions, filepath);
                
                // Show sample prediction
                if (predictions.length > 0) {
                    const sample = predictions[0];
                    console.log(`📊 Sample ${interval.name} prediction: ${sample.analysis}`);
                }
                
                // Rate limiting (CoinGecko free tier: 10-30 requests/minute)
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`\n✅ All prediction files generated successfully!`);
            console.log(`📁 Location: ${targetDir}`);
            console.log('\n📋 Files created:');
            console.log('   • hourly_predictions.csv (48 predictions)');
            console.log('   • daily_predictions.csv (30 predictions)');
            console.log('   • weekly_predictions.csv (12 predictions)');
            console.log('\n🚀 Ready to use with your Candles Subnet miner!');
            
        } catch (error) {
            console.error('\n❌ Error generating prediction files:', error.message);
            
            if (error.message.includes('401') || error.message.includes('403')) {
                console.log('\n🔑 API Key Issues:');
                console.log('   • CoinGecko API key is optional for basic usage');
                console.log('   • Free tier has rate limits (10-30 requests/minute)');
                console.log('   • Get a Pro key at: https://www.coingecko.com/en/api/pricing');
            }
            
            throw error;
        }
    }

    // Preview predictions with detailed analysis
    async previewPredictions(interval = 'hours', count = 5) {
        console.log(`\n🔍 Previewing ${interval} predictions from CoinGecko...\n`);
        
        const predictions = await this.generatePredictions(interval, count);
        
        console.log('📅 Time\t\t\t🎯 Prediction\t💪 Conf\t💰 Price\t📈 Analysis');
        console.log('─'.repeat(100));
        
        predictions.slice(0, count).forEach(p => {
            const date = new Date(p.timestamp * 1000).toISOString().substring(0, 16).replace('T', ' ');
            const colorEmoji = p.color === 'green' ? '🟢' : '🔴';
            const conf = `${(p.confidence * 100).toFixed(0)}%`;
            const price = `$${p.price.toFixed(2)}`;
            
            console.log(`${date}\t${colorEmoji} ${p.color.toUpperCase()}\t\t${conf}\t${price}\t${p.analysis}`);
        });
        
        console.log('\n💡 Tip: Use --generate to create actual CSV files for your miner');
    }

    // API health check
    async healthCheck() {
        console.log('🏥 Checking CoinGecko API health...');
        
        try {
            const start = Date.now();
            await this.getTaoInfo();
            const responseTime = Date.now() - start;
            
            const currentPrice = await this.getCurrentPrice();
            
            console.log('✅ API Status: Healthy');
            console.log(`⚡ Response time: ${responseTime}ms`);
            console.log(`💰 Current TAO price: $${currentPrice?.price?.toFixed(2) || 'N/A'}`);
            console.log(`📊 Last updated: ${currentPrice ? new Date().toISOString() : 'N/A'}`);
            
            return true;
            
        } catch (error) {
            console.log('❌ API Status: Error');
            console.log(`🚨 Error: ${error.message}`);
            return false;
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
        console.log(`
🕯️ CoinGecko Prediction Generator for Candles Subnet

Usage:
  node prediction-generator.js [api_key] [options]

Options:
  --preview <interval>    Preview predictions (hours/days/weeks)
  --output <directory>    Custom output directory
  --health               Check API health
  --help                 Show this help

Examples:
  node prediction-generator.js
  node prediction-generator.js YOUR_API_KEY --preview hours
  node prediction-generator.js --output ./predictions/
  node prediction-generator.js YOUR_API_KEY --health

Environment Variable:
  COINGECKO_API_KEY=your_key_here (optional)

Get API Key (optional):
  https://www.coingecko.com/en/api/pricing
        `);
        return;
    }

    const apiKey = args[0] || process.env.COINGECKO_API_KEY || 'CG-b7zC1kt7UH8a3Q3xQ8r72iiX';
    
    // CoinGecko works without API key (free tier)
    console.log(`🚀 Starting with ${apiKey ? 'Pro' : 'Free'} tier...`);

    try {
        const generator = new PredictionGenerator(apiKey);

        // Health check
        if (args.includes('--health')) {
            await generator.healthCheck();
            return;
        }

        // Preview mode
        const previewIndex = args.indexOf('--preview');
        if (previewIndex !== -1) {
            const interval = args[previewIndex + 1] || 'hours';
            await generator.previewPredictions(interval);
            return;
        }

        // Custom output directory
        const outputIndex = args.indexOf('--output');
        const outputDir = outputIndex !== -1 ? args[outputIndex + 1] : null;

        // Generate prediction files
        await generator.generateAllPredictionFiles(outputDir);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('API key')) {
            console.log('\n🔑 API Key Help:');
            console.log('   1. CoinGecko works without API key (free tier)');
            console.log('   2. For higher rate limits, get Pro: https://www.coingecko.com/en/api/pricing');
            console.log('   3. Set: export COINGECKO_API_KEY="your_key"');
        }
        
        process.exit(1);
    }
}

// Export for use as module
module.exports = { PredictionGenerator };

// Run if called directly
if (require.main === module) {
    main();
}
