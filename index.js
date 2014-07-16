// Require modules
var request = require('request');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

module.exports = {

  // Send request to the Arduino board running aREST
  send: function(req,res) {

    // Decode command
    var command = req.query['command'];
    var target = req.query['target'];
    var type = req.query['type'];
    var speed = req.query['speed'];

    console.log("Command: " + command);
    console.log("Target: " + target);
    console.log("Type: " + type);
    console.log("Speed: " + speed);

    // Perform request

    // HTTP
    if (type == "wifi"){

      // Request options
      var options = {timeout: 2000};
      
      // Make request
      request('http://' + target + command, options, function (error, response, body) {
      if (!error){
        console.log(body);
        res.send(body);  
      }
      else {
        console.log("Error with request");
        res.send("{\"connected\": false}");
      }
    });
    }

     // Serial
    if (type == "serial") {

      console.log("Serial request received");

      var SerialPort = serialport.SerialPort;
      
      var serialPort = new SerialPort(target, {
        baudrate: speed,
        parser: serialport.parsers.readline('\n')
      }, function(error){
        if (error){
          console.log("Error with request");
          res.send("{\"connected\": false}");  
        }
      });
      
      serialPort.on("open", function () {
        console.log('Serial port opened');
        serialPort.on('close', function(data) {
          console.log('Serial port closed');
        });
        serialPort.on('data', function(data) {
          console.log('data received: ' + data);
          setTimeout(function(){
            res.send(data);
            serialPort.close();
          },500);
      });
      serialPort.write(Buffer(command + '\r'));
    });   
   }
  }
};