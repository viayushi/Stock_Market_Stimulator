import { 
  formatSymbolForAPI, 
  validateSymbolFormat, 
  getDisplaySymbol, 
  parseDisplaySymbol 
} from '../services/marketService';

// Test symbol formatting functions
export const testSymbolFormatting = () => {
  console.log('Testing Symbol Formatting Functions...');
  
  // Test formatSymbolForAPI
  console.log('formatSymbolForAPI tests:');
  console.log('RELIANCE ->', formatSymbolForAPI('RELIANCE')); // Should return NSE:RELIANCE
  console.log('NSE:TCS ->', formatSymbolForAPI('NSE:TCS')); // Should return NSE:TCS
  console.log('BSE:INFY ->', formatSymbolForAPI('BSE:INFY')); // Should return BSE:INFY
  
  // Test validateSymbolFormat
  console.log('\nvalidateSymbolFormat tests:');
  console.log('NSE:RELIANCE ->', validateSymbolFormat('NSE:RELIANCE')); // Should return true
  console.log('BSE:TCS ->', validateSymbolFormat('BSE:TCS')); // Should return true
  console.log('RELIANCE ->', validateSymbolFormat('RELIANCE')); // Should return false
  console.log('NSE: ->', validateSymbolFormat('NSE:')); // Should return false
  console.log('INVALID ->', validateSymbolFormat('INVALID')); // Should return false
  
  // Test getDisplaySymbol
  console.log('\ngetDisplaySymbol tests:');
  console.log('RELIANCE, NSE ->', getDisplaySymbol('RELIANCE', 'NSE')); // Should return NSE:RELIANCE
  console.log('TCS, BSE ->', getDisplaySymbol('TCS', 'BSE')); // Should return BSE:TCS
  
  // Test parseDisplaySymbol
  console.log('\nparseDisplaySymbol tests:');
  console.log('NSE:RELIANCE ->', parseDisplaySymbol('NSE:RELIANCE')); // Should return {exchange: 'NSE', symbol: 'RELIANCE'}
  console.log('BSE:TCS ->', parseDisplaySymbol('BSE:TCS')); // Should return {exchange: 'BSE', symbol: 'TCS'}
  console.log('INVALID ->', parseDisplaySymbol('INVALID')); // Should return null
  
  console.log('\nSymbol formatting tests completed!');
};

// Test popular stock symbols
export const testPopularStocks = () => {
  const popularStocks = [
    'RELIANCE', 'SBIN', 'ITC', 'ICICIBANK', 'AXISBANK', 'BAJFINANCE', 
    'MARUTI', 'LT', 'ULTRACEMCO', 'KOTAKBANK', 'TCS', 'INFY', 'HDFCBANK', 
    'WIPRO', 'TATAMOTORS', 'HINDUNILVR', 'BHARTIARTL', 'ASIANPAINT', 
    'HCLTECH', 'SUNPHARMA', 'GAIL', 'ONGC', 'COALINDIA', 'POWERGRID'
  ];
  
  console.log('\nTesting Popular Stock Symbols:');
  popularStocks.forEach(symbol => {
    const formatted = formatSymbolForAPI(symbol);
    const isValid = validateSymbolFormat(formatted);
    console.log(`${symbol} -> ${formatted} (valid: ${isValid})`);
  });
}; 