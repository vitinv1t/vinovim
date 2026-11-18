"""Adiciona ao projeto Android (gerado pelo Capacitor) o widget "Continuar a ver",
   a atualização do widget ao sair da app e a permissão do microfone."""
import json, os, re
app_id = json.load(open('capacitor.config.json'))['appId']
pkg_dir = os.path.join('android/app/src/main/java', *app_id.split('.'))
res = 'android/app/src/main/res'
os.makedirs(pkg_dir, exist_ok=True)
for d in ('layout', 'xml', 'drawable'):
    os.makedirs(os.path.join(res, d), exist_ok=True)

def w(path, txt):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(txt.strip() + '\n')

w(os.path.join(pkg_dir, 'VinovimWidget.java'), f'''
package {app_id};

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class VinovimWidget extends AppWidgetProvider {{
    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {{
        for (int id : ids) update(ctx, mgr, id);
    }}

    public static void update(Context ctx, AppWidgetManager mgr, int id) {{
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_vinovim);
        String title = "Abre o Vinovim";
        String sub = "Nada a meio por agora";
        try {{
            SharedPreferences sp = ctx.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String raw = sp.getString("vv_widget", null);
            if (raw != null) {{
                JSONObject o = new JSONObject(raw);
                title = o.optString("title", title);
                sub = o.optString("sub", sub);
            }}
        }} catch (Exception e) {{ }}
        v.setTextViewText(R.id.vv_title, title);
        v.setTextViewText(R.id.vv_sub, sub);
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("vinovim://continue"), ctx, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.vv_root, pi);
        mgr.updateAppWidget(id, v);
    }}
}}
''')

w(os.path.join(pkg_dir, 'MainActivity.java'), f'''
package {app_id};

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onPause() {{
        super.onPause();
        try {{
            AppWidgetManager m = AppWidgetManager.getInstance(this);
            int[] ids = m.getAppWidgetIds(new ComponentName(this, VinovimWidget.class));
            for (int id : ids) VinovimWidget.update(this, m, id);
        }} catch (Exception e) {{ }}
    }}
}}
''')

w(os.path.join(res, 'drawable/widget_bg.xml'), '''
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient android:startColor="#F2241A33" android:endColor="#F20C0A12" android:angle="315" />
    <corners android:radius="24dp" />
    <stroke android:width="1dp" android:color="#22FFFFFF" />
</shape>
''')
w(os.path.join(res, 'drawable/widget_btn.xml'), '''
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="oval">
    <gradient android:startColor="#8B5CFF" android:centerColor="#FF4D94" android:endColor="#FF6A6A" android:angle="315" />
</shape>
''')
w(os.path.join(res, 'layout/widget_vinovim.xml'), '''
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/vv_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="horizontal"
    android:gravity="center_vertical"
    android:padding="14dp"
    android:background="@drawable/widget_bg">
    <ImageView
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:src="@mipmap/ic_launcher" />
    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:orientation="vertical"
        android:paddingLeft="12dp"
        android:paddingRight="8dp">
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="CONTINUAR A VER"
            android:textColor="#FF6A6A"
            android:textSize="11sp"
            android:textStyle="bold" />
        <TextView
            android:id="@+id/vv_title"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Vinovim"
            android:textColor="#FFFFFF"
            android:textSize="16sp"
            android:textStyle="bold"
            android:maxLines="1"
            android:ellipsize="end" />
        <TextView
            android:id="@+id/vv_sub"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text=""
            android:textColor="#A39CB1"
            android:textSize="13sp"
            android:maxLines="1"
            android:ellipsize="end" />
    </LinearLayout>
    <TextView
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:gravity="center"
        android:text="▶"
        android:textColor="#FFFFFF"
        android:textSize="18sp"
        android:background="@drawable/widget_btn" />
</LinearLayout>
''')
w(os.path.join(res, 'xml/widget_info.xml'), '''
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="60dp"
    android:targetCellWidth="4"
    android:targetCellHeight="1"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_vinovim"
    android:previewLayout="@layout/widget_vinovim"
    android:resizeMode="horizontal"
    android:widgetCategory="home_screen" />
''')

m_path = 'android/app/src/main/AndroidManifest.xml'
m = open(m_path, encoding='utf-8').read()
if 'VinovimWidget' not in m:
    m = m.replace('</application>', '''    <receiver android:name=".VinovimWidget" android:exported="false" android:label="Vinovim · Continuar a ver">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_info" />
        </receiver>
    </application>''', 1)
if 'RECORD_AUDIO' not in m:
    m = re.sub(r'(<uses-permission android:name="android.permission.INTERNET" ?/>)', r'\1\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />', m, count=1)
open(m_path, 'w', encoding='utf-8').write(m)
print('widget pronto em', pkg_dir)
