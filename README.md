<div align="center">

<img src="icons/icon128.png" width="96" alt="BitShell Logo" />

# BitShell

**A fast, developer-focused binary, hex, decimal, text & Base64 converter with smart format detection, history, and one-click copy**

![Manifest Version](https://img.shields.io/badge/Manifest-v3-blue?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.5-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave-supported-orange?style=flat-square)

</div>

---

## What is BitShell?

BitShell is a browser extension built for developers, students, and anyone who regularly works with number systems. Type or paste any value — binary, hex, decimal, text, or Base64 — and instantly see every other representation side by side. It also supports IPv4 and IPv6 addresses, with full conversion across all formats.

---

## Features

### ⚡ Smart Format Detection
BitShell automatically detects what you're typing — binary, hex, decimal, text, or Base64 — and shows a detection badge in real time so you always know what format is being used.

### 🔄 Full Format Conversion
Every input is simultaneously converted to all five formats:
- **Binary** ↔ Hex, Decimal, Text, Base64
- **Hex** ↔ Binary, Decimal, Text, Base64
- **Decimal** ↔ Binary, Hex, Text, Base64
- **Text** ↔ Binary, Hex, Decimal, Base64
- **Base64** ↔ Binary, Hex, Decimal, Text

### 🌐 IPv4 & IPv6 Support
Enter an IPv4 or IPv6 address in the decimal field and BitShell converts it to binary, hex, and its 32-bit or 128-bit decimal integer representation automatically.

### 📋 One-Click Copy
Copy any individual output with a single click, or use **Copy All** to copy every result at once.

### 🕘 Conversion History
Every conversion is saved to a history sidebar so you can quickly revisit past inputs. History tracking can be toggled on or off in Settings, and the full history can be cleared at any time.

### ⚙️ Configurable Settings
Open the Settings sidebar to customize how results are displayed:

| Setting | Options |
|---|---|
| **Font Size** | Increase or decrease output text size |
| **Show Prefixes** | Toggle `0b` / `0x` prefixes on outputs |
| **Hex Case** | Uppercase or lowercase hex output |
| **Binary Grouping** | Group bits in sets of 4, 8, or none |
| **Hex Grouping** | Group hex bytes in sets of 1, 2, 4, or none |
| **Leading Zeros** | Show or hide leading zeros |
| **Bit Counter** | Show bit length of the current value |
| **Byte Counter** | Show byte length of the current value |
| **History Tracking** | Enable or disable conversion history |

### 🖱️ Right-Click Context Menu
Select any text on any webpage, right-click, and choose **BitShell** to instantly open the converter pre-loaded with your selected text.

### 🪟 Window Controls
BitShell opens as a resizable popup window with macOS-style window controls — minimize, maximize, and close. Use the **popout button** to open a second independent window.

---

## Usage

### Option A — Chrome Web Store *(easiest)*

Install BitShell directly from the Chrome Web Store — no setup required:

👉 **[Install on the Chrome Web Store](https://chromewebstore.google.com/detail/ekccllhkobdjemdinnbdopagcdjglohf?utm_source=item-share-cb)** 

Once installed, click the BitShell icon in your toolbar or right-click selected text on any page to get started.

---

### Option B — Manual Install (Developer Mode)

**Step 1 — Get the files**

Clone the repository:
```bash
git clone https://github.com/Umbra-Domini/BitShell.git
```
Or click **Code → Download ZIP** and extract it.

**Step 2 — Open your browser's Extensions page**

- **Chrome** → `chrome://extensions`
- **Edge** → `edge://extensions`
- **Brave** → `brave://extensions`

**Step 3 — Enable Developer Mode**

Toggle **Developer mode** ON in the top-right corner.

**Step 4 — Load the extension**

1. Click **Load unpacked**
2. Select the folder containing `manifest.json`
3. Click **Select Folder**

BitShell will appear in your extensions list and toolbar.

---

### How to use it

1. Click the **BitShell icon** in your toolbar to open the converter
2. Select your input format using the type buttons (Binary, Hex, Decimal, Text, Base64)
3. Type or paste your value — all outputs update instantly
4. Click any output field to **copy** that result, or use **Copy All**
5. To convert selected text from a webpage, **highlight it**, right-click, and choose **BitShell**

---

## Folder Structure

```
BitShell/
├── manifest.json
├── popup.html
├── popup.css
├── privacy.html
├── js/
│   ├── background.js
│   ├── popup.js
│   └── converter.js
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## Permissions

| Permission | Reason |
|---|---|
| `contextMenus` | Adds the right-click **BitShell** option on selected text |
| `storage` | Saves conversion history and settings locally |
| `clipboardWrite` | Enables one-click copy of conversion results |

BitShell does **not** collect, transmit, or share any data. Everything stays local in your browser. See [Privacy Policy](https://umbra-domini.github.io/BitShell/privacy.html) for details.

---

## Author

Made by [UmbraDomini](https://github.com/Umbra-Domini)
