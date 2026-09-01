package lava.yapido.click;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.browser.customtabs.CustomTabsIntent;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;

import lava.yapido.click.BuildConfig;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AndroidAuthBridge")
public class MainActivity extends BridgeActivity {

    private static final String TAG = "AndroidAuthBridge";
    private static final String OAUTH_CALLBACK_SCHEME = "lava.yapido.click.oauth";
    private static final String OAUTH_CALLBACK_HOST = "auth-success";
    private static final String WEB_OAUTH_URL = "https://lavadoras.yapido.click/oauth-callback";
    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    // Client secret - keep in sync with Google Cloud Console
    // Set via BuildConfig.GOOGLE_CLIENT_SECRET (gradle.properties or env var GOOGLE_CLIENT_SECRET)
    private static final String CLIENT_ID = "294212274372-0o91m9db3733jv5dkhnugfsmi75ho6ui.apps.googleusercontent.com";
    private static final String CLIENT_SECRET = BuildConfig.GOOGLE_CLIENT_SECRET;
    private static final String REDIRECT_URI = "https://lavadoras.yapido.click/oauth-callback";

    private PluginCall savedCall;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "=== MainActivity.onCreate - Bridge plugin registered: AndroidAuthBridge ===");
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.d(TAG, "=== onNewIntent received ===");
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null || intent.getData() == null) {
            Log.d(TAG, "handleIntent: null intent or data");
            return;
        }

        Uri data = intent.getData();
        Log.d(TAG, "handleIntent: received URI = " + data.toString());
        Log.d(TAG, "  scheme=" + data.getScheme() + ", host=" + data.getHost() + ", path=" + data.getPath());
        
        if (!OAUTH_CALLBACK_SCHEME.equals(data.getScheme())) {
            Log.d(TAG, "handleIntent: scheme mismatch, expected=" + OAUTH_CALLBACK_SCHEME + " got=" + data.getScheme());
            return;
        }
        if (!OAUTH_CALLBACK_HOST.equals(data.getHost())) {
            Log.d(TAG, "handleIntent: host mismatch, expected=" + OAUTH_CALLBACK_HOST + " got=" + data.getHost());
            return;
        }

        String code = data.getQueryParameter("code");
        String error = data.getQueryParameter("error");
        Log.d(TAG, "handleIntent: code=" + code + ", error=" + error);

        if (savedCall != null) {
            if (code != null) {
                Log.d(TAG, "handleIntent: exchanging code for id_token");
                exchangeCodeForIdToken(code);
            } else {
                Log.e(TAG, "handleIntent: OAuth error = " + error);
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", error != null ? error : "unknown_error");
                savedCall.resolve(result);
                savedCall = null;
            }
        } else {
            Log.w(TAG, "handleIntent: savedCall is NULL! Bridge call not pending.");
        }

        setIntent(new Intent());
    }

    @PluginMethod
    public void requestNativeGoogleAuth(PluginCall call) {
        Log.d(TAG, "=== requestNativeGoogleAuth CALLED ===");
        Log.d(TAG, "  CLIENT_ID: " + CLIENT_ID);
        Log.d(TAG, "  CLIENT_SECRET (first 10): " + (CLIENT_SECRET != null ? CLIENT_SECRET.substring(0, Math.min(10, CLIENT_SECRET.length())) : "NULL"));
        Log.d(TAG, "  REDIRECT_URI: " + REDIRECT_URI);
        
        savedCall = call;

        String scope = "openid email profile";
        String state = "android_" + System.currentTimeMillis();

        String authUrl = GOOGLE_AUTH_URL + "?" +
            "client_id=" + Uri.encode(CLIENT_ID) + "&" +
            "redirect_uri=" + Uri.encode(REDIRECT_URI) + "&" +
            "response_type=code&" +
            "scope=" + Uri.encode(scope) + "&" +
            "state=" + Uri.encode(state) + "&" +
            "access_type=offline&" +
            "prompt=select_account";

        Log.d(TAG, "Launching CustomTab with URL: " + authUrl);

        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        builder.setToolbarColor(getResources().getColor(android.R.color.black));
        builder.setShowTitle(true);
        builder.addDefaultShareMenuItem();
        CustomTabsIntent customTabsIntent = builder.build();

        customTabsIntent.launchUrl(this, Uri.parse(authUrl));
        Log.d(TAG, "CustomTab launched successfully");
    }

    @PluginMethod
    public void submitAuthCode(PluginCall call) {
        String code = call.getString("code");
        if (code == null) {
            call.reject("Missing code parameter");
            return;
        }
        savedCall = call;
        exchangeCodeForIdToken(code);
    }

    private void exchangeCodeForIdToken(String code) {
        Log.d(TAG, "=== exchangeCodeForIdToken START ===");
        Log.d(TAG, "  code (first 20): " + (code != null ? code.substring(0, Math.min(20, code.length())) : "NULL"));
        Log.d(TAG, "  GOOGLE_TOKEN_URL: " + GOOGLE_TOKEN_URL);
        
        executor.execute(() -> {
            try {
                URL url = new URL(GOOGLE_TOKEN_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
                conn.setDoOutput(true);

                String params = "client_id=" + URLEncoder.encode(CLIENT_ID, StandardCharsets.UTF_8) +
                    "&client_secret=" + URLEncoder.encode(CLIENT_SECRET, StandardCharsets.UTF_8) +
                    "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                    "&redirect_uri=" + URLEncoder.encode(REDIRECT_URI, StandardCharsets.UTF_8) +
                    "&grant_type=authorization_code";

                Log.d(TAG, "Token request params: client_id=" + CLIENT_ID + ", redirect_uri=" + REDIRECT_URI);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(params.getBytes(StandardCharsets.UTF_8));
                }

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Token exchange responseCode: " + responseCode);
                
                if (responseCode != 200) {
                    String errorBody = readStream(conn.getErrorStream());
                    Log.e(TAG, "Token exchange FAILED: " + responseCode + " - " + errorBody);
                    resolveWithError("Token exchange failed: " + responseCode + " - " + errorBody);
                    return;
                }

                String responseBody = readStream(conn.getInputStream());
                Log.d(TAG, "Token response body: " + responseBody);

                // Parse id_token from JSON response
                String idToken = extractIdToken(responseBody);
                if (idToken == null) {
                    Log.e(TAG, "No id_token found in response");
                    resolveWithError("No id_token in response: " + responseBody);
                    return;
                }

                Log.d(TAG, "id_token extracted successfully (len=" + idToken.length() + ")");

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("id_token", idToken);
                if (savedCall != null) {
                    Log.d(TAG, "Resolving plugin call with SUCCESS");
                    savedCall.resolve(result);
                    savedCall = null;
                } else {
                    Log.w(TAG, "savedCall is null when trying to resolve!");
                }

            } catch (Exception e) {
                Log.e(TAG, "Exception exchanging code", e);
                resolveWithError("Exception: " + e.getMessage());
            }
        });
    }

    private String extractIdToken(String json) {
        try {
            int idx = json.indexOf("\"id_token\"");
            if (idx == -1) return null;
            idx = json.indexOf(':', idx);
            if (idx == -1) return null;
            idx = json.indexOf('"', idx + 1);
            if (idx == -1) return null;
            int end = json.indexOf('"', idx + 1);
            if (end == -1) return null;
            return json.substring(idx + 1, end);
        } catch (Exception e) {
            return null;
        }
    }

    private String readStream(java.io.InputStream is) throws IOException {
        if (is == null) return "";
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return sb.toString();
    }

    private void resolveWithError(String error) {
        if (savedCall != null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", error);
            savedCall.resolve(result);
            savedCall = null;
        }
    }
}
