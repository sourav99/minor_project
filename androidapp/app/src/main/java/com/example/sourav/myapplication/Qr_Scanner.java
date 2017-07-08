package com.example.sourav.myapplication;

import android.content.Context;
import android.content.Intent;
import android.graphics.PointF;
import android.provider.Settings;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.telephony.TelephonyManager;
import android.widget.TextView;

import com.dlazaro66.qrcodereaderview.QRCodeReaderView;

import org.json.JSONObject;

import java.lang.reflect.Field;

import io.socket.client.Ack;

import static com.example.sourav.myapplication.MainActivity.socket;

public class Qr_Scanner extends AppCompatActivity implements QRCodeReaderView.OnQRCodeReadListener {
    private QRCodeReaderView qrCodeReaderView;
    public static String statuscode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main_qr__scanner);
        try {

            qrCodeReaderView = (QRCodeReaderView) findViewById(R.id.qrdecoderview);
            qrCodeReaderView.setOnQRCodeReadListener((QRCodeReaderView.OnQRCodeReadListener) this);

            // Use this function to enable/disable decoding
            qrCodeReaderView.setQRDecodingEnabled(true);

            // Use this function to change the autofocus interval (default is 5 secs)
            qrCodeReaderView.setAutofocusInterval(2000L);

            // Use this function to enable/disable Torch
            qrCodeReaderView.setTorchEnabled(true);

            // Use this function to set front camera preview
            //  qrCodeReaderView.setFrontCamera();

            // Use this function to set back camera preview
            qrCodeReaderView.setBackCamera();
            qrCodeReaderView.setOnQRCodeReadListener(this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    public void qr_scanner(Context context) {

    }

    @Override
    public void onQRCodeRead(String text, PointF[] points) {
        System.out.println("hello" + text);
        TextView textView = (TextView) findViewById(R.id.qrtextview);
        textView.setText("" + text);
        JsonQrText(text);


        Intent i = new Intent(this, MainActivity.class);
i.putExtra("status",statuscode);
        startActivity(i);

    }

    public void JsonQrText(String qrData) {
        try {
            String[] parts = qrData.split(",");

            JSONObject obj = new JSONObject();
            obj.put("msg", parts[0]);
            obj.put("wsid", parts[1]);


            socket.emit("QRData", obj, new Ack() {
                @Override
                public void call(Object... args) {
                    System.out.println("qr Received");

                    String data = (String) args[0];
                    System.out.print(data);

                    if (data.contains("200")) {
                        statuscode="200Recived";
                        getInfo();

                    }
                   /* try {

                        for (Object x : args) {
                            Class<?> clazz = x.getClass();
                            Field field = clazz.getField("fieldName"); //Note, this can throw an exception if the field doesn't exist.
                            Object fieldValue = field.get(x);

                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }*/
                }
            });


        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void getInfo() {
// GET DEVICE ID
        final String deviceId = Settings.Secure.getString(getContentResolver(),
                Settings.Secure.ANDROID_ID);

// GET IMEI NUMBER
        TelephonyManager tManager = (TelephonyManager) getBaseContext()
                .getSystemService(Context.TELEPHONY_SERVICE);
        String deviceIMEI = tManager.getDeviceId();
        JSONObject obj = new JSONObject();
      try {
          obj.put("device_id", deviceId);
          obj.put("name", deviceId);
          obj.put("imei", deviceIMEI);
          obj.put("number", "9911019897");
          obj.put("expire", "1");

          socket.emit("Auth0", obj);

      }catch (Exception e){
          e.printStackTrace();
      }

    }


    @Override
    protected void onResume() {
        super.onResume();
        qrCodeReaderView.startCamera();
    }

    @Override
    protected void onPause() {
        super.onPause();
        qrCodeReaderView.stopCamera();
    }

}
