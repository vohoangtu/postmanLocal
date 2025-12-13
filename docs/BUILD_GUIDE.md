# Build Guide - PostmanLocal

Hướng dẫn build PostmanLocal cho các platforms khác nhau.

## Prerequisites

### All Platforms

- Node.js 18+
- Rust (latest stable)
- Tauri CLI: `npm install -g @tauri-apps/cli@latest`

### Windows

- **MSVC Build Tools**: Visual Studio Build Tools hoặc Visual Studio với C++ workload
- **Windows SDK**: Included với Visual Studio
- **Code Signing** (optional): Code signing certificate (.pfx file)

### macOS

- **Xcode**: Latest version với Command Line Tools
- **Code Signing**: Apple Developer certificate
- **Notarization**: Apple Developer account (cho distribution)

### Linux

- **System Dependencies**:
  ```bash
  # Ubuntu/Debian
  sudo apt update
  sudo apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

  # Fedora
  sudo dnf install webkit2gtk4.1-devel.x86_64 \
    openssl-devel \
    curl \
    wget \
    file \
    libX11-devel \
    libXdo-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel
  ```

## Build Commands

### Development Build

```bash
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

Build artifacts sẽ được tạo trong `src-tauri/target/release/bundle/`

## Platform-Specific Builds

### Windows

#### Build MSI Installer

```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**Output:**
- `src-tauri/target/release/bundle/msi/PostmanLocal_1.0.0_x64_en-US.msi`

#### Code Signing (Windows)

1. **Obtain Certificate:**
   - Purchase code signing certificate từ trusted CA
   - Hoặc use self-signed certificate cho testing

2. **Sign Executable:**
   ```powershell
   signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com /d "PostmanLocal" /du "https://postmanlocal.com" target\release\PostmanLocal.exe
   ```

3. **Sign MSI:**
   ```powershell
   signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com /d "PostmanLocal" /du "https://postmanlocal.com" target\release\bundle\msi\PostmanLocal_1.0.0_x64_en-US.msi
   ```

#### Build Script (Windows)

Tạo `build-windows.ps1`:
```powershell
# Build
npm run tauri build -- --target x86_64-pc-windows-msvc

# Sign (if certificate available)
if (Test-Path "certificate.pfx") {
    $password = Read-Host -AsSecureString "Enter certificate password"
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    signtool sign /f certificate.pfx /p $plainPassword /t http://timestamp.digicert.com /d "PostmanLocal" target\release\PostmanLocal.exe
}
```

### macOS

#### Build DMG

```bash
npm run tauri build -- --target x86_64-apple-darwin  # Intel
npm run tauri build -- --target aarch64-apple-darwin # Apple Silicon
```

**Output:**
- `src-tauri/target/release/bundle/dmg/PostmanLocal_1.0.0_x64.dmg` (Intel)
- `src-tauri/target/release/bundle/dmg/PostmanLocal_1.0.0_aarch64.dmg` (Apple Silicon)

#### Universal Binary

```bash
# Build both architectures
npm run tauri build -- --target x86_64-apple-darwin
npm run tauri build -- --target aarch64-apple-darwin

# Create universal binary (requires lipo)
lipo -create \
  target/x86_64-apple-darwin/release/PostmanLocal \
  target/aarch64-apple-darwin/release/PostmanLocal \
  -output target/release/PostmanLocal
```

#### Code Signing (macOS)

1. **Setup Certificate:**
   ```bash
   # Import certificate vào Keychain
   security import certificate.p12 -k ~/Library/Keychains/login.keychain
   ```

2. **Sign App:**
   ```bash
   codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" target/release/bundle/macos/PostmanLocal.app
   ```

3. **Notarize:**
   ```bash
   xcrun notarytool submit target/release/bundle/dmg/PostmanLocal.dmg \
     --apple-id your@email.com \
     --team-id YOUR_TEAM_ID \
     --password YOUR_APP_SPECIFIC_PASSWORD \
     --wait
   ```

4. **Staple:**
   ```bash
   xcrun stapler staple target/release/bundle/macos/PostmanLocal.app
   ```

#### Build Script (macOS)

