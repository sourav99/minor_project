import { Component, OnInit } from '@angular/core';
import * as io from 'socket.io-client';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  socket:any=null;
  imagePath:string;
  session_token:string;
  constructor() {
    this.socket = io('http://192.168.0.11:3000');
   }

  ngOnInit() {
    this.requestQR();
  }

  requestQR():void{
    // Request QR
    this.socket.emit('GenerateQR','');

    // Receive and Feed QR to image
    this.socket.on('QR',(QR)=>{
      this.imagePath=QR;
    });
    // When Token Event is emitted by server catch the token and set it as a global variable ,it needs to be sent with every request
    this.socket.on('token',(tok)=>{
      this.session_token=tok;
      console.log(tok);
    });
  }
}
