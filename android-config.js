import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const MANIFEST_PATH = 'android/app/src/main/AndroidManifest.xml';
const STYLES_DIR = 'android/app/src/main/res/values';
const STYLES_PATH = join(STYLES_DIR, 'styles.xml');

console.log('🔧 Configuring Android for landscape fullscreen...\n');

// Update AndroidManifest.xml
if (existsSync(MANIFEST_PATH)) {
  let manifest = readFileSync(MANIFEST_PATH, 'utf8');
  
  if (!manifest.includes('android:screenOrientation')) {
    manifest = manifest.replace(
      /<activity([^>]*android:name="\.MainActivity"[^>]*)>/,
      '<activity$1\n            android:screenOrientation="landscape">'
    );
    console.log('✅ Added landscape orientation to MainActivity');
  } else {
    console.log('ℹ️  Landscape orientation already configured');
  }
  
  writeFileSync(MANIFEST_PATH, manifest);
} else {
  console.log('⚠️  AndroidManifest.xml not found. Run "npx cap add android" first.');
}

// Create styles.xml
if (!existsSync(STYLES_DIR)) {
  mkdirSync(STYLES_DIR, { recursive: true });
}

const stylesContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowDrawsSystemBarBackgrounds">false</item>
    </style>
</resources>
`;

writeFileSync(STYLES_PATH, stylesContent);
console.log('✅ Created styles.xml for fullscreen mode');
console.log('\n✨ Android configuration complete!');
