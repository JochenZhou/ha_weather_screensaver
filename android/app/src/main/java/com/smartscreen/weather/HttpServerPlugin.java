package com.smartscreen.weather;

import android.content.SharedPreferences;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import fi.iki.elonen.NanoHTTPD;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

@CapacitorPlugin(name = "HttpServer")
public class HttpServerPlugin extends Plugin {
    private static final String TAG = "HttpServer";
    private static final String PREFS_NAME = "SmartScreenConfig";
    private WebServer server;

    @PluginMethod
    public void start(PluginCall call) {
        Integer port = call.getInt("port", 3001);
        
        if (server != null) {
            call.reject("Server already running");
            return;
        }

        try {
            server = new WebServer(port, getContext());
            server.start();
            call.resolve();
            Log.d(TAG, "Server started on port " + port);
        } catch (IOException e) {
            call.reject("Failed to start server: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (server != null) {
            server.stop();
            server = null;
            call.resolve();
        } else {
            call.reject("Server not running");
        }
    }

    private static class WebServer extends NanoHTTPD {
        private android.content.Context context;

        public WebServer(int port, android.content.Context context) {
            super(port);
            this.context = context;
        }

        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();
            Method method = session.getMethod();
            Log.d(TAG, "Request: " + method + " " + uri);

            // CORS headers
            Response response;
            
            // API endpoints
            if (uri.equals("/api/config")) {
                if (method == Method.GET) {
                    response = handleGetConfig();
                } else if (method == Method.POST) {
                    response = handlePostConfig(session);
                } else if (method == Method.OPTIONS) {
                    response = newFixedLengthResponse(Response.Status.OK, "text/plain", "");
                } else {
                    response = newFixedLengthResponse(Response.Status.METHOD_NOT_ALLOWED, "text/plain", "Method Not Allowed");
                }
            } else if (uri.equals("/") || uri.equals("/index.html")) {
                response = serveAsset("public/config.html", "text/html");
            } else if (uri.equals("/config.html")) {
                response = serveAsset("public/config.html", "text/html");
            } else if (uri.startsWith("/assets/")) {
                String assetPath = "public" + uri;
                String mimeType = getMimeType(uri);
                response = serveAsset(assetPath, mimeType);
            } else {
                response = newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not Found");
            }

            // Add CORS headers
            response.addHeader("Access-Control-Allow-Origin", "*");
            response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.addHeader("Access-Control-Allow-Headers", "Content-Type");
            return response;
        }

        private Response handleGetConfig() {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE);
            JSONObject json = new JSONObject();
            try {
                json.put("ha_url", prefs.getString("ha_url", ""));
                json.put("ha_token", prefs.getString("ha_token", ""));
                json.put("weather_entity", prefs.getString("weather_entity", "weather.forecast_home"));
                json.put("location_name", prefs.getString("location_name", "北京市"));
                json.put("demo_mode", prefs.getBoolean("demo_mode", false));
                json.put("demo_state", prefs.getString("demo_state", "CLEAR_DAY"));
                json.put("demo_festival", prefs.getString("demo_festival", ""));
            } catch (Exception e) {
                Log.e(TAG, "Error creating JSON", e);
            }
            return newFixedLengthResponse(Response.Status.OK, "application/json; charset=utf-8", json.toString());
        }

        private Response handlePostConfig(IHTTPSession session) {
            try {
                Map<String, String> body = new HashMap<>();
                session.parseBody(body);
                String postData = body.get("postData");
                if (postData == null) postData = "";
                
                JSONObject json = new JSONObject(postData);
                SharedPreferences.Editor editor = context.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE).edit();
                
                if (json.has("ha_url")) editor.putString("ha_url", json.getString("ha_url"));
                if (json.has("ha_token")) editor.putString("ha_token", json.getString("ha_token"));
                if (json.has("weather_entity")) editor.putString("weather_entity", json.getString("weather_entity"));
                if (json.has("location_name")) editor.putString("location_name", json.getString("location_name"));
                if (json.has("demo_mode")) editor.putBoolean("demo_mode", json.getBoolean("demo_mode"));
                if (json.has("demo_state")) editor.putString("demo_state", json.getString("demo_state"));
                if (json.has("demo_festival")) editor.putString("demo_festival", json.getString("demo_festival"));
                
                editor.apply();
                return newFixedLengthResponse(Response.Status.OK, "application/json; charset=utf-8", "{\"success\":true}");
            } catch (Exception e) {
                Log.e(TAG, "Error saving config", e);
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }

        private Response serveAsset(String path, String mimeType) {
            try {
                InputStream is = context.getAssets().open(path);
                if (mimeType.startsWith("text/") || mimeType.equals("application/json") || mimeType.equals("application/javascript")) {
                    mimeType += "; charset=utf-8";
                }
                return newChunkedResponse(Response.Status.OK, mimeType, is);
            } catch (IOException e) {
                Log.e(TAG, "Asset not found: " + path, e);
                return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not Found");
            }
        }

        private String getMimeType(String uri) {
            if (uri.endsWith(".html")) return "text/html";
            if (uri.endsWith(".js")) return "application/javascript";
            if (uri.endsWith(".css")) return "text/css";
            if (uri.endsWith(".json")) return "application/json";
            if (uri.endsWith(".png")) return "image/png";
            if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
            if (uri.endsWith(".svg")) return "image/svg+xml";
            return "application/octet-stream";
        }
    }
}
