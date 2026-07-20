# Capacitor + auto-rules
-keepattributes Signature, *Annotation*, EnclosingMethod, InnerClasses
-keepattributes SourceFile, LineNumberTable

# Capacitor core
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep @interface com.getcapacitor.Plugin
-keep @com.getcapacitor.Plugin class * { *; }

# Capacitor app plugin
-keep class com.capacitorjs.** { *; }

# Aparajita biometric-auth
-keep class com.apeper.utility.** { *; }

# Firebase (si lo agregamos después)
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Apache Cordova plugins
-keep class org.apache.cordova.** { *; }

# JSR-305
-dontwarn javax.annotation.**
-keep class javax.annotation.** { *; }

# Nuestro modelo
-keep class click.yapido.lavadoras.model.** { *; }

# Fragment reflection
-keep class * implements androidx.fragment.app.Fragment { *; }

# Apache HTTP legacy (Capacitor internals usan a veces)
-dontwarn org.apache.**

# R8 default safe
-dontoptimize
