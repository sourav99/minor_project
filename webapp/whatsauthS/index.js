// imports

var MongoClient = require('mongodb').MongoClient,
    QRCode = require('qrcode'),
    assert = require('assert'),
    https = require('https'),
    fs = require('fs'),
    http = require('http'),
    nJwt = require('njwt'),
    secureRandom = require('secure-random'),
    crypto = require('crypto');


var dbURL = "mongodb://192.168.0.11:27017/whatsauth"
// set options for server for HTTPS

var options = {
  key: fs.readFileSync('../certificates/key.pem'),
  cert : fs.readFileSync('../certificates/cert.pem'),
  requestCert: false,
  rejectUnauthorized:false
};

// start server with options

// createServer(options) to make https and change http to https

var server = http.createServer().listen(3000 /*()=>{
  console.log('Server Started');
}*/);

//  import socket.io and bind it to server

var io = require('socket.io')(server);

// allow origins only localhost

//io.origins(['localhost:*']);

// io is at root
io.on('connection',(socket)=>{
  // Generate A QR and return base64
  socket.on('GenerateQR',()=>{
    console.log('WebClient SID = '+ socket.id);

    // Generate QR Codes at 5 seconds Interval for 30 seconds then terminate

    handler=setInterval(()=>{
      QRGen(socket);
    },10000);

    //After 30 seconds clearInterval
    setTimeout(()=>{clearInterval(handler);
      // In case user closes connection before the Timeout then because of upsert it will reinsert useless ID in DB
      socket.disconnect();
    },60000);
  });

 // For android user to authenticate
 socket.on('QRData',(object)=>{
    console.log("Android ID = "+socket.id);
    MongoClient.connect(dbURL,(err,db)=>{
      assert.equal(null,err);
        db.collection('qrinfo').findOne({'sid':object.wsid},(err,doc)=>{
          assert.equal(null,err);
          if(doc==null){
              console.log('status 400');
              io.to(socket.id).emit('status','400');
          } else if(doc.qr == object.msg) {
              // Send to mobile device that it has authenticated XYZ web user with the web user's IP etc.
              console.log('status 200');
              io.to(socket.id).emit('status','200');
              // On receiving this information mobile deviec emits the object with phone no and username from mailid
              socket.on('auth0',(info)=>{
                // emit this generatedJWT based on user's mobile phone to the web client with timeout of 1 day
                var xgen = generateJWT(info,socked.id,object.wsid);
                io.to(id).emit('token',xgen);
              // assert.equal(null,err); from this point on whenever the user emits any other event always check if the passed token is valid or not.
              });
            } else {
              // if it is not matched , it means QR was generated by some other means thus a hacking attempt disconnect that socket
              socket.disconnect();
            }
        });
    });
  });
  socket.on('disconnect',()=>{
    console.log('disconnected ' + socket.id);
    remMongo(socket.id);
  });
});


// QR Generator Function
function QRGen(socket) {
  // QR Code based on TimeStamp and socket ID
  var tempQR = new Date().valueOf()+""+socket.id;
  // Save tempQR corresponding to socket.id in mongodb

  MongoClient.connect( dbURL , (err,db) => {
    assert.equal(null,err);
    // upsert QRCode
      db.collection('qrinfo').update({'sid':socket.id},{'sid':socket.id,'qr':tempQR},{'upsert':true},(err)=>{
          assert.equal(err,null);
        });
      db.close();
  });
  // Add socked id as an attribute in QRCode

  // Generate QR Code with 30% Error Resistance
  QRCode.toDataURL(tempQR+','+socket.id,{ errorCorrectionLevel: 'H' },(err,url)=>{
    if (err) console.log(err);
    io.to(socket.id).emit('QR',url);
  });
}

// Delete socket's stored values

function remMongo(id) {
  MongoClient.connect(dbURL,(err,db)=>{
    assert.equal(null,err);
    //  if client disconnected remove his record
    db.collection('qrinfo').remove({'sid':id});
  });
}

// Generate a JWT Key

function generateJWT(info,asid,wsid)
{
  var signingKey = secureRandom(256, {type: 'Buffer'});
  // save signingKey corresponding to sid in auth collection
  claims={
    iss:"http://localhost:4200",
    uid:info.num,
    name:info.name,
    device_id:info.device_id,
    asid:asid,
    wsid:wsid,
  }
  var Jwt = nJwt.create(claims,signingKey);
  // If expiration is set true from user's cellphone then expire the token after 1 hour.
  if(info.expire=="1") {
    Jwt.setExpiration(new Date().getTime() + (60*1000));
  }
  var token = Jwt.compact();
  return Buffer(token,'base64');
}

// verify whether tampering or something has been done with the key
function verifyToken(token,signingKey,sid) {
  nJwt.verify(token,signingKey,function(err,verifiedJwt){
    if(err){
    return false; // Token has expired, has been tampered with, etc
    }else{
    console.log(verifiedJwt); // Will contain the header and body
    return true;
  }
});
}
