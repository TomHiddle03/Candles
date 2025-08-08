# JavaScript Prediction Generator for Candles Subnet

This JavaScript tool generates prediction CSV files for Candles Subnet miners, similar to the Python price client functionality. It fetches historical price data from CoinDesk API and generates intelligent predictions for hourly, daily, and weekly candle intervals.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- CoinDesk API key (get one from [CoinDesk API](https://www.coindesk.com/api))

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Set your API key:**
   ```bash
   export COINDESK_API_KEY="your_api_key_here"
   ```

### Usage

**Generate all prediction files:**
```bash
node prediction-generator.js YOUR_API_KEY
```

**Preview predictions before generating:**
```bash
node prediction-generator.js YOUR_API_KEY --preview hours
node prediction-generator.js YOUR_API_KEY --preview days
node prediction-generator.js YOUR_API_KEY --preview weeks
```

**Custom output directory:**
```bash
node prediction-generator.js YOUR_API_KEY --output ./my-predictions/
```

**Run tests:**
```bash
npm test
```

## 📁 Output Files

The generator creates three CSV files in `~/.candles/data/` (or your specified directory):

- `hourly_predictions.csv` - 48 hourly predictions
- `daily_predictions.csv` - 30 daily predictions  
- `weekly_predictions.csv` - 12 weekly predictions

### CSV Format

Each file follows the exact format expected by Candles Subnet miners:

```csv
timestamp,color,confidence,price
1704067200,red,0.85,45.50
1704070800,green,0.92,46.20
1704074400,red,0.78,44.90
```

## 🧠 Prediction Algorithm

The generator uses intelligent trend analysis instead of random predictions:

### 1. **Historical Data Analysis**
- Fetches recent price movements from CoinDesk API
- Analyzes the last 10 data points for trend identification

### 2. **Trend Detection**
- Calculates price changes and direction consistency
- Identifies upward/downward trends and strength
- Measures volatility and momentum

### 3. **Smart Predictions**
- **Color**: Based on trend direction (green for up, red for down)
- **Confidence**: Higher for consistent trends, lower for volatile periods
- **Price**: Trend-adjusted with appropriate volatility for each interval

### 4. **Interval-Specific Logic**
- **Hourly**: 2% max price movement, shorter trend analysis
- **Daily**: 5% max price movement, medium-term trends
- **Weekly**: 10% max price movement, longer trend patterns

## 🔧 Configuration

### Environment Variables

```bash
# Required: CoinDesk API key
export COINDESK_API_KEY="your_api_key_here"

# Optional: Custom prediction file path (overrides default directory)
export PREDICTIONS_FILE_PATH="/path/to/your/predictions.csv"
```

### API Configuration

The generator uses CoinDesk's historical price API with these parameters:

- **Market**: CADLI (CoinDesk Asset Data License Index)
- **Instrument**: TAO-USD
- **Data**: OHLC (Open, High, Low, Close)
- **Format**: JSON

## 📊 Integration with Miners

The generated CSV files work seamlessly with Candles Subnet miners:

1. **Automatic Detection**: Miners automatically find files in `~/.candles/data/`
2. **Interval Matching**: Files are loaded based on prediction interval
3. **Fallback Behavior**: If no file found, miners use random predictions

### File Placement Options

**Option 1: Default Directory (Recommended)**
```bash
~/.candles/data/hourly_predictions.csv
~/.candles/data/daily_predictions.csv  
~/.candles/data/weekly_predictions.csv
```

**Option 2: Environment Variable**
```bash
export PREDICTIONS_FILE_PATH="/custom/path/predictions.csv"
```

## 🛠 Development

### Project Structure

```
prediction-generator.js    # Main prediction generator class
package.json              # Node.js dependencies and scripts
test-predictions.js       # Test suite and examples
README-predictions.md     # This documentation
```

### Key Classes and Methods

**PredictionGenerator**
- `constructor(apiKey)` - Initialize with CoinDesk API key
- `generateAllPredictionFiles(outputDir)` - Generate all prediction files
- `previewPredictions(interval, count)` - Preview predictions without saving
- `analyzeTrend(priceData)` - Analyze price trend from historical data
- `generatePricePrediction(priceData, interval)` - Create single prediction

### Testing

```bash
# Run basic functionality tests
npm test

# Test with real API (requires valid API key)
COINDESK_API_KEY="your_key" npm test
```

## 🔄 Comparison with Python Client

This JavaScript implementation mirrors the Python `prices/client.py` functionality:

| Feature | Python Client | JavaScript Generator |
|---------|---------------|---------------------|
| **API Integration** | ✅ CoinDesk API | ✅ CoinDesk API |
| **Interval Support** | ✅ Hourly/Daily/Weekly | ✅ Hourly/Daily/Weekly |
| **Data Format** | ✅ OHLC Candles | ✅ OHLC Candles |
| **Error Handling** | ✅ Comprehensive | ✅ Comprehensive |
| **Weekly Aggregation** | ✅ Custom Logic | ✅ Custom Logic |
| **Output Format** | Python Objects | ✅ CSV Files |
| **Trend Analysis** | Basic | ✅ Advanced |

## 📈 Example Output

**Sample Hourly Predictions:**
```
Timestamp               Color   Confidence  Price
2024-01-01T15:00:00Z   green   0.87        $46.25
2024-01-01T16:00:00Z   green   0.82        $46.45
2024-01-01T17:00:00Z   red     0.74        $46.12
```

**Sample Daily Predictions:**
```
Timestamp               Color   Confidence  Price
2024-01-02T00:00:00Z   green   0.91        $47.80
2024-01-03T00:00:00Z   red     0.68        $46.90
2024-01-04T00:00:00Z   green   0.85        $48.20
```

## 🚨 Error Handling

The generator includes comprehensive error handling:

- **API Failures**: Graceful fallback with informative messages
- **Network Issues**: Retry logic with exponential backoff
- **Invalid Data**: Data validation and sanitization
- **File System**: Directory creation and permission checks

## 🔗 Integration Examples

**Automated Pipeline:**
```bash
#!/bin/bash
# Daily prediction generation script

# Set API key
export COINDESK_API_KEY="your_key_here"

# Generate new predictions
node prediction-generator.js $COINDESK_API_KEY

# Start miner with new predictions
./miner_wallet_hotkey
```

**Cron Job Setup:**
```bash
# Generate predictions every 6 hours
0 */6 * * * cd /path/to/candles && node prediction-generator.js $COINDESK_API_KEY
```

## 📝 License

MIT License - See LICENSE file for details.

---

**Ready to generate intelligent predictions for your Candles Subnet miner? 🕯️📊**
