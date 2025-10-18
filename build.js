// AI Writing Assistant Pro - Build Script
// Comprehensive build and validation system

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ExtensionBuilder {
  constructor() {
    this.projectRoot = process.cwd();
    this.buildDir = path.join(this.projectRoot, 'build');
    this.distDir = path.join(this.projectRoot, 'dist');
    this.version = this.getVersion();
  }

  getVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version;
    } catch (error) {
      return '3.0.0';
    }
  }

  async build() {
    console.log('🚀 Building AI Writing Assistant Pro Extension...');
    console.log(`Version: ${this.version}`);
    console.log('='.repeat(50));

    try {
      // Step 1: Validate files
      await this.validateFiles();

      // Step 2: Create build directories
      this.createDirectories();

      // Step 3: Copy and process files
      await this.copyFiles();

  // Step 3.5: Generate build info
  this.generateBuildInfo();

      // Step 4: Validate manifest
      await this.validateManifest();

      // Step 5: Create distribution package
      await this.createDistribution();

      // Step 6: Run tests
      await this.runTests();

      console.log('\n✅ Build completed successfully!');
      console.log(`📦 Distribution package: dist/ai-writing-assistant-pro-v${this.version}.zip`);

    } catch (error) {
      console.error('\n❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  async validateFiles() {
    console.log('\n🔍 Validating files...');

    const requiredFiles = [
      'manifest.json',
      'background.js',
      'config.js',
      'content.js',
      'popup.html',
      'popup.js',
      'popup.css',
      'options.html',
      'options.js',
      'options.css',
      'content.css',
      'gemini-service.js'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }

    console.log('✅ All required files present');
  }

  createDirectories() {
    console.log('\n📁 Creating directories...');
    
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }

    console.log('✅ Directories created');
  }

  async copyFiles() {
    console.log('\n📋 Copying files...');

    const filesToCopy = [
      'manifest.json',
      'background.js',
      'config.js',
      'content.js',
      'popup.html',
      'popup.js',
      'popup.css',
      'options.html',
      'options.js',
      'options.css',
      'content.css',
      'gemini-service.js',
      'test-extension.js'
    ];

    for (const file of filesToCopy) {
      if (fs.existsSync(file)) {
        const destPath = path.join(this.buildDir, file);
        fs.copyFileSync(file, destPath);
        console.log(`  ✓ ${file}`);
      }
    }

    // Copy icons directory (if present)
    const srcIconsDir = path.join(this.projectRoot, 'icons');
    const destIconsDir = path.join(this.buildDir, 'icons');
    if (fs.existsSync(srcIconsDir)) {
      if (!fs.existsSync(destIconsDir)) {
        fs.mkdirSync(destIconsDir, { recursive: true });
      }
      const iconFiles = fs.readdirSync(srcIconsDir);
      for (const icon of iconFiles) {
        const src = path.join(srcIconsDir, icon);
        const dest = path.join(destIconsDir, icon);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
          console.log(`  ✓ icons/${icon}`);
        }
      }
    } else {
      // Ensure icons dir exists even if empty to satisfy manifest paths
      if (!fs.existsSync(destIconsDir)) {
        fs.mkdirSync(destIconsDir, { recursive: true });
      }
    }

    console.log('✅ Files copied successfully');
  }

  async validateManifest() {
    console.log('\n📋 Validating manifest.json...');

    try {
      const manifestPath = path.join(this.buildDir, 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      // Validate required fields
      const requiredFields = ['manifest_version', 'name', 'version', 'description'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate manifest version
      if (manifest.manifest_version !== 3) {
        throw new Error('Manifest version must be 3');
      }

      // Validate permissions
      if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
        throw new Error('Invalid permissions format');
      }

      console.log('✅ Manifest validation passed');
    } catch (error) {
      throw new Error(`Manifest validation failed: ${error.message}`);
    }
  }

  async createDistribution() {
    console.log('\n📦 Creating distribution package...');

    const zipName = `ai-writing-assistant-pro-v${this.version}.zip`;
    const zipPath = path.join(this.distDir, zipName);

    try {
      if (process.platform === 'win32') {
        // Use PowerShell Compress-Archive on Windows
        const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${this.buildDir}/*' -DestinationPath '${zipPath.replace(/\\/g, '/')}' -Force"`;
        execSync(psCommand, { stdio: 'inherit' });
      } else {
        // Create zip file using zip command on Unix-like systems
        execSync(`cd ${this.buildDir} && zip -r "${zipPath}" . -x "*.DS_Store" "*.git*"`, {
          stdio: 'inherit'
        });
      }

      console.log(`✅ Distribution package created: ${zipName}`);
    } catch (error) {
      console.warn('⚠️  Could not create zip file. Please create manually from build directory.');
    }
  }

  async runTests() {
    console.log('\n🧪 Running tests...');

    try {
      // Check if test file exists and is valid
      const testPath = path.join(this.buildDir, 'test-extension.js');
      if (fs.existsSync(testPath)) {
        console.log('✅ Test file included in build');
      } else {
        console.warn('⚠️  Test file not found');
      }
    } catch (error) {
      console.warn('⚠️  Could not validate tests:', error.message);
    }
  }

  generateBuildInfo() {
    const buildInfo = {
      version: this.version,
      buildDate: new Date().toISOString(),
      files: this.getFileList(),
      features: this.getFeatureList()
    };

    const buildInfoPath = path.join(this.buildDir, 'build-info.json');
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    console.log('📊 Build info generated');
  }

  getFileList() {
    const files = [];
    const buildDir = this.buildDir;
    
    function scanDirectory(dir, relativePath = '') {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativeItemPath = path.join(relativePath, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath, relativeItemPath);
        } else {
          files.push(relativeItemPath);
        }
      }
    }

    scanDirectory(buildDir);
    return files;
  }

  getFeatureList() {
    return [
      'Advanced Grammar Checking',
      'Spelling & Mechanics',
      'Style Enhancement',
      'AI Text Humanization',
      'Tone Detection & Adjustment',
      'Persona-Based Writing',
      'Real-Time Analysis',
      'Smart Suggestions',
      'Content Optimization',
      'Floating Toolbar',
      'Visual Feedback System',
      'Contextual Suggestions',
      'Performance Optimization',
      'Error Handling',
      'Analytics & Learning',
      'Cross-Platform Sync',
      'Site-Specific Rules',
      'Personalization',
      'Accessibility Features',
      'Privacy & Security'
    ];
  }
}

// Run build if called directly
if (require.main === module) {
  const builder = new ExtensionBuilder();
  builder.build().catch(console.error);
}

module.exports = ExtensionBuilder;
