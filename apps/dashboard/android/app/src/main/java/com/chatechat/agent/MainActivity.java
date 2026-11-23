package com.chatechat.agent;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class MainActivity extends BridgeActivity {

    public static final String CHANNEL_ID = "chatechat_messages";
    public static final String CHANNEL_NAME = "Messages (မက်ဆေ့ခ်ျများ)";
    public static final String CHANNEL_DESC = "Customer messages, floating popups, lock-screen alerts and sounds";
    private static int notificationCounter = 1000;

    private static final String PREFS_NAME = "chatechat_native_prefs";
    private static final String PREF_BASE_URL = "pref_base_url";
    private static final String PREF_ORG_ID = "pref_org_id";

    private ScheduledExecutorService backgroundPoller = null;
    private final Set<String> seenMessageIds = Collections.synchronizedSet(new HashSet<>());
    private boolean isInitialPollComplete = false;

    public class NativeAudioInterface {

        @JavascriptInterface
        public void startBackgroundSync(String baseUrl, String organizationId) {
            if (baseUrl != null && !baseUrl.trim().isEmpty()) {
                saveSetting(PREF_BASE_URL, baseUrl.trim());
            }
            if (organizationId != null && !organizationId.trim().isEmpty()) {
                saveSetting(PREF_ORG_ID, organizationId.trim());
            }
            startNativePoller();
        }

        @JavascriptInterface
        public void showNotification(String title, String message) {
            triggerNotification(title, message);
        }

        @JavascriptInterface
        public void playNotificationSound() {
            triggerNotification("ChateChat", "မက်ဆေ့ခ်ျအသစ် ရောက်ရှိလာပါသည် (New Message)");
        }

        @JavascriptInterface
        public void vibrate(long ms) {
            doVibrate(ms);
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            promptNotificationPermission();
        }

        @JavascriptInterface
        public void requestBatteryOptimizationExemption() {
            promptIgnoreBatteryOptimization();
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        promptNotificationPermission();
        setupNativeInterface();
        startNativePoller();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupNativeInterface();
        startNativePoller();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupNativeInterface();
        startNativePoller();
    }

    @Override
    public void onPause() {
        super.onPause();
        // Keep WebView timers running if possible and ensure poller stays active during screen lock
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                webView.resumeTimers();
            }
        } catch (Exception ignored) {}
        startNativePoller();
    }

    private void saveSetting(String key, String value) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(key, value).apply();
        } catch (Exception ignored) {}
    }

    private String getSetting(String key, String defaultValue) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getString(key, defaultValue);
        } catch (Exception ignored) {
            return defaultValue;
        }
    }

    private void promptNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1001);
            }
        }
    }

    private void promptIgnoreBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                }
            } catch (Exception ignored) {}
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                    .build();

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription(CHANNEL_DESC);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 100, 300});
            channel.enableLights(true);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.setSound(soundUri, audioAttributes);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private synchronized void startNativePoller() {
        if (backgroundPoller != null && !backgroundPoller.isShutdown()) {
            return;
        }
        backgroundPoller = Executors.newSingleThreadScheduledExecutor();
        backgroundPoller.scheduleWithFixedDelay(this::checkServerForInboundMessages, 2, 3, TimeUnit.SECONDS);
    }

    private void checkServerForInboundMessages() {
        try {
            String baseUrl = getSetting(PREF_BASE_URL, "https://chatechat.onrender.com");
            String orgId = getSetting(PREF_ORG_ID, "");
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }

            StringBuilder urlBuilder = new StringBuilder(baseUrl)
                    .append("/api/v1/webhooks/telegram/chats");
            if (!orgId.isEmpty()) {
                urlBuilder.append("?organizationId=").append(Uri.encode(orgId));
            }

            URL url = new URL(urlBuilder.toString());
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            conn.setRequestProperty("Accept", "application/json");

            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONObject root = new JSONObject(response.toString());
                if (root.has("chats")) {
                    JSONObject chats = root.getJSONObject("chats");
                    Iterator<String> keys = chats.keys();

                    while (keys.hasNext()) {
                        String key = keys.next();
                        JSONObject chatEntry = chats.getJSONObject(key);
                        if (chatEntry.has("messages")) {
                            JSONArray messages = chatEntry.getJSONArray("messages");
                            for (int i = 0; i < messages.length(); i++) {
                                JSONObject msg = messages.getJSONObject(i);
                                String msgId = msg.optString("id", "");
                                String senderType = msg.optString("senderType", "");

                                if (!msgId.isEmpty() && "CUSTOMER".equalsIgnoreCase(senderType)) {
                                    if (!seenMessageIds.contains(msgId)) {
                                        seenMessageIds.add(msgId);
                                        // If initial poll, populate seen set silently
                                        if (isInitialPollComplete) {
                                            String content = msg.optString("content", "မက်ဆေ့ခ်ျအသစ် ရောက်ရှိလာပါသည်");
                                            String senderName = "Customer (Telegram)";
                                            if (chatEntry.has("conv") && chatEntry.getJSONObject("conv").has("customer")) {
                                                JSONObject cust = chatEntry.getJSONObject("conv").getJSONObject("customer");
                                                senderName = cust.optString("name", senderName);
                                            }
                                            triggerNotification(senderName, content);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    isInitialPollComplete = true;
                }
            }
            conn.disconnect();
        } catch (Exception ignored) {
            // Background network fluctuation / offline handling
        }
    }

    private void triggerNotification(String title, String message) {
        try {
            createNotificationChannel();

            // 1. Wake the CPU and Screen up immediately (especially when device is locked)
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                try {
                    PowerManager.WakeLock wakeLock = pm.newWakeLock(
                            PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                            PowerManager.ACQUIRE_CAUSES_WAKEUP |
                            PowerManager.ON_AFTER_RELEASE,
                            "ChateChat:LockScreenWakeLock"
                    );
                    wakeLock.acquire(4000); // 4 seconds wake lock
                } catch (Exception ignored) {}
            }

            // 2. Prepare PendingIntent to open app on tap
            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);

            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            // 3. Build Heads-Up Floating & Lock-screen Notification
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title != null && !title.trim().isEmpty() ? title : "ChateChat")
                    .setContentText(message != null && !message.trim().isEmpty() ? message : "မက်ဆေ့ခ်ျအသစ် ရောက်ရှိလာပါသည်")
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setSound(defaultSoundUri)
                    .setVibrate(new long[]{0, 250, 100, 300})
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setFullScreenIntent(pendingIntent, true); // Pop up on lock screen

            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                notificationManager.notify(notificationCounter++, builder.build());
            }

            // 4. Play ringtone and vibrate
            try {
                if (defaultSoundUri != null) {
                    Ringtone r = RingtoneManager.getRingtone(getApplicationContext(), defaultSoundUri);
                    if (r != null) {
                        r.play();
                    }
                }
            } catch (Exception ignored) {}

            doVibrate(250);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void doVibrate(long ms) {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                long duration = ms > 0 ? ms : 250;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(duration);
                }
            }
        } catch (Exception ignored) {}
    }

    private void setupNativeInterface() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                WebSettings settings = webView.getSettings();
                settings.setMediaPlaybackRequiresUserGesture(false);
                webView.addJavascriptInterface(new NativeAudioInterface(), "AndroidNativeAudio");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
