# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

-keepattributes Signature, *Annotation*, EnclosingMethod, InnerClasses
-keepattributes SourceFile, LineNumberTable

# Capacitor (incluye navegación nativa y reflection)
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep @com.getcapacitor.Plugin annotation class * { *; }

# Firebase (gms google-services)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Apache Cordova plugins que Capacitor carga
-keep class org.apache.cordova.** { *; }

# Keep JSR-305 annotations for compile-time checks
-dontwarn javax.annotation.**
-keep class javax.annotation.** { *; }

# Keep our model classes
-keep class click.yapido.lavadoras.model.** { *; }

# Reflection sobre clases críticas de Capacitor
-keep class * implements androidx.fragment.app.Fragment { *; }
