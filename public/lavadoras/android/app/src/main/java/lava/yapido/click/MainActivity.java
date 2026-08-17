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
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return;

        Uri data = intent.getData();
        if (!OAUTH_CALLBACK_SCHEME.equals(data.getScheme())) return;
        if (!OAUTH_CALLBACK_HOST.equals(data.getHost())) return;

        String code = data.getQueryParameter("code");
        String error = data.getQueryParameter("error");

        if (savedCall != null) {
            if (code != null) {
                // Exchange code for id_token in background
                exchangeCodeForIdToken(code);
            } else {
                JSObject result = new JSObject();
                result.put("success", false);
                result.put("error", error != null ? error : "unknown_error");
                savedCall.resolve(result);
                savedCall = null;
            }
        }

        setIntent(new Intent());
    }

    @PluginMethod
    public void requestNativeGoogleAuth(PluginCall call) {
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

        CustomTabsIntent.Builder builder = new CustomTabsIntent.Builder();
        builder.setToolbarColor(getResources().getColor(android.R.color.black));
        builder.setShowTitle(true);
        builder.addDefaultShareMenuItem();
        CustomTabsIntent customTabsIntent = builder.build();

        customTabsIntent.launchUrl(this, Uri.parse(authUrl));
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

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(params.getBytes(StandardCharsets.UTF_8));
                }

                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    String errorBody = readStream(conn.getErrorStream());
                    Log.e(TAG, "Token exchange failed: " + responseCode + " - " + errorBody);
                    resolveWithError("Token exchange failed: " + responseCode);
                    return;
                }

                String responseBody = readStream(conn.getInputStream());
                Log.d(TAG, "Token response: " + responseBody);

                // Parse id_token from JSON response
                String idToken = extractIdToken(responseBody);
                if (idToken == null) {
                    resolveWithError("No id_token in response");
                    return;
                }

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("id_token", idToken);
                if (savedCall != null) {
                    savedCall.resolve(result);
                    savedCall = null;
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