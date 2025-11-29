# 🛠️ VoteRush Installation Guide for Windows

## ⚡ Quick Installation Steps

### 1. Install Node.js
1. Go to: https://nodejs.org/en/download/
2. Click "Windows Installer (.msi)" for x64
3. Download and run the installer
4. Follow the setup wizard (use default settings)
5. Restart PowerShell when done

### 2. Install Foundry (Forge, Cast, Anvil)
1. Go to: https://github.com/foundry-rs/foundry/releases/latest
2. Download: `foundry_nightly_windows_amd64.tar.gz`
3. Extract the tar.gz file (use 7-Zip if needed)
4. Create folder: `C:\Users\YourUsername\.foundry\bin`
5. Copy extracted files (forge.exe, cast.exe, anvil.exe) to this bin folder
6. Add `C:\Users\YourUsername\.foundry\bin` to your PATH environment variable:
   - Press Win+R, type `sysdm.cpl`, press Enter
   - Click "Environment Variables"
   - Under "User variables", find "Path", click "Edit"
   - Click "New", add: `C:\Users\YourUsername\.foundry\bin`
   - Click OK on all dialogs

### 3. Verify Installations
Open a new PowerShell window and run:
```powershell
node --version    # Should show v18+ or v20+
npm --version     # Should show 9+ or 10+
forge --version   # Should show forge version
cast --version    # Should show cast version
```

### 4. Setup VoteRush Project
```powershell
cd "C:\Users\Santhosh S\Desktop\voting rush"

# Install npm packages
npm install

# Initialize Foundry dependencies
forge install foundry-rs/forge-std --no-commit

# Compile contracts
forge build

# Run tests
forge test -vvv

# Setup environment
cp .env.example .env
# Edit .env file with your private key
```

## 🚀 Alternative: Use Setup Script

After installing Node.js and Foundry, simply run:
```powershell
.\setup.ps1
```

## 🆘 Troubleshooting

### If Node.js fails to install:
- Use the LTS version (recommended)
- Run installer as Administrator
- Restart computer after installation

### If Foundry PATH doesn't work:
- Restart PowerShell completely
- Check PATH in new terminal: `echo $env:PATH`
- Manually verify files exist in: `C:\Users\YourUsername\.foundry\bin`

### If permissions error:
- Run PowerShell as Administrator
- Set execution policy: `Set-ExecutionPolicy RemoteSigned -CurrentUser`

## ✅ Success Indicators

You're ready when all these commands work:
```powershell
node --version     # ✅ Shows version
npm --version      # ✅ Shows version  
forge --version    # ✅ Shows version
forge build        # ✅ Compiles successfully
forge test -vvv    # ✅ All tests pass
```

## 🎯 Next Steps

Once everything is installed:
1. Get testnet MON: https://faucet.monad.xyz
2. Deploy contract: `npm run deploy`
3. Create demo poll: `npm run demo`
4. Run stress test: `npm run stress-test`

---

**Need help?** Check that both Node.js and Foundry are properly installed and in your PATH.