import { readFileSync, writeFileSync, existsSync } from 'fs';

const BUILD_GRADLE = 'android/app/build.gradle';

if (existsSync(BUILD_GRADLE)) {
  let gradle = readFileSync(BUILD_GRADLE, 'utf8');
  
  let newVersionCode = 1;
  let newVersionName = '1.0.0';
  
  // 增加 versionCode
  gradle = gradle.replace(
    /versionCode\s+(\d+)/,
    (match, code) => {
      newVersionCode = parseInt(code) + 1;
      return `versionCode ${newVersionCode}`;
    }
  );
  
  // 自动递增 versionName (基于 versionCode)
  const major = 1;
  const minor = Math.floor(newVersionCode / 100);
  const patch = newVersionCode % 100;
  newVersionName = `${major}.${minor}.${patch}`;
  
  gradle = gradle.replace(
    /versionName\s+"([^"]+)"/,
    `versionName "${newVersionName}"`
  );
  
  writeFileSync(BUILD_GRADLE, gradle, 'utf8');
  console.log(`✅ Android version updated: ${newVersionName} (${newVersionCode})`);
} else {
  console.log('⚠️  build.gradle not found');
}
