"""Prepara o projeto Android (gerado pelo Capacitor) para se atualizar sozinho:
   - plugin VinovimUpdate: descarrega o novo .apk e abre o instalador;
   - número da versão igual ao do package.json;
   - assinatura sempre com a mesma chave (secret VINOVIM_ANDROID_KEY), para o Android aceitar a atualização por cima.
   Corre depois de `npx cap sync android` e de `mobile/android_widget.py`."""
import base64, json, os, re

app_id = json.load(open('capacitor.config.json'))['appId']
version = json.load(open('package.json'))['version']
pkg_dir = os.path.join('android/app/src/main/java', *app_id.split('.'))
res = 'android/app/src/main/res'


def write(path, txt):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(txt.strip() + '\n')


# 1) plugin nativo
write(os.path.join(pkg_dir, 'VinovimUpdate.java'), f'''
package {app_id};

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "VinovimUpdate")
public class VinovimUpdate extends Plugin {{
    private long downloadId = -1;
    private BroadcastReceiver receiver;

    @PluginMethod
    public void install(PluginCall call) {{
        String url = call.getString("url");
        if (url == null || !url.startsWith("https://")) {{ call.reject("Endereço inválido"); return; }}
        final Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !ctx.getPackageManager().canRequestPackageInstalls()) {{
            Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));
            s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(s);
            call.reject("PERMISSAO");
            return;
        }}
        final File dir = ctx.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        final File apk = new File(dir, "vinovim-update.apk");
        if (apk.exists()) apk.delete();
        final DownloadManager dm = (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);
        DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
        r.setTitle("Vinovim");
        r.setDescription("A descarregar a nova versão");
        r.setMimeType("application/vnd.android.package-archive");
        r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
        r.setDestinationInExternalFilesDir(ctx, Environment.DIRECTORY_DOWNLOADS, "vinovim-update.apk");
        if (receiver != null) {{ try {{ ctx.unregisterReceiver(receiver); }} catch (Exception e) {{ }} }}
        receiver = new BroadcastReceiver() {{
            @Override
            public void onReceive(Context c, Intent i) {{
                long id = i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id != downloadId) return;
                try {{ c.unregisterReceiver(this); }} catch (Exception e) {{ }}
                receiver = null;
                boolean ok = false;
                Cursor q = dm.query(new DownloadManager.Query().setFilterById(id));
                if (q != null) {{
                    if (q.moveToFirst()) {{
                        int col = q.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        ok = col >= 0 && q.getInt(col) == DownloadManager.STATUS_SUCCESSFUL;
                    }}
                    q.close();
                }}
                if (!ok || !apk.exists()) return;
                Uri uri = FileProvider.getUriForFile(c, c.getPackageName() + ".fileprovider", apk);
                Intent inst = new Intent(Intent.ACTION_VIEW);
                inst.setDataAndType(uri, "application/vnd.android.package-archive");
                inst.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                c.startActivity(inst);
            }}
        }};
        ContextCompat.registerReceiver(ctx, receiver, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), ContextCompat.RECEIVER_EXPORTED);
        downloadId = dm.enqueue(r);
        call.resolve();
    }}
}}
''')

# 2) registar o plugin na atividade principal (escrita por android_widget.py)
ma = os.path.join(pkg_dir, 'MainActivity.java')
src = open(ma, encoding='utf-8').read()
if 'VinovimUpdate' not in src:
    src = src.replace('public class MainActivity extends BridgeActivity {', '''public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(VinovimUpdate.class);
        super.onCreate(savedInstanceState);
    }
''', 1)
    assert 'registerPlugin(VinovimUpdate.class)' in src, 'MainActivity inesperada'
    write(ma, src)

# 3) permissão para instalar a atualização
mf = 'android/app/src/main/AndroidManifest.xml'
m = open(mf, encoding='utf-8').read()
if 'REQUEST_INSTALL_PACKAGES' not in m:
    m = re.sub(r'(<uses-permission android:name="android.permission.INTERNET" ?/>)', r'\1\n    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />', m, count=1)
    assert 'REQUEST_INSTALL_PACKAGES' in m, 'Manifest inesperado'
    open(mf, 'w', encoding='utf-8').write(m)

# 4) o FileProvider do Capacitor passa a poder partilhar a pasta das transferências da app
fp = os.path.join(res, 'xml/file_paths.xml')
if os.path.exists(fp):
    x = open(fp, encoding='utf-8').read()
    if 'vv_updates' not in x:
        x = x.replace('</paths>', '    <external-files-path name="vv_updates" path="." />\n</paths>')
        open(fp, 'w', encoding='utf-8').write(x)
else:
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    write(fp, '<?xml version="1.0" encoding="utf-8"?>\n<paths xmlns:android="http://schemas.android.com/apk/res/android">\n    <external-files-path name="vv_updates" path="." />\n</paths>')

# 5) versão e assinatura
gr = 'android/app/build.gradle'
g = open(gr, encoding='utf-8').read()
maj, mi, pa = (int(n) for n in (version.split('.') + ['0', '0'])[:3])
# o versionCode tem de subir sempre (o Android recusa instalar um número mais baixo por cima):
# usa o número da compilação do GitHub, acima de tudo o que já foi instalado (a 1.4.0 era 10400)
run = int(os.environ.get('GITHUB_RUN_NUMBER', '0') or 0)
code = 20000 + run if run else maj * 10000 + mi * 100 + pa
g = re.sub(r'versionCode\s+\d+', 'versionCode %d' % code, g, count=1)
g = re.sub(r'versionName\s+"[^"]*"', 'versionName "%s"' % version, g, count=1)
key = os.environ.get('VINOVIM_ANDROID_KEY', '').strip()
if key and '.' in key:
    pw, b64 = key.split('.', 1)
    with open('android/app/vinovim.keystore', 'wb') as f:
        f.write(base64.b64decode(b64))
    g += '''
android {
    signingConfigs {
        vinovim {
            storeFile file('vinovim.keystore')
            storePassword '%s'
            keyAlias 'vinovim'
            keyPassword '%s'
        }
    }
    buildTypes {
        debug { signingConfig signingConfigs.vinovim }
        release { signingConfig signingConfigs.vinovim }
    }
}
''' % (pw, pw)
    print('assinatura: chave do Vinovim')
else:
    print('AVISO: sem VINOVIM_ANDROID_KEY; o .apk fica com uma chave temporária')
open(gr, 'w', encoding='utf-8').write(g)
print('android pronto: versão', version, '· código', code)
