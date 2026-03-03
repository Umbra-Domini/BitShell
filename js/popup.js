(function() {
  'use strict';

  let currentInputType = 'binary';
  let history = [];
  let isHistoryOpen = false;
  let isSettingsOpen = false;
  
  // Settings with defaults
  let settings = {
    fontSize: 13,
    showPrefixes: false,
    hexCase: 'upper',
    binaryGrouping: 'none',
    hexGrouping: 'none',
    showLeadingZeros: false,
    historyTracking: true,
    showBitCounter: true,
    showByteCounter: true
  };

  const inputField = document.getElementById('input');
  const charCount = document.getElementById('char-count');
  const bitCount = document.getElementById('bit-count');
  const byteCount = document.getElementById('byte-count');
  const detectionBadge = document.getElementById('detection-badge');
  const inputHint = document.getElementById('input-hint');
  const statusMessage = document.getElementById('status-message');

  const binaryOutput = document.getElementById('binary-output');
  const hexOutput = document.getElementById('hex-output');
  const decimalOutput = document.getElementById('decimal-output');
  const textOutput = document.getElementById('text-output');
  const base64Output = document.getElementById('base64-output');

  const typeBtns = document.querySelectorAll('.type-btn');
  const clearBtn = document.getElementById('clear-btn');
  const copyAllBtn = document.getElementById('copy-all-btn');
  const historyToggle = document.getElementById('history-toggle');
  const historySidebar = document.getElementById('history-sidebar');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');

  const settingsToggle = document.getElementById('settings-toggle');
  const settingsSidebar = document.getElementById('settings-sidebar');
  const closeSettingsBtn = document.getElementById('close-settings');
  const fontDecrease = document.getElementById('font-decrease');
  const fontIncrease = document.getElementById('font-increase');
  const fontSizeValue = document.getElementById('font-size-value');
  const showPrefixesToggle = document.getElementById('show-prefixes-toggle');
  const showPrefixesStatus = document.getElementById('show-prefixes-status');
  const hexCaseRadios = document.querySelectorAll('input[name="hex-case"]');
  const binaryGroupingRadios = document.querySelectorAll('input[name="binary-grouping"]');
  const hexGroupingRadios = document.querySelectorAll('input[name="hex-grouping"]');
  const showLeadingZerosToggle = document.getElementById('show-leading-zeros-toggle');
  const showLeadingZerosStatus = document.getElementById('show-leading-zeros-status');
  const showBitCounterToggle = document.getElementById('show-bit-counter-toggle');
  const showBitCounterStatus = document.getElementById('show-bit-counter-status');
  const showByteCounterToggle = document.getElementById('show-byte-counter-toggle');
  const showByteCounterStatus = document.getElementById('show-byte-counter-status');
  const historyTrackingToggle = document.getElementById('history-tracking-toggle');
  const historyTrackingStatus = document.getElementById('history-tracking-status');
  const resetSettingsBtn = document.getElementById('reset-settings');

  const closeDot = document.querySelector('.dot.close');
  const minimizeDot = document.querySelector('.dot.minimize');
  const maximizeDot = document.querySelector('.dot.maximize');
  const popoutBtn = document.getElementById('popout-btn');

  const hints = {
    binary: {
      icon: '💡',
      text: 'Enter binary digits (0 and 1 only)',
      placeholder: 'Enter binary value (e.g., 1010, 11110000)...'
    },
    hex: {
      icon: '💡',
      text: 'Enter hexadecimal (0-9, A-F)',
      placeholder: 'Enter hex value (e.g., FF, DEADBEEF, A3F2)...'
    },
    decimal: {
      icon: '💡',
      text: 'Enter decimal numbers (integers or floats)',
      placeholder: 'Enter decimal value (e.g., 255, 10.5, 192.168.1.1)...'
    },
    text: {
      icon: '💡',
      text: 'Enter any text (will be converted to UTF-8)',
      placeholder: 'Enter text to convert...'
    },
    base64: {
      icon: '💡',
      text: 'Enter Base64 encoded text',
      placeholder: 'Enter Base64 value (e.g., SGVsbG8gV29ybGQ=)...'
    }
  };

  function init() {
    loadHistory();
    loadSettings();
    setupEventListeners();
    updateHint();
    applySettings();

    chrome.storage.local.get(['pendingInput'], (result) => {
      if (result.pendingInput) {
        inputField.value = result.pendingInput;
        inputField.focus();
        updateCharCount();
        performConversion();
        chrome.storage.local.remove('pendingInput');
      } else {
        // Auto-focus input when extension opens normally
        setTimeout(() => {
          inputField.focus();
        }, 100);
      }
    });
  }

  function setupEventListeners() {

    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        selectInputType(btn.dataset.type);
      });
    });

    inputField.addEventListener('input', () => {
      updateCharCount();
      detectSpecialFormat();
      performConversion();
    });

    clearBtn.addEventListener('click', clearInput);
    
    copyAllBtn.addEventListener('click', copyAllFormats);

    historyToggle.addEventListener('click', toggleHistory);

    clearHistoryBtn.addEventListener('click', confirmClearHistory);

    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => copyToClipboard(btn));
    });

    closeDot.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'closeWindow' });
    });

    minimizeDot.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'minimizeWindow' });
    });

    maximizeDot.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'maximizeWindow' });
    });

    popoutBtn.addEventListener('click', popOut);

    // Settings listeners
    settingsToggle.addEventListener('click', toggleSettings);
    closeSettingsBtn.addEventListener('click', toggleSettings);
    
    fontDecrease.addEventListener('click', () => {
      if (settings.fontSize > 10) {
        settings.fontSize--;
        applySettings();
        saveSettings();
        showTempStatus('Settings updated');
      }
    });

    fontIncrease.addEventListener('click', () => {
      if (settings.fontSize < 20) {
        settings.fontSize++;
        applySettings();
        saveSettings();
        showTempStatus('Settings updated');
      }
    });

    showPrefixesToggle.addEventListener('change', (e) => {
      settings.showPrefixes = e.target.checked;
      showPrefixesStatus.textContent = settings.showPrefixes ? 'Enabled' : 'Disabled';
      saveSettings();
      performConversion();
      showTempStatus('Settings updated');
    });

    hexCaseRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        settings.hexCase = e.target.value;
        saveSettings();
        performConversion();
        showTempStatus('Settings updated');
      });
    });

    binaryGroupingRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        settings.binaryGrouping = e.target.value;
        saveSettings();
        performConversion();
        showTempStatus('Settings updated');
      });
    });

    hexGroupingRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        settings.hexGrouping = e.target.value;
        saveSettings();
        performConversion();
        showTempStatus('Settings updated');
      });
    });

    showLeadingZerosToggle.addEventListener('change', (e) => {
      settings.showLeadingZeros = e.target.checked;
      showLeadingZerosStatus.textContent = settings.showLeadingZeros ? 'Enabled' : 'Disabled';
      saveSettings();
      performConversion();
      showTempStatus('Settings updated');
    });

    showBitCounterToggle.addEventListener('change', (e) => {
      settings.showBitCounter = e.target.checked;
      showBitCounterStatus.textContent = settings.showBitCounter ? 'Enabled' : 'Disabled';
      saveSettings();
      updateByteCount(); // Refresh the bit/byte display
      showTempStatus('Settings updated');
    });

    showByteCounterToggle.addEventListener('change', (e) => {
      settings.showByteCounter = e.target.checked;
      showByteCounterStatus.textContent = settings.showByteCounter ? 'Enabled' : 'Disabled';
      saveSettings();
      updateByteCount(); // Refresh the bit/byte display
      showTempStatus('Settings updated');
    });

    historyTrackingToggle.addEventListener('change', (e) => {
      settings.historyTracking = e.target.checked;
      historyTrackingStatus.textContent = settings.historyTracking ? 'Enabled' : 'Disabled';
      saveSettings();
      showTempStatus('Settings updated');
    });

    resetSettingsBtn.addEventListener('click', resetSettings);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K - Clear input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearInput();
      }
      
      // Ctrl/Cmd + Enter - Copy all
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        copyAllFormats();
      }
      
      // Ctrl/Cmd + H - Toggle history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        toggleHistory();
      }
      
      // Ctrl/Cmd + , - Toggle settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }
      
      // Escape - Close sidebars
      if (e.key === 'Escape') {
        if (isHistoryOpen) {
          toggleHistory();
        }
        if (isSettingsOpen) {
          toggleSettings();
        }
      }
    });

    // Click outside to close history sidebar
    document.addEventListener('click', (e) => {
      if (isHistoryOpen) {
        // Check if click is outside the history sidebar and not on the history toggle button
        const clickedInsideHistory = historySidebar.contains(e.target);
        const clickedHistoryToggle = historyToggle.contains(e.target);
        
        if (!clickedInsideHistory && !clickedHistoryToggle) {
          toggleHistory();
        }
      }
    });
  }

  function detectSpecialFormat() {
    const input = inputField.value.trim();

    if (!input) {
      hideDetectionBadge();
      return false;
    }

    if (Converter.isIPv4(input)) {
      showDetectionBadge('IPv4 Detected');
      return true;
    }

    if (Converter.isIPv6(input)) {
      showDetectionBadge('IPv6 Detected');
      return true;
    }

    hideDetectionBadge();
    return false;
  }

  function showDetectionBadge(text) {
    detectionBadge.textContent = text;
    detectionBadge.classList.add('show');
  }

  function hideDetectionBadge() {
    detectionBadge.classList.remove('show');
  }

  function selectInputType(type) {
    currentInputType = type;

    typeBtns.forEach(btn => {
      if (btn.dataset.type === type) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateHint();

    if (inputField.value.trim()) {
      performConversion();
      updateByteCount(); // Update bit/byte counter when switching input types
    }
  }

  function updateHint() {
    const hint = hints[currentInputType];
    inputHint.querySelector('.hint-icon').textContent = hint.icon;
    inputHint.querySelector('.hint-text').textContent = hint.text;
    inputField.placeholder = hint.placeholder;
  }

  function updateCharCount() {
    const length = inputField.value.length;
    charCount.textContent = `${length.toLocaleString()} / 100,000 chars`;

    if (length > 90000) {
      charCount.classList.add('danger');
      charCount.classList.remove('warning');
    } else if (length > 75000) {
      charCount.classList.add('warning');
      charCount.classList.remove('danger');
    } else {
      charCount.classList.remove('warning', 'danger');
    }

    // Update byte count
    updateByteCount();
  }

  function updateByteCount() {
    const input = inputField.value.trim();
    
    if (!input) {
      bitCount.textContent = '0 bits';
      byteCount.textContent = '0 bytes';
      // Apply visibility settings even when empty
      bitCount.style.display = settings.showBitCounter ? '' : 'none';
      byteCount.style.display = settings.showByteCounter ? '' : 'none';
      return;
    }

    let bytes = 0;
    let bits = 0;

    try {
      // Check for IP addresses first (they have fixed sizes)
      if (Converter.isIPv4(input)) {
        // IPv4 is always 32 bits / 4 bytes
        bits = 32;
        bytes = 4;
      } else if (Converter.isIPv6(input)) {
        // IPv6 is always 128 bits / 16 bytes
        bits = 128;
        bytes = 16;
      } else {
        // Not an IP address, use type-specific logic
        switch (currentInputType) {
          case 'text':
            // Calculate UTF-8 byte size for text
            bytes = new Blob([input]).size;
            bits = bytes * 8;
            break;
          
          case 'binary':
            // Remove spaces and count bits, then convert to bytes
            const binaryOnly = input.replace(/\s+/g, '').replace(/^0[bB]/, '').replace(/^-/, '');
            if (/^[01]+$/.test(binaryOnly)) {
              bits = binaryOnly.length;
              bytes = Math.ceil(bits / 8);
            } else if (/^[01]+\.[01]+$/.test(binaryOnly)) {
              // Fractional binary — count only the integer part bits
              const intBits = binaryOnly.split('.')[0].length;
              bits = intBits;
              bytes = Math.ceil(bits / 8);
            } else {
              bytes = new Blob([input]).size;
              bits = bytes * 8;
            }
            break;
          
          case 'hex':
            // Remove spaces and 0x prefix, count hex digits
            const hexOnly = input.replace(/\s+/g, '').replace(/^0x/i, '').replace(/^-/, '');
            if (/^[0-9a-fA-F]+$/.test(hexOnly)) {
              bits = hexOnly.length * 4; // Each hex digit = 4 bits
              bytes = Math.ceil(hexOnly.length / 2); // Round up - computers allocate whole bytes
            } else {
              bytes = new Blob([input]).size; // Fallback to text byte count
              bits = bytes * 8;
            }
            break;
          
          case 'decimal':
            // Calculate actual byte size from the decimal value(s)
            if (/\s/.test(input)) {
              // Space-separated bytes — count the values
              const parts = input.trim().split(/\s+/);
              const allInts = parts.every(p => {
                const n = parseInt(p, 10);
                return !isNaN(n) && Number.isInteger(parseFloat(p));
              });
              if (allInts) {
                bytes = parts.length;
                bits = bytes * 8;
              } else {
                bytes = new Blob([input]).size;
                bits = bytes * 8;
              }
            } else {
              const num = parseFloat(input);
              if (!isNaN(num)) {
                // Use absolute integer part to determine byte size (works for negatives and floats)
                const absInt = Math.abs(Math.floor(num));
                if (absInt <= 0xFF) { bytes = 1; }
                else if (absInt <= 0xFFFF) { bytes = 2; }
                else if (absInt <= 0xFFFFFF) { bytes = 3; }
                else if (absInt <= 0xFFFFFFFF) { bytes = 4; }
                else { bytes = Math.ceil(Math.log2(absInt + 1) / 8); }
                bits = bytes * 8;
              } else {
                bytes = new Blob([input]).size;
                bits = bytes * 8;
              }
            }
            break;
          
          case 'base64':
            // Calculate decoded byte size for base64
            try {
              const decoded = atob(input.replace(/\s+/g, ''));
              bytes = decoded.length;
              bits = bytes * 8;
            } catch {
              bytes = new Blob([input]).size; // Fallback to text byte count
              bits = bytes * 8;
            }
            break;
          
          default:
            bytes = new Blob([input]).size;
            bits = bytes * 8;
        }
      }
    } catch {
      bytes = new Blob([input]).size;
      bits = bytes * 8;
    }

    // Update bit counter
    bitCount.textContent = `${bits.toLocaleString()} bit${bits === 1 ? '' : 's'}`;
    
    // Update byte counter
    byteCount.textContent = `${bytes.toLocaleString()} byte${bytes === 1 ? '' : 's'}`;
    
    // Apply visibility settings
    bitCount.style.display = settings.showBitCounter ? '' : 'none';
    byteCount.style.display = settings.showByteCounter ? '' : 'none';
  }

  function performConversion() {
    const input = inputField.value.trim();

    if (!input) {
      clearOutputs();
      hideStatus();
      return;
    }

    try {
      let actualInputType = currentInputType;

      if (Converter.isIPv4(input) || Converter.isIPv6(input)) {
        actualInputType = 'text';
      }

      const results = Converter.convertAll(input, actualInputType);

      // Apply formatting settings to binary output
      if (results.binary.value) {
        let binaryValue = results.binary.value;
        
        // Apply binary grouping
        if (settings.binaryGrouping !== 'none') {
          const groupSize = parseInt(settings.binaryGrouping);
          binaryValue = Converter.groupBinary(binaryValue, groupSize);
        }
        
        // Add prefix if enabled (works for all values including IPs)
        if (settings.showPrefixes) {
          // For IPv4, add 0b to each octet
          if (Converter.isIPv4(input)) {
            const parts = binaryValue.split(' ');
            binaryValue = parts.map(part => '0b' + part).join(' ');
          }
          // For IPv6, handle multiline format
          else if (Converter.isIPv6(input) && binaryValue.includes('\n')) {
            const lines = binaryValue.split('\n');
            binaryValue = lines.map(line => {
              const parts = line.split(' ');
              return parts.map(part => part ? '0b' + part : part).join(' ');
            }).join('\n');
          }
          // For other values, add single 0b prefix
          else {
            if (binaryValue.startsWith('-')) {
              binaryValue = '-0b' + binaryValue.substring(1);
            } else {
              binaryValue = '0b' + binaryValue;
            }
          }
        }
        
        // Handle IPv6 line breaks setting
        if (!settings.ipv6LineBreaks && Converter.isIPv6(input)) {
          binaryValue = binaryValue.replace(/\n/g, ' ');
        }
        
        results.binary.value = binaryValue;
      }

      // Apply formatting settings to hex output
      if (results.hex.value) {
        let hexValue = results.hex.value;
        
        // Remove existing prefix for processing
        const hasPrefix = hexValue.startsWith('0x') || hexValue.startsWith('0X') || 
                         hexValue.startsWith('-0x') || hexValue.startsWith('-0X');
        const isNegative = hexValue.startsWith('-');
        if (hasPrefix) {
          hexValue = hexValue.replace(/^-?0[xX]/, '');
          if (isNegative && !hexValue.startsWith('-')) {
            hexValue = '-' + hexValue;
          }
        }
        
        // Apply hex case
        if (settings.hexCase === 'lower') {
          hexValue = hexValue.toLowerCase();
        } else {
          hexValue = hexValue.toUpperCase();
        }
        
        // Apply hex grouping
        if (settings.hexGrouping !== 'none') {
          const actualHex = isNegative ? hexValue.substring(1) : hexValue;
          const grouped = Converter.groupHex(actualHex, settings.hexGrouping);
          hexValue = isNegative ? '-' + grouped : grouped;
        }
        
        // Add prefix if enabled
        if (settings.showPrefixes) {
          // For IPv4, add prefix to each octet
          if (Converter.isIPv4(input)) {
            const parts = hexValue.split('.');
            const prefix = '0x';
            hexValue = parts.map(part => prefix + part).join('.');
          } 
          // For other values, add single prefix
          else {
            const prefix = '0x';
            if (hexValue.startsWith('-')) {
              hexValue = '-' + prefix + hexValue.substring(1);
            } else {
              hexValue = prefix + hexValue;
            }
          }
        }
        
        results.hex.value = hexValue;
      }

      // Apply leading zeros setting (for hex and binary)
      if (settings.showLeadingZeros && !Converter.isIPv4(input) && !Converter.isIPv6(input)) {
        // For binary: pad to grouping size (4, 8, or 16 bits)
        if (results.binary.value) {
          const isNeg = results.binary.value.startsWith('-');
          let binVal = results.binary.value.replace(/^-/, '').replace(/^0b/i, '').replace(/\s+/g, '');
          
          // Determine padding size based on binary grouping
          let paddingSize = 8; // default to byte
          if (settings.binaryGrouping !== 'none') {
            paddingSize = parseInt(settings.binaryGrouping);
          }
          
          // Only pad the integer part — keep fractional part intact
          if (binVal.includes('.')) {
            const [intPart, fracPart] = binVal.split('.');
            const targetLength = Math.ceil(intPart.length / paddingSize) * paddingSize;
            binVal = intPart.padStart(targetLength, '0') + '.' + fracPart;
          } else {
            const targetLength = Math.ceil(binVal.length / paddingSize) * paddingSize;
            binVal = binVal.padStart(targetLength, '0');
          }
          
          // Re-apply grouping
          if (settings.binaryGrouping !== 'none') {
            binVal = Converter.groupBinary(binVal, parseInt(settings.binaryGrouping));
          }
          
          const prefix = settings.showPrefixes ? '0b' : '';
          results.binary.value = (isNeg ? '-' : '') + prefix + binVal;
        }
        
        // For hex: pad to nearest byte (2 hex chars)
        if (results.hex.value && !results.hex.value.includes('.')) {
          let hexVal = results.hex.value.replace(/^-?0x/i, '').replace(/\s+/g, '');
          const isNeg = results.hex.value.startsWith('-');
          const targetLength = Math.ceil(hexVal.length / 2) * 2;
          hexVal = hexVal.padStart(targetLength, '0');
          
          // Apply case
          hexVal = settings.hexCase === 'lower' ? hexVal.toLowerCase() : hexVal.toUpperCase();
          
          // Re-apply grouping
          if (settings.hexGrouping !== 'none') {
            hexVal = Converter.groupHex(hexVal, settings.hexGrouping);
          }
          
          const prefix = settings.showPrefixes ? '0x' : '';
          results.hex.value = (isNeg ? '-' : '') + prefix + hexVal;
        }
      }

      updateOutput(binaryOutput, results.binary);
      updateOutput(hexOutput, results.hex);
      updateOutput(decimalOutput, results.decimal);
      updateOutput(textOutput, results.text);
      updateOutput(base64Output, results.base64);

      // Update scroll indicators
      updateScrollIndicators();

      hideStatus();
      
      // Show counters when conversion succeeds (respecting user settings)
      if (settings.showBitCounter) {
        bitCount.style.display = '';
      }
      if (settings.showByteCounter) {
        byteCount.style.display = '';
      }
    } catch (error) {
      const suggestions = detectPossibleFormats(inputField.value.trim());
      let errorMsg = error.message;
      if (suggestions.length > 0) {
        errorMsg += ` <span class="format-suggestion">(This looks like ${suggestions.join(' or ')})</span>`;
      }
      showStatus(errorMsg, true);
      
      // Hide counters when there's an error
      bitCount.style.display = 'none';
      byteCount.style.display = 'none';
    }
  }

  function detectPossibleFormats(input) {
    if (!input) return [];
    
    const suggestions = [];
    const cleanInput = input.replace(/\s+/g, '');
    
    // Check for binary (only 0 and 1) - most specific, check first
    if (/^[01]+$/.test(cleanInput)) {
      if (currentInputType !== 'binary') {
        suggestions.push('Binary');
      }
    }
    
    // Check for decimal (numbers, dots, commas)
    if (/^-?[\d.,]+$/.test(cleanInput)) {
      if (currentInputType !== 'decimal') {
        suggestions.push('Decimal');
      }
    }
    
    // Check for hex (0-9, A-F) - comes after decimal since numbers could be both
    // Also matches fractional hex like A.C or 3F2.19
    if (/^[0-9a-fA-F]+(\.[0-9a-fA-F]+)?$/.test(cleanInput) || /^0x[0-9a-fA-F]+(\.[0-9a-fA-F]+)?$/i.test(cleanInput)) {
      if (currentInputType !== 'hex') {
        suggestions.push('Hex');
      }
    }
    
    // Check for base64 (alphanumeric + / + = padding)
    if (/^[A-Za-z0-9+/]+=*$/.test(cleanInput)) {
      if (currentInputType !== 'base64') {
        // Only suggest base64 if it's properly padded or could be valid
        if (cleanInput.length % 4 === 0 || cleanInput.includes('+') || cleanInput.includes('/') || cleanInput.includes('=')) {
          suggestions.push('Base64');
        }
      }
    }
    
    // Check for text - suggest if it contains letters, but not if it looks like valid hex
    if (/[a-zA-Z]/.test(input)) {
      if (currentInputType !== 'text') {
        // Don't suggest text if it looks like a valid hex value (with optional fraction)
        const looksLikeHex = /^[0-9a-fA-F]+(\.[0-9a-fA-F]+)?$/.test(cleanInput) ||
                             /^0x[0-9a-fA-F]+(\.[0-9a-fA-F]+)?$/i.test(cleanInput);
        if (!looksLikeHex) {
          suggestions.push('Text');
        }
      }
    }
    
    return suggestions;
  }

  function updateOutput(element, result) {
    if (result.error) {
      element.textContent = result.error;
      element.classList.add('error');
      element.classList.remove('empty');
    } else if (result.value) {
      element.textContent = result.value;
      element.classList.remove('error', 'empty');
    } else {
      element.textContent = 'No input';
      element.classList.add('empty');
      element.classList.remove('error');
    }
  }

  function clearOutputs() {
    [binaryOutput, hexOutput, decimalOutput, textOutput, base64Output].forEach(output => {
      output.textContent = 'No input';
      output.classList.add('empty');
      output.classList.remove('error');
    });
    updateScrollIndicators();
    
    // Hide counters when no input
    bitCount.style.display = 'none';
    byteCount.style.display = 'none';
  }

  function showStatus(message, isError = false) {
    statusMessage.innerHTML = message;
    statusMessage.classList.add('show');
    if (isError) {
      statusMessage.classList.add('error');
    } else {
      statusMessage.classList.remove('error');
    }
  }

  function hideStatus() {
    statusMessage.classList.remove('show');
  }

  function showTempStatus(message, isError = false) {
    showStatus(message, isError);
    setTimeout(() => hideStatus(), 3000);
  }

  function copyToClipboard(button) {
    const targetId = button.dataset.target;
    const targetElement = document.getElementById(targetId);
    const text = targetElement.textContent;

    if (text && !targetElement.classList.contains('empty') && !targetElement.classList.contains('error')) {
      navigator.clipboard.writeText(text).then(() => {
        button.textContent = 'copied';
        button.classList.add('copied');

        setTimeout(() => {
          button.textContent = 'copy';
          button.classList.remove('copied');
        }, 3000);

        // Show status message
        const formatName = targetId.replace('-output', '');
        const displayName = formatName.charAt(0).toUpperCase() + formatName.slice(1);
        showTempStatus(`Copied ${displayName} to clipboard`);

        // Add to history when user copies
        const input = inputField.value.trim();
        if (input) {
          try {
            // Determine actual input type (accounting for IP addresses)
            let actualInputType = currentInputType;
            if (Converter.isIPv4(input) || Converter.isIPv6(input)) {
              actualInputType = 'text';
            }
            
            // Get current conversion results
            const results = Converter.convertAll(input, actualInputType);
            addToHistory(input, currentInputType, results);
          } catch (error) {
            // Silently fail if conversion errors - user already has the copied value
            console.error('Failed to add to history:', error);
          }
        }
      });
    } else {
      // Show error message when output is empty or has error
      showTempStatus('No output to copy', true);
    }
  }

  function copyAllFormats() {
    const input = inputField.value.trim();
    
    if (!input) {
      showStatus('No input to copy', true);
      return;
    }

    // Gather all non-error outputs
    const outputs = [];
    
    const addOutput = (label, element) => {
      if (!element.classList.contains('empty') && !element.classList.contains('error')) {
        outputs.push(`${label}: ${element.textContent}`);
      }
    };

    addOutput('Binary', binaryOutput);
    addOutput('Hex', hexOutput);
    addOutput('Decimal', decimalOutput);
    addOutput('Text', textOutput);
    addOutput('Base64', base64Output);

    if (outputs.length === 0) {
      showStatus('No valid outputs to copy', true);
      return;
    }

    const allText = outputs.join('\n');
    
    navigator.clipboard.writeText(allText).then(() => {
      const originalText = copyAllBtn.textContent;
      copyAllBtn.textContent = 'copied all!';
      copyAllBtn.style.background = '#3fd89f';
      
      setTimeout(() => {
        copyAllBtn.textContent = originalText;
        copyAllBtn.style.background = '';
      }, 3000);

      showTempStatus(`Copied ${outputs.length} formats to clipboard`);

      // Add to history when user copies all
      if (input) {
        try {
          // Determine actual input type (accounting for IP addresses)
          let actualInputType = currentInputType;
          if (Converter.isIPv4(input) || Converter.isIPv6(input)) {
            actualInputType = 'text';
          }
          
          // Get current conversion results
          const results = Converter.convertAll(input, actualInputType);
          addToHistory(input, currentInputType, results);
        } catch (error) {
          // Silently fail if conversion errors - user already has the copied value
          console.error('Failed to add to history:', error);
        }
      }
    }).catch(err => {
      showStatus('Failed to copy to clipboard', true);
    });
  }

  function updateScrollIndicators() {
    const indicators = [
      { output: binaryOutput, indicator: document.getElementById('binary-scroll-indicator') },
      { output: hexOutput, indicator: document.getElementById('hex-scroll-indicator') },
      { output: decimalOutput, indicator: document.getElementById('decimal-scroll-indicator') },
      { output: textOutput, indicator: document.getElementById('text-scroll-indicator') },
      { output: base64Output, indicator: document.getElementById('base64-scroll-indicator') }
    ];

    indicators.forEach(({ output, indicator }) => {
      if (output && indicator) {
        // Check if content is scrollable
        if (output.scrollHeight > output.clientHeight) {
          indicator.classList.add('visible');
        } else {
          indicator.classList.remove('visible');
        }
      }
    });
  }

  function clearInput() {
    inputField.value = '';
    updateCharCount();
    clearOutputs();
    hideStatus();
    hideDetectionBadge();
    inputField.focus();
    showTempStatus('Input cleared');
  }

  function addToHistory(input, type, results) {
    // Check if history tracking is enabled
    if (!settings.historyTracking) {
      return;
    }

    // Normalize input for duplicate detection (trim and lowercase)
    const normalizedInput = input.trim().toLowerCase();
    
    // Check if this input already exists in history (case-insensitive comparison)
    const existingIndex = history.findIndex(entry => 
      entry.input.trim().toLowerCase() === normalizedInput
    );
    
    // If it exists, remove the old entry
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      input: input.substring(0, 100),
      type: type,
      results: {
        binary: results.binary.value || null,
        hex: results.hex.value || null,
        decimal: results.decimal.value || null,
        text: results.text.value || null,
        base64: results.base64.value || null
      }
    };

    history.unshift(entry);

    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No conversion history yet</div>';
      return;
    }

    historyList.innerHTML = history.map(entry => {
      const time = new Date(entry.timestamp);
      const timeStr = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="history-item" data-id="${entry.id}">
          <button class="history-item-delete" data-id="${entry.id}" title="Delete">×</button>
          <div class="history-item-header">
            <span class="history-item-type">${entry.type}</span>
            <span class="history-item-time">${timeStr}</span>
          </div>
          <div class="history-item-input">${escapeHtml(entry.input)}</div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('history-item-delete')) {
          loadHistoryItem(item.dataset.id);
        }
      });
    });

    document.querySelectorAll('.history-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryItem(btn.dataset.id);
      });
    });
  }

  function loadHistoryItem(id) {
    const entry = history.find(h => h.id === parseInt(id));
    if (entry) {
      selectInputType(entry.type);
      inputField.value = entry.input;
      updateCharCount();
      detectSpecialFormat();
      performConversion();
      inputField.focus();
    }
  }

  function deleteHistoryItem(id) {
    history = history.filter(h => h.id !== parseInt(id));
    saveHistory();
    renderHistory();
    showTempStatus('History item deleted');
  }

  function toggleHistory() {
    isHistoryOpen = !isHistoryOpen;

    if (isHistoryOpen) {
      historySidebar.classList.add('open');
      document.querySelector('.content-wrapper').classList.add('history-open');
      historyToggle.classList.add('active');
    } else {
      historySidebar.classList.remove('open');
      document.querySelector('.content-wrapper').classList.remove('history-open');
      historyToggle.classList.remove('active');
    }
  }

  function confirmClearHistory() {
    showModal(
      'Clear all history?',
      'This will permanently delete all conversion history. This action cannot be undone.',
      () => {
        history = [];
        saveHistory();
        renderHistory();
        showTempStatus('All history cleared');
      }
    );
  }

  function showModal(title, message, onConfirm) {
    const modal = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    modalMessage.textContent = message;
    modal.classList.add('show');

    const handleConfirm = () => {
      onConfirm();
      hideModal();
    };

    const handleCancel = () => {
      hideModal();
    };

    const hideModal = () => {
      modal.classList.remove('show');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  }

  function saveHistory() {
    chrome.storage.local.set({ history: history });
  }

  function loadHistory() {
    chrome.storage.local.get(['history'], (result) => {
      if (result.history) {
        history = result.history;
        renderHistory();
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Settings Functions
  function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;

    if (isSettingsOpen) {
      settingsSidebar.classList.add('open');
      settingsToggle.classList.add('active');
      
      // Close history if open
      if (isHistoryOpen) {
        isHistoryOpen = false;
        historySidebar.classList.remove('open');
        document.querySelector('.content-wrapper').classList.remove('history-open');
        historyToggle.classList.remove('active');
      }
    } else {
      settingsSidebar.classList.remove('open');
      settingsToggle.classList.remove('active');
    }
  }

  function applySettings() {
    // Apply font size
    fontSizeValue.textContent = `${settings.fontSize}px`;
    inputField.style.fontSize = `${settings.fontSize}px`;
    
    document.querySelectorAll('.conversion-output').forEach(output => {
      output.style.fontSize = `${settings.fontSize}px`;
    });

    // Apply show prefixes toggle
    showPrefixesToggle.checked = settings.showPrefixes;
    showPrefixesStatus.textContent = settings.showPrefixes ? 'Enabled' : 'Disabled';

    // Apply hex case radio selection
    hexCaseRadios.forEach(radio => {
      radio.checked = radio.value === settings.hexCase;
    });

    // Apply binary grouping radio selection
    binaryGroupingRadios.forEach(radio => {
      radio.checked = radio.value === settings.binaryGrouping;
    });

    // Apply hex grouping radio selection
    hexGroupingRadios.forEach(radio => {
      radio.checked = radio.value === settings.hexGrouping;
    });

    // Apply show leading zeros toggle
    showLeadingZerosToggle.checked = settings.showLeadingZeros;
    showLeadingZerosStatus.textContent = settings.showLeadingZeros ? 'Enabled' : 'Disabled';

    // Apply show bit counter toggle
    showBitCounterToggle.checked = settings.showBitCounter;
    showBitCounterStatus.textContent = settings.showBitCounter ? 'Enabled' : 'Disabled';
    
    // Show/hide bit counter based on setting
    if (settings.showBitCounter) {
      bitCount.style.display = '';
    } else {
      bitCount.style.display = 'none';
    }

    // Apply show byte counter toggle
    showByteCounterToggle.checked = settings.showByteCounter;
    showByteCounterStatus.textContent = settings.showByteCounter ? 'Enabled' : 'Disabled';
    
    // Show/hide byte counter based on setting
    if (settings.showByteCounter) {
      byteCount.style.display = '';
    } else {
      byteCount.style.display = 'none';
    }

    // Apply history tracking toggle
    historyTrackingToggle.checked = settings.historyTracking;
    historyTrackingStatus.textContent = settings.historyTracking ? 'Enabled' : 'Disabled';
  }

  function saveSettings() {
    chrome.storage.local.set({ settings: settings });
  }

  function loadSettings() {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        settings = { ...settings, ...result.settings };
        applySettings();
      }
    });
  }

  function resetSettings() {
    showModal(
      'Reset Settings',
      'This will reset all settings to their default values.',
      () => {
        settings = {
          fontSize: 13,
          showPrefixes: false,
          hexCase: 'upper',
          binaryGrouping: 'none',
          hexGrouping: 'none',
          showLeadingZeros: false,
          historyTracking: true,
          showBitCounter: true,
          showByteCounter: true
        };
        applySettings();
        saveSettings();
        performConversion();
        showTempStatus('Settings reset to defaults');
      }
    );
  }

  function popOut() {
    const currentInput = inputField.value;
    const W = Math.max(1200, Math.min(screen.availWidth  - 40, 1600));
    const H = Math.max(1000, Math.min(screen.availHeight - 40, 1200));
    chrome.storage.local.set({ pendingInput: currentInput }, () => {
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: W,
        height: H
      });
    });
  }

  init();
})();