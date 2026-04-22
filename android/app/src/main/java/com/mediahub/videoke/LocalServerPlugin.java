package com.mediahub.videoke;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Map;

import fi.iki.elonen.NanoHTTPD;

@CapacitorPlugin(name = "LocalServer")
public class LocalServerPlugin extends Plugin {

    private static final String TAG = "LocalServer";
    private static final int PORT = 8888;
    private MediaHubServer server;

    @PluginMethod
    public void start(PluginCall call) {
        try {
            if (server != null && server.isAlive()) {
                server.stop();
            }
            String dataDir = getContext().getFilesDir().getAbsolutePath();
            server = new MediaHubServer(PORT, dataDir, getContext());
            server.start(NanoHTTPD.SOCKET_READ_TIMEOUT, false);

            JSObject result = new JSObject();
            result.put("ip", getDeviceIp());
            result.put("port", PORT);
            call.resolve(result);
        } catch (IOException e) {
            call.reject("Failed to start server: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (server != null) {
            server.stop();
            server = null;
        }
        call.resolve();
    }

    @PluginMethod
    public void getIp(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ip", getDeviceIp());
        call.resolve(result);
    }

    @PluginMethod
    public void popCommand(PluginCall call) {
        try {
            File cmdFile = new File(getContext().getFilesDir(), "remote-commands.json");
            if (!cmdFile.exists()) {
                call.resolve(new JSObject());
                return;
            }
            String content = readFile(cmdFile);
            JSONArray arr = new JSONArray(content);
            if (arr.length() == 0) {
                call.resolve(new JSObject());
                return;
            }
            JSONObject first = arr.getJSONObject(0);
            JSONArray remaining = new JSONArray();
            for (int i = 1; i < arr.length(); i++) remaining.put(arr.get(i));
            writeFile(cmdFile, remaining.toString());

            JSObject res = new JSObject();
            res.put("songId", first.optString("songId", ""));
            res.put("action", first.optString("action", "queue"));
            call.resolve(res);
        } catch (Exception e) {
            call.resolve(new JSObject());
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String getDeviceIp() {
        // Priority: hotspot interface first, then any active WiFi/ethernet
        String fallback = null;
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            for (NetworkInterface ni : Collections.list(interfaces)) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                String name = ni.getName().toLowerCase();
                for (InetAddress addr : Collections.list(ni.getInetAddresses())) {
                    if (addr.isLoopbackAddress()) continue;
                    if (!(addr instanceof Inet4Address)) continue;
                    String ip = addr.getHostAddress();
                    // Android hotspot interfaces: wlan_ap, ap0, swlan0, wlan1
                    if (name.contains("ap") || name.contains("swlan") || name.equals("wlan1")) {
                        return ip;  // hotspot IP — highest priority
                    }
                    // Regular WiFi — keep as fallback
                    if (name.startsWith("wlan") || name.startsWith("eth")) {
                        fallback = ip;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "getDeviceIp error", e);
        }
        // Return fallback WiFi IP, or Android hotspot default
        return fallback != null ? fallback : "192.168.43.1";
    }

    static String readFile(File f) throws IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader br = new BufferedReader(new FileReader(f));
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        br.close();
        return sb.toString();
    }

    static void writeFile(File f, String content) throws IOException {
        FileWriter fw = new FileWriter(f, false);
        fw.write(content);
        fw.close();
    }

    // ── Inner HTTP Server ─────────────────────────────────────────────────────

    static class MediaHubServer extends NanoHTTPD {

        private final String dataDir;
        private final Context ctx;

        MediaHubServer(int port, String dataDir, Context ctx) {
            super(port);
            this.dataDir = dataDir;
            this.ctx = ctx;
        }

        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();
            Method method = session.getMethod();

            Response resp;

            if (uri.equals("/") || uri.equals("/remote")) {
                resp = newFixedLengthResponse(Response.Status.OK, "text/html", getRemoteHtml());
            } else if (uri.equals("/songlist")) {
                resp = newFixedLengthResponse(Response.Status.OK, "text/html", getSongListHtml());
            } else if (uri.equals("/api/songs")) {
                resp = serveSongs();
            } else if (uri.equals("/api/status")) {
                resp = serveStatus();
            } else if (uri.equals("/api/queue") && method == Method.POST) {
                resp = handleQueuePost(session);
            } else {
                resp = newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not found");
            }

            resp.addHeader("Access-Control-Allow-Origin", "*");
            resp.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            resp.addHeader("Access-Control-Allow-Headers", "Content-Type");
            return resp;
        }

        private Response serveSongs() {
            try {
                File mediaFile = new File(dataDir, "media.json");
                if (!mediaFile.exists()) {
                    return newFixedLengthResponse(Response.Status.OK, "application/json", "[]");
                }
                String content = readFile(mediaFile);
                return newFixedLengthResponse(Response.Status.OK, "application/json", content);
            } catch (Exception e) {
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "[]");
            }
        }

        private Response serveStatus() {
            try {
                File statusFile = new File(dataDir, "remote-status.json");
                if (!statusFile.exists()) {
                    return newFixedLengthResponse(Response.Status.OK, "application/json", "{}");
                }
                return newFixedLengthResponse(Response.Status.OK, "application/json", readFile(statusFile));
            } catch (Exception e) {
                return newFixedLengthResponse(Response.Status.OK, "application/json", "{}");
            }
        }

        private Response handleQueuePost(IHTTPSession session) {
            try {
                Map<String, String> body = new java.util.HashMap<>();
                session.parseBody(body);
                String postBody = body.get("postData");
                if (postBody == null) postBody = "{}";

                JSONObject req = new JSONObject(postBody);
                String songId = req.optString("songId", "");

                File cmdFile = new File(dataDir, "remote-commands.json");
                JSONArray arr = new JSONArray();
                if (cmdFile.exists()) {
                    try { arr = new JSONArray(readFile(cmdFile)); } catch (Exception ignored) {}
                }
                JSONObject cmd = new JSONObject();
                cmd.put("songId", songId);
                cmd.put("action", "queue");
                cmd.put("ts", System.currentTimeMillis());
                arr.put(cmd);
                writeFile(cmdFile, arr.toString());

                return newFixedLengthResponse(Response.Status.OK, "application/json", "{\"ok\":true}");
            } catch (Exception e) {
                return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", "{\"ok\":false}");
            }
        }

        private String getSongListHtml() {
            return "<!DOCTYPE html><html><head>" +
                "<meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1'>" +
                "<meta name='theme-color' content='#0a0a12'>" +
                "<title>Media Hub Song List</title>" +
                "<style>" +
                "*{box-sizing:border-box;margin:0;padding:0}" +
                "body{background:#0a0a12;color:#f1f5f9;font-family:system-ui,sans-serif;height:100vh;display:flex;flex-direction:column}" +
                ".topbar{background:#12121e;padding:14px 16px;border-bottom:1px solid #ffffff10;flex-shrink:0}" +
                ".topbar h1{font-size:18px;font-weight:600;color:#a78bfa}" +
                ".topbar p{font-size:12px;color:#475569;margin-top:2px}" +
                ".searchbox{display:flex;align-items:center;gap:8px;background:#1a1a2e;border-radius:12px;padding:10px 14px;margin:12px 14px 0}" +
                ".searchbox input{flex:1;background:none;border:none;color:#f1f5f9;font-size:15px;outline:none}" +
                ".searchbox input::placeholder{color:#475569}" +
                ".list{flex:1;overflow-y:auto;padding:8px 0}" +
                ".srow{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid #ffffff08}" +
                ".snum{font-size:13px;color:#a78bfa;font-family:monospace;width:40px;text-align:right;flex-shrink:0;font-weight:500}" +
                ".sinfo{flex:1;min-width:0}" +
                ".stitle{font-size:14px;font-weight:500;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
                ".sartist{font-size:12px;color:#475569;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
                ".empty{text-align:center;padding:40px 20px;color:#475569;font-size:14px}" +
                ".count{padding:8px 16px;font-size:12px;color:#475569;flex-shrink:0;border-bottom:1px solid #ffffff08}" +
                "</style></head><body>" +
                "<div class='topbar'><h1>Song List</h1><p id='subtitle'>Loading…</p></div>" +
                "<div class='searchbox'><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#475569' stroke-width='2'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.35-4.35'/></svg><input id='search' type='text' placeholder='Search by number, title or artist…' oninput='filterSongs()'></div>" +
                "<div class='count' id='count'></div>" +
                "<div class='list' id='list'><div class='empty'>Loading…</div></div>" +
                "<script>" +
                "var allSongs=[];" +
                "function filterSongs(){" +
                "  var q=document.getElementById('search').value.toLowerCase().trim();" +
                "  var res=q?allSongs.filter(function(s){return (s.title||'').toLowerCase().includes(q)||(s.artist||'').toLowerCase().includes(q)||String(s.number||'').includes(q);}):allSongs;" +
                "  document.getElementById('count').textContent=res.length+' songs';" +
                "  renderList(res);" +
                "}" +
                "function renderList(songs){" +
                "  var el=document.getElementById('list');" +
                "  if(!songs.length){el.innerHTML=\"<div class='empty'>No songs found</div>\";return;}" +
                "  el.innerHTML=songs.map(function(s){" +
                "    return \"<div class='srow'><span class='snum'>\"+(s.number||'—')+\"</span><div class='sinfo'><div class='stitle'>\"+esc(s.title)+\"</div><div class='sartist'>\"+esc(s.artist)+\"</div></div></div>\";" +
                "  }).join('');" +
                "}" +
                "function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}" +
                "fetch('/api/songs').then(function(r){return r.json();})" +
                ".then(function(songs){" +
                "  var numbered=songs.filter(function(s){return s.number!=null;}).sort(function(a,b){return Number(a.number)-Number(b.number);});" +
                "  var unnumbered=songs.filter(function(s){return s.number==null;}).sort(function(a,b){return(a.title||'').localeCompare(b.title||'');});" +
                "  allSongs=numbered.concat(unnumbered);" +
                "  document.getElementById('subtitle').textContent=allSongs.length+' songs';" +
                "  document.getElementById('count').textContent=allSongs.length+' songs';" +
                "  renderList(allSongs);" +
                "}).catch(function(){document.getElementById('subtitle').textContent='Failed to load';});" +
                "</script></body></html>";
        }

        private String getRemoteHtml() {
            return "<!DOCTYPE html><html><head>" +
                "<meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1'>" +
                "<meta name='theme-color' content='#0a0a12'>" +
                "<title>Media Hub Remote</title>" +
                "<style>" +
                "*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}" +
                "body{background:#0a0a12;color:#f1f5f9;font-family:system-ui,sans-serif;height:100vh;display:flex;flex-direction:column}" +
                ".topbar{background:#12121e;padding:14px 16px;border-bottom:1px solid #ffffff10;flex-shrink:0}" +
                ".topbar h1{font-size:18px;font-weight:600;color:#a78bfa}" +
                ".topbar p{font-size:12px;color:#475569;margin-top:2px}" +
                ".searchbox{display:flex;align-items:center;gap:8px;background:#1a1a2e;border-radius:12px;padding:10px 14px;margin:12px 14px 0}" +
                ".searchbox input{flex:1;background:none;border:none;color:#f1f5f9;font-size:15px;outline:none}" +
                ".searchbox input::placeholder{color:#475569}" +
                ".list{flex:1;overflow-y:auto;padding:8px 0}" +
                ".srow{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #ffffff08;cursor:pointer;active:background:#1a1a2e}" +
                ".srow:active{background:#1a1a2e}" +
                ".snum{font-size:12px;color:#475569;font-family:monospace;width:32px;text-align:right;flex-shrink:0}" +
                ".sinfo{flex:1;min-width:0}" +
                ".stitle{font-size:14px;font-weight:500;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
                ".sartist{font-size:12px;color:#475569;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
                ".sadd{width:36px;height:36px;background:#7c3aed22;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:none;cursor:pointer}" +
                ".toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:500;opacity:0;transition:opacity .3s;pointer-events:none}" +
                ".toast.show{opacity:1}" +
                ".nowplaying{background:#7c3aed22;border-bottom:1px solid #7c3aed44;padding:10px 16px;flex-shrink:0;display:none}" +
                ".nowplaying.visible{display:block}" +
                ".np-label{font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.05em}" +
                ".np-title{font-size:13px;font-weight:500;color:#a78bfa;margin-top:2px}" +
                ".empty{text-align:center;padding:40px 20px;color:#475569;font-size:14px}" +
                "</style></head><body>" +
                "<div class='topbar'><h1>Media Hub Remote</h1><p id='connstatus'>Connecting…</p></div>" +
                "<div class='nowplaying' id='nowplaying'><div class='np-label'>Now playing</div><div class='np-title' id='np-title'></div></div>" +
                "<div class='searchbox'><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#475569' stroke-width='2'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.35-4.35'/></svg><input id='search' type='text' placeholder='Search by number, title or artist…' oninput='filterSongs()'></div>" +
                "<div class='list' id='list'><div class='empty'>Loading songs…</div></div>" +
                "<div class='toast' id='toast'></div>" +
                "<script>" +
                "var allSongs=[];" +
                "function filterSongs(){" +
                "  var q=document.getElementById('search').value.toLowerCase().trim();" +
                "  var res=q?allSongs.filter(s=>(s.title||'').toLowerCase().includes(q)||(s.artist||'').toLowerCase().includes(q)||String(s.number||'').includes(q)):allSongs;" +
                "  renderList(res);" +
                "}" +
                "function renderList(songs){" +
                "  var el=document.getElementById('list');" +
                "  if(!songs.length){el.innerHTML=\"<div class='empty'>No songs found</div>\";return;}" +
                "  el.innerHTML=songs.map(s=>" +
                "    \"<div class='srow' onclick=addSong('\" +s.id+ \"')>\" +" +
                "    \"<span class='snum'>\"+(s.number||'—')+\"</span>\" +" +
                "    \"<div class='sinfo'><div class='stitle'>\"+esc(s.title)+\"</div><div class='sartist'>\"+esc(s.artist)+\"</div></div>\" +" +
                "    \"<button class='sadd' onclick='event.stopPropagation();addSong(\\\"\" +s.id+ \"\\\")'><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#a78bfa' stroke-width='2.5'><line x1='12' y1='5' x2='12' y2='19'/><line x1='5' y1='12' x2='19' y2='12'/></svg></button>\" +" +
                "    \"</div>\"" +
                "  ).join('');" +
                "}" +
                "function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}" +
                "function addSong(id){" +
                "  fetch('/api/queue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({songId:id})})" +
                "  .then(function(){showToast('Song added to queue!');});" +
                "}" +
                "function showToast(msg){" +
                "  var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');" +
                "  setTimeout(function(){t.classList.remove('show');},2000);" +
                "}" +
                "function pollStatus(){" +
                "  fetch('/api/status').then(function(r){return r.json();}).then(function(d){" +
                "    var np=document.getElementById('nowplaying');" +
                "    var npt=document.getElementById('np-title');" +
                "    if(d.currentSong){npt.textContent=d.currentSong.title+' — '+d.currentSong.artist;np.classList.add('visible');}" +
                "    else{np.classList.remove('visible');}" +
                "  }).catch(function(){});" +
                "}" +
                "fetch('/api/songs').then(function(r){return r.json();})" +
                ".then(function(songs){" +
                "  allSongs=songs;" +
                "  document.getElementById('connstatus').textContent='Connected · '+songs.length+' songs';" +
                "  renderList(songs);" +
                "}).catch(function(){document.getElementById('connstatus').textContent='Connection failed — check WiFi';});" +
                "setInterval(pollStatus,3000);" +
                "</script></body></html>";
        }
    }
}
