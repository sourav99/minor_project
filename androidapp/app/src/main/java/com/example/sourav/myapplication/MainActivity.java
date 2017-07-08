package com.example.sourav.myapplication;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import org.json.JSONObject;

import io.socket.client.Ack;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

import static com.example.sourav.myapplication.Qr_Scanner.statuscode;

public class MainActivity extends AppCompatActivity {
    public static Socket socket;
    JSONObject obj;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        try {
            socket = IO.socket("http://192.168.0.11:3000");
            System.out.println("hello");
        } catch (Exception e) {
            e.printStackTrace();
        }

        Intent i=getIntent();
   TextView t=(TextView)findViewById(R.id.status);

        t.setText(i.getStringExtra(""+statuscode));
    }


    public void scanqr(View v) {
        Intent i = new Intent(this, Qr_Scanner.class);
        startActivity(i);

    }


    public void clicked(View v) {


        try {

            socket = IO.socket("http://192.168.0.11:3000");
            System.out.println("hello");
            socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {

                @Override
                public void call(Object... args) {

                    socket.emit("message", obj, new Ack() {
                        @Override
                        public void call(Object... args) {
                            System.out.println("fist::  " + args.toString());

                        }
                        //   Log.i()"helloo"+args);


                    });

                }


            }).on("event", new Emitter.Listener() {

                @Override
                public void call(Object... args) {
                    System.out.println("second");
                }

            }).on(Socket.EVENT_DISCONNECT, new Emitter.Listener() {

                @Override
                public void call(Object... args) {
                    System.out.println("third");
                }

            });
            socket.connect();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


}
