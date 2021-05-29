package me.eldereal.fishfeeder;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.AsyncTask;
import android.os.Build;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.SpannableStringBuilder;
import android.text.style.ForegroundColorSpan;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.core.location.LocationManagerCompat;
import androidx.lifecycle.MutableLiveData;

import com.espressif.iot.esptouch.EsptouchTask;
import com.espressif.iot.esptouch.IEsptouchResult;
import com.espressif.iot.esptouch.util.ByteUtil;
import com.espressif.iot.esptouch.util.TouchNetUtil;
import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.jetbrains.annotations.NotNull;

import java.lang.ref.WeakReference;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class ESPTouchModule extends ReactContextBaseJavaModule {

    private MutableLiveData<String> mBroadcastData;

    private Map<String, Object> mCacheMap;

    private String ssid;
    private byte[] ssidBytes;
    private String bssid;

    ESPTouchTask currentTask;

    private BroadcastReceiver mBroadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (action == null) {
                return;
            }

            switch (action) {
                case WifiManager.NETWORK_STATE_CHANGED_ACTION:
                case LocationManager.PROVIDERS_CHANGED_ACTION:
                    mBroadcastData.setValue(action);
                    break;
            }
        }
    };

    protected static class StateResult {
        public String message = null;

        public boolean permissionGranted = false;

        public boolean locationRequirement = false;

        public boolean wifiConnected = false;
        public boolean is5G = false;
        public InetAddress address = null;
        public String ssid = null;
        public byte[] ssidBytes = null;
        public String bssid = null;
    }

    @NonNull
    @NotNull
    @Override
    public String getName() {
        return "ESPTouch";
    }

    public ESPTouchModule(@Nullable @org.jetbrains.annotations.Nullable ReactApplicationContext reactContext) {
        super(reactContext);
    }

    ReactActivity getCurrentReactActivity() {
        Activity currentActivity = getCurrentActivity();
        return currentActivity instanceof ReactActivity ? (ReactActivity) currentActivity : null;
    }

    @ReactMethod
    void init(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] permissions = {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.CHANGE_WIFI_STATE,
                    Manifest.permission.ACCESS_WIFI_STATE
            };
            getCurrentReactActivity().requestPermissions(permissions, 0, (requestCode, resultPermissions, grantResults) -> {
                for (int grantResult : grantResults) {
                    if (grantResult != PackageManager.PERMISSION_GRANTED) {
                        promise.reject("ENOPERMISSION", "");
                        return true;
                    }
                }
                initBroadcast();
                promise.resolve(null);
                return true;
            });
        } else {
            initBroadcast();
            promise.resolve(null);
        }
    }

    void initBroadcast() {
        if (mBroadcastData == null) {
            mBroadcastData = new MutableLiveData<>();
            IntentFilter filter = new IntentFilter(WifiManager.NETWORK_STATE_CHANGED_ACTION);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                filter.addAction(LocationManager.PROVIDERS_CHANGED_ACTION);
            }
            getReactApplicationContext().registerReceiver(mBroadcastReceiver, filter);
            mBroadcastData.observe(getCurrentReactActivity(), this::onWifiChanged);
        }
    }

    private void sendEvent(ReactContext reactContext,
                           String eventName,
                           @Nullable WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    void start(String ssid, String password, Promise p) {
        if (ssid == null || ssid.length() == 0) {
            p.reject("EINVALIDSSID", "无效的SSID");
        }
        if (!Objects.equals(ssid, this.ssid)) {
            p.reject("ESSIDCHANGED", "WiFi信息发生变化，请稍后重试");
        }
        byte[] ssidBytes = this.ssidBytes == null ? ByteUtil.getBytesByString(this.ssid)
                : this.ssidBytes;
        byte[] passwordBytes = password == null ? null : ByteUtil.getBytesByString(password);
        byte[] bssid = this.bssid == null ? new byte[0] : TouchNetUtil.convertBssid2Bytes(this.bssid);
        byte[] deviceCount = "1".getBytes();
        byte[] broadcast = {(byte) 1};

        if (currentTask != null) {
            currentTask.cancel();
        }

        currentTask = new ESPTouchTask(getReactApplicationContext(), p);
        currentTask.execute(ssidBytes, bssid, passwordBytes, deviceCount, broadcast);
    }

    protected StateResult checkPermission() {
        StateResult result = new StateResult();
        result.permissionGranted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean locationGranted = getReactApplicationContext().
                    checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)  == PackageManager.PERMISSION_GRANTED;
            if (!locationGranted) {
                String[] splits = getReactApplicationContext().getString(R.string.esptouch_message_permission).split("\n");
                if (splits.length != 2) {
                    throw new IllegalArgumentException("Invalid String @RES esptouch_message_permission");
                }
                SpannableStringBuilder ssb = new SpannableStringBuilder(splits[0]);
                ssb.append('\n');
                SpannableString clickMsg = new SpannableString(splits[1]);
                ForegroundColorSpan clickSpan = new ForegroundColorSpan(0xFF0022FF);
                clickMsg.setSpan(clickSpan, 0, clickMsg.length(), Spannable.SPAN_INCLUSIVE_INCLUSIVE);
                ssb.append(clickMsg);
                result.message = ssb.toString();
                return result;
            }
        }

        result.permissionGranted = true;
        return result;
    }

    protected StateResult checkLocation() {
        StateResult result = new StateResult();
        result.locationRequirement = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            LocationManager manager = getReactApplicationContext().getApplicationContext().getSystemService(LocationManager.class);
            boolean enable = manager != null && LocationManagerCompat.isLocationEnabled(manager);
            if (!enable) {
                result.message = getReactApplicationContext().getString(R.string.esptouch_message_location);
                return result;
            }
        }

        result.locationRequirement = false;
        return result;
    }

    protected StateResult checkWifi() {
        StateResult result = new StateResult();
        result.wifiConnected = false;
        WifiManager mWifiManager = (WifiManager) getReactApplicationContext()
                .getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);
        WifiInfo wifiInfo = mWifiManager.getConnectionInfo();
        boolean connected = TouchNetUtil.isWifiConnected(mWifiManager);
        if (!connected) {
            result.message = getReactApplicationContext().getString(R.string.esptouch_message_wifi_connection);
            return result;
        }

        String ssid = TouchNetUtil.getSsidString(wifiInfo);
        int ipValue = wifiInfo.getIpAddress();
        if (ipValue != 0) {
            result.address = TouchNetUtil.getAddress(wifiInfo.getIpAddress());
        } else {
            result.address = TouchNetUtil.getIPv4Address();
            if (result.address == null) {
                result.address = TouchNetUtil.getIPv6Address();
            }
        }

        result.wifiConnected = true;
        result.message = "";
        result.is5G = TouchNetUtil.is5G(wifiInfo.getFrequency());
        if (result.is5G) {
            result.message = getReactApplicationContext().getString(R.string.esptouch_message_wifi_frequency);
        }
        result.ssid = ssid;
        result.ssidBytes = TouchNetUtil.getRawSsidBytesOrElse(wifiInfo, ssid.getBytes());
        result.bssid = wifiInfo.getBSSID();

        return result;
    }

    private StateResult check() {
        StateResult result = checkPermission();
        if (!result.permissionGranted) {
            return result;
        }
        result = checkLocation();
        result.permissionGranted = true;
        if (result.locationRequirement) {
            return result;
        }
        result = checkWifi();
        result.permissionGranted = true;
        result.locationRequirement = false;
        return result;
    }

    private void onWifiChanged(String s) {
        StateResult stateResult = check();
        WritableMap m = Arguments.createMap();
        this.ssid = stateResult.ssid;
        this.ssidBytes = stateResult.ssidBytes;
        this.bssid = stateResult.bssid;
        m.putString("ssid", stateResult.ssid);
        m.putString("bssid", stateResult.bssid);
        m.putBoolean("success", stateResult.wifiConnected && !stateResult.is5G);
        m.putString("message", stateResult.message);
        sendEvent(getReactApplicationContext(), "onWifiChanged", m);
    }

    private static class ESPTouchTask extends AsyncTask<byte[], IEsptouchResult, List<IEsptouchResult>> {

        private final Object mLock = new Object();

        private final WeakReference<Context> context;
        private final WeakReference<Promise> promise;

        private ESPTouchTask(Context context, Promise promise) {
            this.context = new WeakReference<>(context);
            this.promise = new WeakReference<>(promise);
        }

        public void cancel() {
            cancel(true);
        }

        @Override
        protected List<IEsptouchResult> doInBackground(byte[]... params) {
            int taskResultCount;
            EsptouchTask mEsptouchTask;
            synchronized (mLock) {
                byte[] apSsid = params[0];
                byte[] apBssid = params[1];
                byte[] apPassword = params[2];
                byte[] deviceCountData = params[3];
                byte[] broadcastData = params[4];
                taskResultCount = deviceCountData.length == 0 ? -1 : Integer.parseInt(new String(deviceCountData));
                Context ctx = context.get();
                if (ctx == null) return Collections.emptyList();
                mEsptouchTask = new EsptouchTask(apSsid, apBssid, apPassword, context.get());
                mEsptouchTask.setPackageBroadcast(broadcastData[0] == 1);
                mEsptouchTask.setEsptouchListener(this::publishProgress);
            }
            return mEsptouchTask.executeForResults(taskResultCount);
        }

        @Override
        protected void onPostExecute(List<IEsptouchResult> result) {
            Promise p = this.promise.get();
            if (p == null) return;
            if (result.size() == 0) {
                p.reject("ENORESULT", "无法连接到设备");
                return;
            }
            IEsptouchResult r = result.get(0);
            if (!r.isSuc() || r.getInetAddress() == null) {
                p.reject("ENOSUC", "无法连接到设备");
                return;
            }
            WritableMap map = Arguments.createMap();
            map.putString("address", r.getInetAddress().toString());
            p.resolve(map);
        }
    }
}
