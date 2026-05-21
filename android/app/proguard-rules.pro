# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# SoLoader가 네이티브 라이브러리를 정상적으로 로드할 수 있도록 보호
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.soloader.**

# New Architecture 플래그 및 내부 JNI 라이브러리 난독화 방지
-keep class com.facebook.react.internal.featureflags.** { *; }
-dontwarn com.facebook.react.internal.featureflags.**
-keep class com.facebook.react.defaults.** { *; }

# JNI로 호출되는 네이티브 메서드들이 깨지지 않도록 유지
-keepclasseswithmembernames class * {
    native <methods>;
}