Tạo `build-macos.sh`:
```bash
#!/bin/bash

# Build
npm run tauri build -- --target aarch64-apple-darwin

# Sign (if certificate available)
if [ -f "certificate.p12" ]; then
    codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" \
      src-tauri/target/aarch64-apple-darwin/release/bundle/macos/PostmanLocal.app
fi
```

### Linux

#### Build AppImage

```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

**Output:**
- `src-tauri/target/release/bundle/appimage/postmanlocal_1.0.0_amd64.AppImage`

#### Build DEB Package

```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

**Output:**
- `src-tauri/target/release/bundle/deb/postmanlocal_1.0.0_amd64.deb`

#### Build RPM Package

```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

**Output:**
- `src-tauri/target/release/bundle/rpm/postmanlocal-1.0.0-1.x86_64.rpm`

## Build Configuration

### tauri.conf.json

Cấu hình trong `src-tauri/tauri.conf.json`:

```json
{
  "productName": "PostmanLocal",
  "version": "1.0.0",
  "identifier": "com.postmanlocal.app",
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage", "deb", "rpm"],
    "icon": ["icons/icon.ico", "icons/icon.png", "icons/icon.icns"],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    },
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "10.13",
      "exceptionDomain": "",
      "signingIdentity": null
    },
    "linux": {
      "deb": {
        "depends": []
      },
      "rpm": {
        "depends": []
      }
    }
  }
}
```

## Build Optimization

### Release Build Flags

Thêm vào `Cargo.toml`:

```toml
[profile.release]
opt-level = "z"     # Optimize for size
lto = true          # Link-time optimization
codegen-units = 1   # Better optimization
strip = true        # Strip symbols
```

### Frontend Build

Vite config đã được optimize:
- Code splitting
- Tree shaking
- Minification
- Compression

## Build Scripts

### package.json Scripts

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "build:windows": "npm run build && npm run tauri build -- --target x86_64-pc-windows-msvc",
    "build:macos": "npm run build && npm run tauri build -- --target aarch64-apple-darwin",
    "build:linux": "npm run build && npm run tauri build -- --target x86_64-unknown-linux-gnu",
    "build:all": "npm run build:windows && npm run build:macos && npm run build:linux"
  }
}
```

## Distribution

### Windows

- **MSI Installer**: Standard Windows installer
- **Portable**: Extract từ MSI hoặc build portable version
- **Auto-update**: Setup Tauri updater

### macOS

- **DMG**: Disk image với drag-to-install
- **App Store**: Prepare cho App Store submission (nếu cần)
- **Direct Download**: Host DMG trên website

### Linux

- **AppImage**: Portable, không cần install
- **DEB**: Cho Debian/Ubuntu
- **RPM**: Cho Fedora/RHEL
- **Snap/Flatpak**: Consider cho universal package

## Code Signing Setup

### Windows Certificate

1. Purchase certificate từ:
   - DigiCert
   - Sectigo
   - GlobalSign

2. Export certificate:
   ```powershell
   certutil -exportPFX -p "password" My CertStoreName certificate.pfx
   ```

### macOS Certificate

1. Create certificate trong Apple Developer:
   - Developer ID Application (cho distribution outside App Store)
   - Apple Distribution (cho App Store)

2. Download và import vào Keychain

### Linux

Linux không require code signing, nhưng có thể:
- GPG sign packages
- Use package repository với signed packages

## Troubleshooting

### Build Fails

**Windows:**
- Ensure MSVC Build Tools installed
- Check PATH includes MSVC tools
- Verify Windows SDK installed

**macOS:**
- Ensure Xcode Command Line Tools installed: `xcode-select --install`
- Check certificates trong Keychain

**Linux:**
- Install all system dependencies
- Check Rust toolchain: `rustup show`

### Large Bundle Size

- Enable LTO trong Cargo.toml
- Use `opt-level = "z"` cho size optimization
- Strip symbols
- Remove unused dependencies

### Code Signing Issues

**Windows:**
- Verify certificate format (.pfx)
- Check certificate không expired
- Ensure timestamp server accessible

**macOS:**
- Verify certificate trong Keychain
- Check signing identity matches
- Ensure notarization credentials correct

## CI/CD Build

### GitHub Actions Example

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
    
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions-rs/toolchain@v1
      - run: npm install
      - run: npm run tauri build -- --target ${{ matrix.target }}
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.target }}
          path: src-tauri/target/release/bundle/
```
