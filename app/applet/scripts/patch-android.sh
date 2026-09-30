#!/bin/bash
set -e

echo "=== Patching Android Manifest & Gradle ==="

# 1. Garante a criação da estrutura completa do Android se o Manifest não existir
if [ ! -f "android/app/src/main/AndroidManifest.xml" ]; then
  rm -rf android
  npx --yes @capacitor/cli add android
fi

MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  # Remove se já existirem para não duplicar
  sed -i '/android.permission.ACCESS_FINE_LOCATION/d' "$MANIFEST"
  sed -i '/android.permission.ACCESS_COARSE_LOCATION/d' "$MANIFEST"
  sed -i '/android.permission.ACCESS_BACKGROUND_LOCATION/d' "$MANIFEST"
  sed -i '/android.permission.INTERNET/d' "$MANIFEST"
  sed -i '/android.permission.ACCESS_NETWORK_STATE/d' "$MANIFEST"
  sed -i '/android.permission.CAMERA/d' "$MANIFEST"
  sed -i '/android.permission.READ_EXTERNAL_STORAGE/d' "$MANIFEST"
  sed -i '/android.permission.WRITE_EXTERNAL_STORAGE/d' "$MANIFEST"
  sed -i '/android.permission.READ_MEDIA_IMAGES/d' "$MANIFEST"
  sed -i '/android.permission.POST_NOTIFICATIONS/d' "$MANIFEST"
  sed -i '/android.permission.VIBRATE/d' "$MANIFEST"
  sed -i '/android.permission.WAKE_LOCK/d' "$MANIFEST"
  sed -i '/android.permission.RECEIVE_BOOT_COMPLETED/d' "$MANIFEST"
  sed -i '/android.permission.FOREGROUND_SERVICE/d' "$MANIFEST"
  sed -i '/android.permission.FOREGROUND_SERVICE_LOCATION/d' "$MANIFEST"

  # Insere as permissões antes de <application> usando python para robustez total
  python3 -c '
path = "android/app/src/main/AndroidManifest.xml"
with open(path, "r") as f:
    content = f.read()

permissions = """
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
"""

if "<application" in content:
    content = content.replace("<application", permissions + "\n    <application")
    with open(path, "w") as f:
        f.write(content)
    print("✅ AndroidManifest permissions inserted successfully via python patcher")
'
fi

# 2. Auto-incrementa versionCode e versionName no build.gradle
GRADLE_FILE="android/app/build.gradle"
if [ -f "$GRADLE_FILE" ]; then
  BUILD_NUM="${GITHUB_RUN_NUMBER:-1}"
  if [ -z "$BUILD_NUM" ] || [ "$BUILD_NUM" -eq 0 ]; then
    BUILD_NUM=$(date +%s)
  fi
  sed -i "s/versionCode 1/versionCode $BUILD_NUM/g" "$GRADLE_FILE"
  sed -i "s/versionName \"1.0\"/versionName \"1.0.$BUILD_NUM\"/g" "$GRADLE_FILE"
  echo "✅ Gradle versionCode updated to $BUILD_NUM"
fi
