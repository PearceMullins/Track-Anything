package com.trackanything.app;

import android.app.Activity;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Parcelable;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BackupFile")
public class BackupFilePlugin extends Plugin {
    private static BackupFilePlugin activePlugin;
    private static JSObject pendingImport;
    private static int importSequence = 0;

    @Override
    public void load() {
        activePlugin = this;
        emitPendingImport();
    }

    @PluginMethod
    public void saveJson(PluginCall call) {
        String fileName = call.getString("fileName");
        String data = call.getString("data");
        String mimeType = call.getString("mimeType");

        if (fileName == null || fileName.length() == 0) {
            call.reject("fileName must be provided.");
            return;
        }
        if (data == null) {
            call.reject("data must be provided.");
            return;
        }
        if (mimeType == null || mimeType.length() == 0) {
            mimeType = "application/json";
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(call, intent, "saveJsonResult");
    }

    @ActivityCallback
    private void saveJsonResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != Activity.RESULT_OK) {
            call.reject("Save canceled.");
            return;
        }

        Intent resultIntent = result.getData();
        Uri uri = resultIntent == null ? null : resultIntent.getData();
        if (uri == null) {
            call.reject("No save location selected.");
            return;
        }

        String data = call.getString("data");
        if (data == null) {
            call.reject("No backup data found.");
            return;
        }
        try (OutputStream outputStream = getContext().getContentResolver().openOutputStream(uri, "w")) {
            if (outputStream == null) {
                call.reject("Could not open save location.");
                return;
            }
            outputStream.write(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            call.reject("Could not save backup: " + ex.getMessage());
            return;
        }

        JSObject response = new JSObject();
        response.put("uri", uri.toString());
        call.resolve(response);
    }

    @PluginMethod
    public void getPendingImport(PluginCall call) {
        if (pendingImport == null) {
            call.resolve(new JSObject());
            return;
        }

        JSObject response = pendingImport;
        pendingImport = null;
        call.resolve(response);
    }

    public static boolean handleIncomingIntent(Context context, Intent intent) {
        JSObject payload = importPayloadFromIntent(context, intent);
        if (payload == null) {
            return false;
        }

        pendingImport = payload;
        emitPendingImport();
        return true;
    }

    private static void emitPendingImport() {
        if (activePlugin != null && pendingImport != null) {
            activePlugin.notifyListeners("backupImport", pendingImport);
        }
    }

    private static JSObject importPayloadFromIntent(Context context, Intent intent) {
        if (intent == null) {
            return null;
        }

        String action = intent.getAction();
        Uri uri = null;
        String fileName = "track-anything-backup.json";
        String data = null;

        if (Intent.ACTION_VIEW.equals(action)) {
            uri = intent.getData();
        } else if (Intent.ACTION_SEND.equals(action)) {
            Parcelable stream = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (stream instanceof Uri) {
                uri = (Uri) stream;
            } else {
                data = intent.getStringExtra(Intent.EXTRA_TEXT);
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            uri = firstUriFromClipData(intent);
        } else {
            return null;
        }

        if (uri == null) {
            uri = firstUriFromClipData(intent);
        }

        try {
            if (uri != null) {
                fileName = displayNameForUri(context, uri);
                data = readTextFromUri(context, uri);
            }
        } catch (Exception ex) {
            return null;
        }

        if (data == null || data.trim().length() == 0) {
            return null;
        }

        JSObject payload = new JSObject();
        payload.put("id", "android-" + (++importSequence));
        payload.put("fileName", fileName);
        payload.put("data", data);
        return payload;
    }

    private static Uri firstUriFromClipData(Intent intent) {
        ClipData clipData = intent.getClipData();
        if (clipData == null || clipData.getItemCount() == 0) {
            return null;
        }
        return clipData.getItemAt(0).getUri();
    }

    private static String displayNameForUri(Context context, Uri uri) {
        String fallback = uri.getLastPathSegment();
        if (fallback == null || fallback.length() == 0) {
            fallback = "track-anything-backup.json";
        }

        try (Cursor cursor = context.getContentResolver().query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (nameIndex >= 0) {
                    String displayName = cursor.getString(nameIndex);
                    if (displayName != null && displayName.length() > 0) {
                        return displayName;
                    }
                }
            }
        } catch (Exception ignored) {
            return fallback;
        }

        return fallback;
    }

    private static String readTextFromUri(Context context, Uri uri) throws Exception {
        try (InputStream inputStream = context.getContentResolver().openInputStream(uri)) {
            if (inputStream == null) {
                throw new Exception("Could not open backup file.");
            }

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int read;
            while ((read = inputStream.read(chunk)) != -1) {
                buffer.write(chunk, 0, read);
            }
            return buffer.toString(StandardCharsets.UTF_8.name());
        }
    }
}
