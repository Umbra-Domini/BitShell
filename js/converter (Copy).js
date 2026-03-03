const Converter = (() => {
  'use strict';

  const InputType = {
    BINARY: 'binary',
    HEX: 'hex',
    DECIMAL: 'decimal',
    TEXT: 'text',
    BASE64: 'base64',
    INVALID: 'invalid'
  };

  function groupBinary(binary, groupSize) {
    if (!groupSize || groupSize === 'none') return binary;
    
    // Remove existing spaces and prefixes
    const clean = binary.replace(/\s+/g, '').replace(/^0[bB]/, '');
    
    // Handle negative sign
    const isNegative = clean.startsWith('-');
    const digits = isNegative ? clean.substring(1) : clean;
    
    // Handle fractional parts
    if (digits.includes('.')) {
      const [intPart, fracPart] = digits.split('.');
      
      // Group integer part from right to left
      let groupedInt = '';
      for (let i = intPart.length - 1; i >= 0; i -= groupSize) {
        const start = Math.max(0, i - groupSize + 1);
        const group = intPart.substring(start, i + 1);
        groupedInt = group + (groupedInt ? ' ' + groupedInt : '');
      }
      
      // Group fractional part from left to right
      let groupedFrac = '';
      for (let i = 0; i < fracPart.length; i += groupSize) {
        const group = fracPart.substring(i, Math.min(i + groupSize, fracPart.length));
        groupedFrac += (groupedFrac ? ' ' : '') + group;
      }
      
      return (isNegative ? '-' : '') + groupedInt + '.' + groupedFrac;
    }
    
    // Group from right to left for integers
    let grouped = '';
    for (let i = digits.length - 1; i >= 0; i -= groupSize) {
      const start = Math.max(0, i - groupSize + 1);
      const group = digits.substring(start, i + 1);
      grouped = group + (grouped ? ' ' + grouped : '');
    }
    
    return (isNegative ? '-' : '') + grouped;
  }

  function groupHex(hex, groupSize) {
    if (!groupSize || groupSize === 'none') return hex;
    
    // Don't group IPv4 hex format (e.g., C0.0C.0C.0C) - it already has its own separator
    // IPv4 hex has exactly 4 groups of 2 hex digits separated by dots
    if (/^[0-9A-Fa-f]{2}\.[0-9A-Fa-f]{2}\.[0-9A-Fa-f]{2}\.[0-9A-Fa-f]{2}$/.test(hex)) {
      return hex;
    }
    
    // Don't group IPv6 hex format (e.g., 2001:0DB8:...) - it already has its own separator
    if (hex.includes(':')) {
      return hex;
    }
    
    // Remove existing spaces and prefixes
    const clean = hex.replace(/\s+/g, '').replace(/^0[xX]/, '').replace(/^-0[xX]/, '');
    
    // Handle negative sign
    const isNegative = hex.startsWith('-');
    const digits = isNegative ? clean : clean;
    
    // Handle fractional parts (for actual decimal fractions, not IPv4)
    if (digits.includes('.')) {
      const [intPart, fracPart] = digits.split('.');
      
      // Convert groupSize from bytes to hex chars (1 byte = 2 hex chars)
      const hexGroupSize = parseInt(groupSize) * 2;
      
      // Group integer part from left to right
      let groupedInt = '';
      for (let i = 0; i < intPart.length; i += hexGroupSize) {
        const group = intPart.substring(i, Math.min(i + hexGroupSize, intPart.length));
        groupedInt += (groupedInt ? ' ' : '') + group;
      }
      
      // Group fractional part from left to right
      let groupedFrac = '';
      for (let i = 0; i < fracPart.length; i += hexGroupSize) {
        const group = fracPart.substring(i, Math.min(i + hexGroupSize, fracPart.length));
        groupedFrac += (groupedFrac ? ' ' : '') + group;
      }
      
      return (isNegative ? '-' : '') + groupedInt.trim() + '.' + groupedFrac.trim();
    }
    
    // Convert groupSize from bytes to hex chars (1 byte = 2 hex chars)
    const hexGroupSize = parseInt(groupSize) * 2;
    
    // Group from left to right for hex values
    let grouped = '';
    for (let i = 0; i < digits.length; i += hexGroupSize) {
      const group = digits.substring(i, Math.min(i + hexGroupSize, digits.length));
      grouped += (grouped ? ' ' : '') + group;
    }
    
    return (isNegative ? '-' : '') + grouped.trim();
  }

  function isIPv4(input) {
    const trimmed = input.trim();
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) return false;

    const parts = trimmed.split('.');
    return parts.length === 4 && parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255;
    });
  }

  function isIPv6(input) {
    const trimmed = input.trim();
    if (!/:/.test(trimmed)) return false;

    const ipv6Pattern = /^([0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}$/;
    const compressedPattern = /^([0-9A-Fa-f]{0,4}:)*::([0-9A-Fa-f]{0,4}:)*[0-9A-Fa-f]{0,4}$/;

    return ipv6Pattern.test(trimmed) || compressedPattern.test(trimmed);
  }

  function expandIPv6(ipv6) {
    const trimmed = ipv6.trim();

    if (!trimmed.includes('::')) {

      return trimmed.split(':').map(block => block.padStart(4, '0')).join(':');
    }

    const parts = trimmed.split('::');
    const left = parts[0] ? parts[0].split(':').filter(p => p) : [];
    const right = parts[1] ? parts[1].split(':').filter(p => p) : [];
    const missing = 8 - left.length - right.length;
    const middle = Array(missing).fill('0000');

    const expandedLeft = left.map(block => block.padStart(4, '0'));
    const expandedRight = right.map(block => block.padStart(4, '0'));

    return [...expandedLeft, ...middle, ...expandedRight].join(':');
  }

  function ipv4ToBinary(ipv4) {
    const parts = ipv4.split('.');
    return parts.map(p => {
      const num = parseInt(p, 10);
      return num.toString(2).padStart(8, '0');
    }).join(' ');
  }

  function ipv4ToHex(ipv4) {
    const parts = ipv4.split('.');
    return parts.map(p => {
      const num = parseInt(p, 10);
      return num.toString(16).toUpperCase().padStart(2, '0');
    }).join('.');
  }

  function ipv4ToDecimal(ipv4) {
    return ipv4;
  }

  function ipv4ToText(ipv4) {
    return ipv4;
  }

  function ipv6ToBinary(ipv6) {
    const expanded = expandIPv6(ipv6);
    const blocks = expanded.split(':');

    const binaryBlocks = blocks.map(block => {
      const value = parseInt(block, 16);
      const binary = value.toString(2).padStart(16, '0');

      return binary.substring(0, 8) + ' ' + binary.substring(8, 16);
    });

    const line1 = binaryBlocks.slice(0, 2).join(' ');
    const line2 = binaryBlocks.slice(2, 4).join(' ');
    const line3 = binaryBlocks.slice(4, 6).join(' ');
    const line4 = binaryBlocks.slice(6, 8).join(' ');

    return line1 + '\n' + line2 + '\n' + line3 + '\n' + line4;
  }

  function ipv6ToHex(ipv6) {
    const expanded = expandIPv6(ipv6);
    // Return uppercase by default, but let popup.js apply case settings
    return expanded.toUpperCase();
  }

  function ipv6ToDecimal(ipv6) {
    const expanded = expandIPv6(ipv6);
    const parts = expanded.split(':');
    return parts.map(p => parseInt(p, 16).toString()).join(':');
  }

  function ipv6ToText(ipv6) {
    return expandIPv6(ipv6);
  }

  function binaryToDecimal(binary) {
    const trimmed = binary.trim();

    if (/\s/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const decimals = parts.map((part, index) => {
        const clean = part.replace(/^0[bB]/, '');
        if (!/^-?[01]+(\.[01]+)?$/.test(clean)) {
          const invalidChar = clean.match(/[^01.\-]/);
          if (invalidChar) {
            throw new Error(`Invalid binary character '${invalidChar[0]}' in group ${index + 1}. Binary only uses 0 and 1`);
          }
          throw new Error(`Invalid binary format in group ${index + 1}`);
        }
        return binaryStringToDecimal(clean);
      });
      return decimals.join(' ');
    }

    const clean = trimmed.replace(/^0[bB]/, '');
    if (!/^-?[01]+(\.[01]+)?$/.test(clean)) {
      const invalidChar = clean.match(/[^01.\-]/);
      if (invalidChar) {
        const position = clean.indexOf(invalidChar[0]) + 1;
        throw new Error(`Invalid binary character '${invalidChar[0]}' at position ${position}. Binary only uses 0 and 1`);
      }
      throw new Error('Invalid binary format');
    }

    return binaryStringToDecimal(clean);
  }

  function binaryStringToDecimal(binary) {

    const isNegative = binary.startsWith('-');
    const cleanBinary = isNegative ? binary.substring(1) : binary;

    if (!cleanBinary.includes('.')) {

      const result = BigInt('0b' + cleanBinary).toString();
      return isNegative ? '-' + result : result;
    }

    const [intPart, fracPart] = cleanBinary.split('.');

    let result = intPart ? parseInt(intPart, 2) : 0;

    if (fracPart) {
      let fracValue = 0;
      for (let i = 0; i < fracPart.length; i++) {
        if (fracPart[i] === '1') {
          fracValue += Math.pow(2, -(i + 1));
        }
      }
      result += fracValue;
    }

    return (isNegative ? '-' : '') + result.toString();
  }

  function binaryToHex(binary) {
    const trimmed = binary.trim();

    if (/\s/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const hexes = parts.map(part => binaryToHexSingle(part));
      return hexes.join(' ');
    }

    return binaryToHexSingle(trimmed);
  }

  function binaryToHexSingle(binary) {
    const clean = binary.replace(/^0[bB]/, '');

    const isNegative = clean.startsWith('-');
    const cleanBinary = isNegative ? clean.substring(1) : clean;

    if (!/^[01]+(\.[01]+)?$/.test(cleanBinary)) {
      throw new Error('Invalid binary format');
    }

    if (cleanBinary.includes('.')) {
      const [intPart, fracPart] = cleanBinary.split('.');

      const paddedInt = intPart.padStart(Math.ceil(intPart.length / 4) * 4, '0');
      let hexInt = '';
      for (let i = 0; i < paddedInt.length; i += 4) {
        const nibble = paddedInt.substring(i, i + 4);
        hexInt += parseInt(nibble, 2).toString(16).toUpperCase();
      }

      const paddedFrac = fracPart.padEnd(Math.ceil(fracPart.length / 4) * 4, '0');
      let hexFrac = '';
      for (let i = 0; i < paddedFrac.length; i += 4) {
        const nibble = paddedFrac.substring(i, i + 4);
        hexFrac += parseInt(nibble, 2).toString(16).toUpperCase();
      }

      return (isNegative ? '-0x' : '0x') + (hexInt || '0') + '.' + hexFrac;
    }

    const padded = cleanBinary.padStart(Math.ceil(cleanBinary.length / 4) * 4, '0');
    let hex = '';
    for (let i = 0; i < padded.length; i += 4) {
      const nibble = padded.substring(i, i + 4);
      hex += parseInt(nibble, 2).toString(16).toUpperCase();
    }

    hex = hex.replace(/^0+/, '') || '0';

    return (isNegative ? '-0x' : '0x') + hex;
  }

  function binaryToText(binary) {
    const clean = binary.trim().replace(/^0[bB]/, '').replace(/\s+/g, '');

    if (clean.startsWith('-')) {
      throw new Error('Negative binary cannot be converted to text');
    }

    if (clean.includes('.')) {
      throw new Error('Binary text conversion requires integer values (no fractional part)');
    }

    if (clean.length % 8 !== 0) {
      throw new Error('Binary length must be multiple of 8 for text conversion');
    }

    const bytes = [];
    for (let i = 0; i < clean.length; i += 8) {
      bytes.push(parseInt(clean.substring(i, i + 8), 2));
    }

    try {
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    } catch (e) {
      throw new Error('Invalid UTF-8 sequence');
    }
  }

  function hexToDecimal(hex) {
    const trimmed = hex.trim();

    if (isIPv6(trimmed)) {
      return ipv6ToDecimal(trimmed);
    }

    if (/\s/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const decimals = parts.map((part, index) => {
        const clean = part.replace(/^0[xX]/, '');
        if (!/^[0-9A-Fa-f]+$/.test(clean)) {
          const invalidChar = clean.match(/[^0-9A-Fa-f]/);
          if (invalidChar) {
            throw new Error(`Invalid hex character '${invalidChar[0]}' in group ${index + 1}. Hex uses 0-9 and A-F`);
          }
          throw new Error(`Invalid hex format in group ${index + 1}`);
        }
        return BigInt('0x' + clean).toString();
      });
      return decimals.join('.');
    }

    const clean = trimmed.replace(/^0[xX]/, '');
    if (!/^[0-9A-Fa-f]+(\.[0-9A-Fa-f]+)?$/.test(clean)) {
      const invalidChar = clean.match(/[^0-9A-Fa-f.]/);
      if (invalidChar) {
        const position = trimmed.indexOf(invalidChar[0]) + 1;
        throw new Error(`Invalid hex character '${invalidChar[0]}' at position ${position}. Hex uses 0-9 and A-F`);
      }
      throw new Error('Invalid hexadecimal format');
    }

    if (clean.includes('.')) {
      const [intPart, fracPart] = clean.split('.');

      const intValue = intPart ? BigInt('0x' + intPart) : BigInt(0);

      let fracValue = 0;
      for (let i = 0; i < fracPart.length; i++) {
        const digitValue = parseInt(fracPart[i], 16);
        fracValue += digitValue * Math.pow(16, -(i + 1));
      }

      return intValue.toString() + (fracValue > 0 ? fracValue.toString().substring(1) : '');
    }

    return BigInt('0x' + clean).toString();
  }

  function hexToBinary(hex) {
    const trimmed = hex.trim();

    if (isIPv6(trimmed)) {
      return ipv6ToBinary(trimmed);
    }

    if (/\s/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const binaries = parts.map(part => hexToBinarySingle(part));
      return binaries.join(' ');
    }

    return hexToBinarySingle(trimmed);
  }

  function hexToBinarySingle(hex) {
    const clean = hex.replace(/^0[xX]/, '');

    if (!/^[0-9A-Fa-f]+(\.[0-9A-Fa-f]+)?$/.test(clean)) {
      throw new Error('Invalid hex format');
    }

    if (clean.includes('.')) {
      const [intPart, fracPart] = clean.split('.');

      let binaryInt = '';
      for (let i = 0; i < intPart.length; i++) {
        const digit = parseInt(intPart[i], 16);
        binaryInt += digit.toString(2).padStart(4, '0');
      }

      let binaryFrac = '';
      for (let i = 0; i < fracPart.length; i++) {
        const digit = parseInt(fracPart[i], 16);
        binaryFrac += digit.toString(2).padStart(4, '0');
      }

      binaryInt = binaryInt.replace(/^0+/, '') || '0';

      return binaryInt + '.' + binaryFrac;
    }

    let binary = '';
    for (let i = 0; i < clean.length; i++) {
      const digit = parseInt(clean[i], 16);
      binary += digit.toString(2).padStart(4, '0');
    }

    binary = binary.replace(/^0+/, '') || '0';

    return binary;
  }

  function hexToText(hex) {
    const trimmed = hex.trim();

    if (isIPv6(trimmed)) {
      return ipv6ToText(trimmed);
    }

    const clean = trimmed.replace(/^0[xX]/, '').replace(/[\s:]/g, '');

    if (clean.length % 2 !== 0) {
      throw new Error('Hex length must be even for text conversion');
    }

    const bytes = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }

    try {
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    } catch (e) {
      throw new Error('Invalid UTF-8 sequence');
    }
  }

  function decimalToBinary(decimal) {
    const trimmed = decimal.toString().trim();

    if (isIPv4(trimmed)) {
      return ipv4ToBinary(trimmed);
    }

    if (/\s/.test(trimmed) && !/^-?\d+\.\d+$/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const binaries = parts.map(part => {
        const num = parseFloat(part);
        if (isNaN(num)) throw new Error('Invalid decimal format');
        return decimalToBinarySingle(num);
      });
      return binaries.join(' ');
    }

    const num = parseFloat(trimmed);
    if (isNaN(num)) throw new Error('Invalid decimal format');

    return decimalToBinarySingle(num);
  }

  function decimalToBinarySingle(num) {

    if (num < 0) {
      return '-' + decimalToBinarySingle(Math.abs(num));
    }

    const intPart = Math.floor(num);
    const fracPart = num - intPart;

    let result = intPart.toString(2);

    if (fracPart > 0) {
      result += '.';
      let frac = fracPart;
      let maxBits = 16; // Limit to 16 bits for reasonable display length

      for (let i = 0; i < maxBits && frac > 0; i++) {
        frac *= 2;
        if (frac >= 1) {
          result += '1';
          frac -= 1;
        } else {
          result += '0';
        }

        // Stop if remaining fraction is negligible
        if (frac < 1e-10) break;
      }
    }

    return result;
  }

  function decimalToHex(decimal) {
    const trimmed = decimal.toString().trim();

    if (isIPv4(trimmed)) {
      return ipv4ToHex(trimmed);
    }

    if (/\s/.test(trimmed) && !/^-?\d+\.\d+$/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const hexes = parts.map(part => {
        return decimalToHexSingle(part);
      });
      return hexes.join(' ');
    }

    return decimalToHexSingle(trimmed);
  }

  function decimalToHexSingle(decimal) {
    const num = parseFloat(decimal);
    if (isNaN(num)) throw new Error('Invalid decimal format');

    if (num < 0) {
      return '-0x' + decimalToHexSingle(Math.abs(num)).replace(/^0[xX]/, '');
    }

    const intPart = Math.floor(num);
    const fracPart = num - intPart;

    let hexInt = intPart.toString(16).toUpperCase();

    if (fracPart > 0) {
      let hexFrac = '';
      let frac = fracPart;
      let maxDigits = 8; // Limit to 8 hex digits for reasonable display

      for (let i = 0; i < maxDigits && frac > 0; i++) {
        frac *= 16;
        const digit = Math.floor(frac);
        hexFrac += digit.toString(16).toUpperCase();
        frac -= digit;

        // Stop if remaining fraction is negligible
        if (frac < 1e-10) break;
      }

      return '0x' + hexInt + '.' + hexFrac;
    }

    return '0x' + hexInt;
  }

  function decimalToText(decimal) {
    const trimmed = decimal.trim();

    if (isIPv4(trimmed)) {
      return ipv4ToText(trimmed);
    }

    if (/\s/.test(trimmed)) {
      const values = trimmed.split(/\s+/).map(v => {
        const num = parseInt(v, 10);
        if (isNaN(num) || num < 0 || num > 255) {
          throw new Error('Byte values must be 0-255');
        }
        return num;
      });

      try {
        return new TextDecoder('utf-8').decode(new Uint8Array(values));
      } catch (e) {
        throw new Error('Invalid UTF-8 sequence');
      }
    }

    const num = parseFloat(trimmed);
    if (isNaN(num) || num < 0) {
      throw new Error('Invalid code point');
    }

    try {
      return String.fromCodePoint(Math.floor(num));
    } catch (e) {
      throw new Error('Invalid Unicode code point');
    }
  }

  function stringToDecimal(decimal) {
    const trimmed = decimal.trim();

    if (isIPv4(trimmed)) {
      return ipv4ToDecimal(trimmed);
    }

    if (/\s/.test(trimmed)) {
      return trimmed;
    }

    // Validate that the entire string is a valid decimal number
    // This regex allows: optional negative sign, digits, optional decimal point with digits
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
      throw new Error('Invalid decimal format');
    }

    const num = parseFloat(trimmed);
    if (isNaN(num)) throw new Error('Invalid decimal format');

    return num.toString();
  }

  function textToHex(text) {

    if (isIPv4(text)) {
      return ipv4ToHex(text);
    }

    if (isIPv6(text)) {
      return ipv6ToHex(text);
    }

    const bytes = new TextEncoder().encode(text);
    return '0x' + Array.from(bytes)
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join('');
  }

  function textToBinary(text) {

    if (isIPv4(text)) {
      return ipv4ToBinary(text);
    }

    if (isIPv6(text)) {
      return ipv6ToBinary(text);
    }

    const bytes = new TextEncoder().encode(text);
    return Array.from(bytes)
      .map(b => b.toString(2).padStart(8, '0'))
      .join(' ');
  }

  function textToDecimal(text) {

    if (isIPv4(text)) {
      return ipv4ToDecimal(text);
    }

    if (isIPv6(text)) {
      return ipv6ToDecimal(text);
    }

    const bytes = new TextEncoder().encode(text);
    return Array.from(bytes).join(' ');
  }

  // Base64 conversion functions
  function textToBase64(text) {
    // Use btoa for simple ASCII, but handle UTF-8 properly
    const bytes = new TextEncoder().encode(text);
    const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  }

  function base64ToText(base64) {
    try {
      // Remove whitespace
      const clean = base64.replace(/\s+/g, '');
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
        throw new Error('Invalid Base64 format: Only characters A-Z, a-z, 0-9, +, / and = are allowed');
      }
      
      const binaryString = atob(clean);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      if (e.message.includes('Invalid Base64')) {
        throw e;
      }
      throw new Error('Invalid Base64 format: ' + e.message);
    }
  }

  function base64ToBinary(base64) {
    const text = base64ToText(base64);
    return textToBinary(text);
  }

  function base64ToHex(base64) {
    const text = base64ToText(base64);
    return textToHex(text);
  }

  function base64ToDecimal(base64) {
    const text = base64ToText(base64);
    return textToDecimal(text);
  }

  function binaryToBase64(binary) {
    const clean = binary.trim().replace(/^0[bB]/, '').replace(/\s+/g, '');

    if (clean.startsWith('-')) {
      throw new Error('Negative binary cannot be converted to Base64');
    }

    if (clean.includes('.')) {
      throw new Error('Binary Base64 conversion requires integer values (no fractional part)');
    }

    if (clean.length % 8 !== 0) {
      throw new Error('Binary length must be multiple of 8 for Base64 conversion');
    }

    const bytes = [];
    for (let i = 0; i < clean.length; i += 8) {
      bytes.push(parseInt(clean.substring(i, i + 8), 2));
    }

    // Convert bytes to binary string for btoa
    const binaryString = String.fromCharCode(...bytes);
    return btoa(binaryString);
  }

  function hexToBase64(hex) {
    const trimmed = hex.trim();

    if (isIPv6(trimmed)) {
      throw new Error('IPv6 addresses cannot be directly converted to Base64');
    }

    const clean = trimmed.replace(/^0[xX]/, '').replace(/[\s:]/g, '');

    if (clean.length % 2 !== 0) {
      throw new Error('Hex length must be even for Base64 conversion');
    }

    const bytes = [];
    for (let i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }

    // Convert bytes to binary string for btoa
    const binaryString = String.fromCharCode(...bytes);
    return btoa(binaryString);
  }

  function decimalToBase64(decimal) {
    const trimmed = decimal.trim();

    if (isIPv4(trimmed)) {
      throw new Error('IPv4 addresses cannot be directly converted to Base64');
    }

    if (/\s/.test(trimmed)) {
      const values = trimmed.split(/\s+/).map(v => {
        const num = parseInt(v, 10);
        if (isNaN(num) || num < 0 || num > 255) {
          throw new Error('Byte values must be 0-255 for Base64 conversion');
        }
        return num;
      });

      // Convert bytes to binary string for btoa
      const binaryString = String.fromCharCode(...values);
      return btoa(binaryString);
    }

    const num = parseFloat(trimmed);
    if (isNaN(num) || num < 0 || num > 255) {
      throw new Error('Value must be 0-255 for Base64 conversion');
    }

    // Single byte
    const binaryString = String.fromCharCode(Math.floor(num));
    return btoa(binaryString);
  }

  function convertAll(input, inputType) {
    const result = {
      binary: { value: '', error: null },
      hex: { value: '', error: null },
      decimal: { value: '', error: null },
      text: { value: '', error: null },
      base64: { value: '', error: null }
    };

    try {
      switch (inputType) {
        case InputType.BINARY: {
          try {
            const dec = binaryToDecimal(input);
            result.binary.value = input.replace(/^0[bB]/, '');
            result.decimal.value = dec;
            result.hex.value = binaryToHex(input);
          } catch (e) {
            throw new Error('Binary conversion failed: ' + e.message);
          }

          try {
            result.text.value = binaryToText(input);
          } catch (e) {
            result.text.error = 'Text: ' + e.message;
          }

          try {
            result.base64.value = binaryToBase64(input);
          } catch (e) {
            result.base64.error = 'Base64: ' + e.message;
          }
          break;
        }

        case InputType.HEX: {
          try {
            const dec = hexToDecimal(input);
            result.hex.value = input.replace(/^0[xX]/, '').toUpperCase();
            result.decimal.value = dec;
            result.binary.value = hexToBinary(input);
          } catch (e) {
            throw new Error('Hex conversion failed: ' + e.message);
          }

          try {
            result.text.value = hexToText(input);
          } catch (e) {
            result.text.error = 'Text: ' + e.message;
          }

          try {
            result.base64.value = hexToBase64(input);
          } catch (e) {
            result.base64.error = 'Base64: ' + e.message;
          }
          break;
        }

        case InputType.DECIMAL: {
          try {
            const dec = stringToDecimal(input);
            result.decimal.value = dec;
            result.binary.value = decimalToBinary(dec);
            result.hex.value = decimalToHex(dec);
          } catch (e) {
            throw new Error('Decimal conversion failed: ' + e.message);
          }

          try {
            result.text.value = decimalToText(input);
          } catch (e) {
            result.text.error = 'Text: ' + e.message;
          }

          try {
            result.base64.value = decimalToBase64(input);
          } catch (e) {
            result.base64.error = 'Base64: ' + e.message;
          }
          break;
        }

        case InputType.TEXT: {
          result.text.value = input;
          
          try {
            result.hex.value = textToHex(input);
          } catch (e) {
            result.hex.error = 'Hex: ' + e.message;
          }

          try {
            result.binary.value = textToBinary(input);
          } catch (e) {
            result.binary.error = 'Binary: ' + e.message;
          }

          try {
            result.decimal.value = textToDecimal(input);
          } catch (e) {
            result.decimal.error = 'Decimal: ' + e.message;
          }

          try {
            result.base64.value = textToBase64(input);
          } catch (e) {
            result.base64.error = 'Base64: ' + e.message;
          }
          break;
        }

        case InputType.BASE64: {
          try {
            result.base64.value = input;
            result.text.value = base64ToText(input);
            result.hex.value = base64ToHex(input);
            result.binary.value = base64ToBinary(input);
            result.decimal.value = base64ToDecimal(input);
          } catch (e) {
            throw new Error('Base64 decode failed: ' + e.message);
          }
          break;
        }

        default:
          throw new Error('Invalid input type selected');
      }
    } catch (e) {
      throw e;
    }

    return result;
  }

  function convertTo(input, inputType, targetType) {
    const results = convertAll(input, inputType);
    return results[targetType];
  }

  return {
    InputType,
    convertAll,
    convertTo,
    isIPv4,
    isIPv6,
    groupBinary,
    groupHex
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Converter;
}