// Require modules
var request = require('request');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort;
var XBee = require('xbee-arest').XBee;
var util = require('util');

var aREST = {
  devices: [],
  deviceExist: function(device) {
    var device_exist = false;
    for(var i = 0; i < this.devices.length; i++) {
        if (this.devices[i].id == device || this.devices[i].name == device) {
          device_exist = true;
        }
    }
    return device_exist;
  },
  getDevice: function(device) {
    for(var i = 0; i < this.devices.length; i++) {
        if (this.devices[i].id == device || this.devices[i].name == device) {
          return this.devices[i];
        }
    }
  },
  getDeviceIndex: function(device) {
    for(var i = 0; i < this.devices.length; i++) {
        if (this.devices[i].id == device || this.devices[i].name == device) {
          return i;
        }
    }
  }
};

String.prototype.endsWith = function (s) {
  return this.length >= s.length && this.substr(this.length - s.length) == s;
}

function initXBee(serial_port){

  // Create XBee object
  var xbee = new XBee({
    port: serial_port,   
    baudrate: 9600
  }).init();

  // Init XBee
  xbee.on("initialized", function(params) {
    xbee.discover(); 
    console.log("Node discovery starded...");
  });

  // Discover nodes
  xbee.on("newNodeDiscovered", function(node) {
    
    // If node is discovered
    console.log("Node %s discovered", node.remote64.hex);

    // Answer
    var answer;

    // Listen for data
    node.once("data", function(data) {
        console.log("%s> %s", node.remote64.hex, data);
        if (data.endsWith('\r\n')) {
          answer = JSON.parse(data.toString('utf8'));
        
          if ( !(aREST.deviceExist(answer.id)) ){

            var new_device = new Device();
            new_device.type = 'xbee';
            new_device.xbee_node = node;
            new_device.id = answer.id;
            new_device.name = answer.name;
            aREST.devices.push(new_device);
            console.log("Device added with ID: " + answer.id);
          }
        }
    });

    // Send ID command to get node ID & name
    node.send("/id\r");

  });

  // Stop discovery
  xbee.on("discoveryEnd", function() {
    console.log("...node discovery over");
  });
}

function Device () {
  this.type = "";
  this.address = "";
  this.speed = 0;
  this.name = "";
  this.id = "";
  this.serial_port = {};
  this.xbee_node = {};
  this.message = {};

  this.serialRequest = function(options, callback) {

    var answer;

    this.serial_port.once('data', function(data) {
        answer = JSON.parse(data.toString('utf8'));
        console.log('data received: ' + JSON.stringify(answer));
      });

    this.serial_port.write(Buffer(options.command + "\r"), function() {
      console.log('command sent via Serial');
      setTimeout(function() {
        if (typeof callback != 'undefined'){
          callback(false, 'response', answer);
        } 
      }, 250);
    });
  };

  this.xbeeRequest = function(command, callback) {

    var answer;

    this.xbee_node.once("data", function(data) {
        answer = JSON.parse(data.toString('utf8'));
        console.log('XBee data received: ' + JSON.stringify(answer));
    });

    this.xbee_node.send(command + "\r", function() {
      console.log('Command sent via XBee');
      setTimeout(function() {
        if (typeof callback != 'undefined'){
          console.log('Returned message: ' + JSON.stringify(answer));
          callback(false, 'response', answer);
        } 
      }, 250);
    });
  };

  this.openSerialPort = function() {

    this.serial_port = new SerialPort(this.address, {
      baudRate: this.speed,
      parser: serialport.parsers.readline("\n")
    }, function(error){
      if (error) {console.log('Serial port cannot be opened');}
    });

    var sp = this.serial_port;

    sp.on('open', function () {
      console.log('Serial port opened');
    });
  };

  this.getVariable = function(variable, callback){

    if (this.type == 'http'){
      console.log('Sending request to address: ' + this.address + ' for variable ' + variable);
      request({
        uri: 'http://' + this.address + '/' + variable,
        json: true,
        timeout: 1000
      }, callback);  
    }

    if (this.type == 'serial'){
      this.serialRequest({
        command: '/' + variable
      }, callback);
    }

    if (this.type == 'xbee'){
      this.xbeeRequest('/' + variable, callback);
    }
  };

  this.execFunction = function(the_function, parameters, callback){

    if (this.type == 'http'){
      console.log('Sending request to address: ' + this.address + ' for function ' + the_function);
      request({
        uri: 'http://' + this.address + '/' + the_function + "?params=" + parameters,
        json: true,
        timeout: 1000
      }, callback);  
    }

    if (this.type == 'serial'){
      this.serialRequest({
        command: '/' + the_function + "?params=" + parameters
      }, callback);
    }

    if (this.type == 'xbee'){
      this.xbeeRequest('/' + the_function + "?params=" + parameters, callback);
    }
  };

  this.analogRead = function(pin, callback) {

    if (this.type == 'http'){
      request({
        uri: 'http://' + this.address + '/analog/' + pin,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type == 'serial'){
      this.serialRequest({
        command: '/analog/' + pin
      }, callback);
    }

    if (this.type == 'xbee'){
      this.xbeeRequest('/analog/' + pin, callback);
    }
  };

  this.analogWrite = function(pin, value, callback) {

    if (this.type == 'http'){
      request({
        uri: 'http://' + this.address + '/analog/' + pin + '/' + value,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type == 'serial'){
      this.serialRequest({
        command: '/analog/' + pin + '/' + value
      }, callback);
    }

    if (this.type == 'xbee'){
      this.xbeeRequest('/analog/' + pin + '/' + value, callback);
    }
  };

  this.digitalRead = function(pin, callback) {

    if (this.type == 'http'){
      request({
        uri: 'http://' + this.address + '/digital/' + pin,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type == 'serial'){
      this.serialRequest({
        command: '/digital/' + pin
      }, callback);
    }

    if (this.type == 'xbee'){
      this.xbeeRequest('/digital/' + pin, callback);
    }
  };

  this.digitalWrite = function(pin, value, callback) {

    if (this.type == 'http'){
      request({
        uri: 'http://' + this.address + '/digital/' + pin + '/' + value,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type == 'serial'){
      this.serialRequest({
        command: '/digital/' + pin + '/' + value
      }, callback);
    }

    if (this.type == 'xbee'){
      this.xbeeRequest('/digital/' + pin + '/' + value, callback);
    }
  };
  
  this.takeSnapshot = function(callback) {

    if (this.type == 'http'){
      request({
        uri: 'http://' + this.address + '/camera/snapshot/',
        json: true,
        timeout: 1000
      }, callback);
    }
  };

  this.pinMode = function(pin, value, callback) {

    if (this.type == 'http'){
      request({
        uri: 'http://' + this.address + '/mode/' + pin + '/' + value,
        json: true,
        timeout: 1000
      }, callback);
    }
    
    if (this.type == 'serial'){
      this.serialRequest({
        command: '/mode/' + pin + '/' + value
      }, callback);
    }

    if (this.type == 'xbee'){
      this.xbeeRequest('/mode/' + pin + '/' + value, callback);
    }

  };
};

module.exports = function (app) {

  // Return all devices
  app.get('/devices', function(req,res) {

    var simple_devices = [];

    for (i = 0; i< aREST.devices.length; i++) {
      var simple_device = {};
      simple_device.id = aREST.devices[i].id;
      simple_device.name = aREST.devices[i].name;
      simple_device.type = aREST.devices[i].type;
      simple_device.address = aREST.devices[i].address;

      simple_devices.push(simple_device);
    }

    res.json(simple_devices);

  });

  // Command
  app.get('/:device/:command', function(req,res){

    console.log('Variable/function request sent to device: ' + req.params.device);

    // Get device
    device = aREST.getDevice(req.params.device);

    if (typeof(device) != 'undefined'){

      if (req.query.params) {

        // Execute function
        device.execFunction(req.params.command, req.query.params, function(error, response, body) {
          res.json(body);
        });

      }
      else {

        // Get variable
        device.getVariable(req.params.command, function(error, response, body) {
          res.json(body);
        });
      }
      
    }
    else {
      res.json({message: 'Device not found'});
    }
    
  });

  // Digital write
  app.get('/:device/digital/:pin/:value', function(req,res){

    console.log('Digital write request sent to device: ' + req.params.device);

    // Get device
    device = aREST.getDevice(req.params.device);

    if (typeof(device) != 'undefined'){

      // Send command
      device.digitalWrite(req.params.pin,req.params.value, function(error, response, body) {
        res.json(body);
      });
    }
    else {
      res.json({message: 'Device not found'});
    }
  });

  // Analog read
  app.get('/:device/analog/:pin/', function(req,res){

    console.log('Analog read request sent to device: ' + req.params.device);

    // Get device
    device = aREST.getDevice(req.params.device);

    // Get variable
    device.analogRead(req.params.pin, function(error, response, body) {
      res.json(body);
    });
  });

  // Analog Write
  app.get('/:device/analog/:pin/:value', function(req,res){

    console.log('Analog write request sent to device: ' + req.params.device);

    // Get device
    device = aREST.getDevice(req.params.device);

    // Get variable
    device.analogWrite(req.params.pin, req.params.value, function(error, response, body) {
      res.json(body);
    });
  });

  // Digital read
  app.get('/:device/digital/:pin/', function(req,res){

    console.log('Digital read request sent to device: ' + req.params.device);

    // Get device
    device = aREST.getDevice(req.params.device);

    // Get variable
    device.digitalRead(req.params.pin, function(error, response, body) {
      res.json(body);
    });
  });

  // Mode
  app.get('/:device/mode/:pin/:value', function(req,res){

    console.log('Mode request sent to device: ' + req.params.device);

    // Get device
    device = aREST.getDevice(req.params.device);

    // Get variable
    device.pinMode(req.params.pin,req.params.value, function(error, response, body) {
      res.json(body);
    });
  });
  
   // Take picture (for RPi)
  app.get('/:device/camera/snapshot', function(req,res){

    console.log('Snapshot request sent to device: ' + req.params.device);

    // Get device
    device = aREST.getDevice(req.params.device);

    // Take shot
    device.takeSnapshot(function(error, response, body) {
      res.json(body);
    });
  });
  
  return {
    devices: aREST.devices,
    addDevice: function(type, address, speed) {

      var new_device = new Device();
      new_device.type = type;
      new_device.address = address;

      if (typeof speed != 'undefined'){
        new_device.speed = speed;
      } 

      if (type == 'serial') {
        new_device.openSerialPort();
      }

      if (type == 'xbee') {
        initXBee(address);
      }

      if (type == 'serial' || type == 'http') {
        setTimeout(function() {
          new_device.getVariable('id', function(error, response, body) {
            if (error || typeof(body) == 'undefined') {console.log('Error adding the device');}
            else {
              new_device.id = body.id;
              new_device.name = body.name;
              aREST.devices.push(new_device);
              console.log("Device added with ID: " + body.id);
            }
          });
        }, 2000);
      }
    },
    listDevices: function() {
      for(var i = 0; i < aREST.devices.length; i++) {
        console.log(aREST.devices[i]);
      }
    },
    getDevices: function() {
      return aREST.devices;
    },
    getDevice: function(device) {
      for(var i = 0; i < this.devices.length; i++) {
        if (aREST.devices[i].id == device || aREST.devices[i].name == device) {
          return aREST.devices[i];
        }
      }
    },
    heartBeat: function(delay) {
      setInterval(function() {
        for(var i = 0; i < aREST.devices.length; i++) {
          console.log('Sending heartbeat to device: ' + aREST.devices[i].id);
          aREST.devices[i].getVariable('id');
        }
      }, delay);
    },
  };
};
