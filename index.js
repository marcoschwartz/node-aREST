// A Node.js module for the aREST Arduino library
// Author: Marco Schwartz <marcolivier.schwartz@gmail.com>
// Modified by: Amir Off <www.amiroff.me> on Sep, 2018

const routes = require('express').Router();
const request = require('request');
const serialport = require("serialport").SerialPort;
const XBee = require('xbee-arest').XBee;

let aREST = {
  devices: [],
  deviceExist: function (device) {
    let device_exist = false;
    for (let i = 0; i < this.devices.length; i++) {
      if (this.devices[i].id === device || this.devices[i].name === device) {
        device_exist = true;
      }
    }
    return device_exist;
  },
  getDevice: function (device) {
    for (let i = 0; i < this.devices.length; i++) {
      if (this.devices[i].id === device || this.devices[i].name === device) {
        return this.devices[i];
      }
    }
  },
  getDeviceIndex: function (device) {
    for (let i = 0; i < this.devices.length; i++) {
      if (this.devices[i].id === device || this.devices[i].name === device) {
        return i;
      }
    }
  }
};

class Device {
  constructor() {
    this.type = "";
    this.address = "";
    this.speed = 0;
    this.name = "";
    this.id = "";
    this.serial_port = {};
    this.xbee_node = {};
    this.message = {};
  }

  serialRequest(options, callback) {

    let answer;

    this.serial_port.on('data', function (data) {
      answer = JSON.parse(data.toString('utf8'));
      console.log('data received: ' + JSON.stringify(answer));
    });

    this.serial_port.write(Buffer(options.command + "\r"), function () {
      console.log('command sent via Serial');
      setTimeout(function () {
        if (typeof callback !== 'undefined') {
          callback(false, 'response', answer);
        }
      }, 250);
    });
  };

  xbeeRequest(command, callback) {

    let answer;

    this.xbee_node.on("data", function (data) {

      try {
        answer = JSON.parse(answer + data.toString('utf8'));
      }
      catch (e) {
        answer = data.toString('utf8');
      }
      console.log('data received: ' + answer);

      console.log('XBee data received: ' + answer);
    });

    this.xbee_node.send(command + "\r", function () {
      console.log('Command sent via XBee');
      setTimeout(function () {
        if (typeof callback !== 'undefined') {
          console.log('Returned message: ' + JSON.stringify(answer));
          callback(false, 'response', answer);
        }
      }, 250);
    });
  };

  openSerialPort() {

    this.serial_port = new SerialPort(this.address, {
      baudRate: this.speed,
      parser: serialport.parsers.readline("\n")
    }, function (error) {
      if (error) {
        console.log('Serial port cannot be opened');
      }
    });

    let sp = this.serial_port;

    sp.on('open', function () {
      console.log('Serial port opened');
    });
  };

  getDevice(callback) {

    if (this.type === 'http') {
      request({
        uri: 'http://' + this.address,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/'
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/', callback);
    }

  };

  getVariable(variable, callback) {

    if (this.type === 'http') {
      console.log('Sending request to address: ' + this.address + ' for variable ' + variable);
      request({
        uri: 'http://' + this.address + '/' + variable,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/' + variable
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/' + variable, callback);
    }
  };

  execFunction(the_function, parameters, callback) {

    if (this.type === 'http') {
      console.log('Sending request to address: ' + this.address + ' for function ' + the_function);
      request({
        uri: 'http://' + this.address + '/' + the_function + "?params=" + parameters,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/' + the_function + "?params=" + parameters
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/' + the_function + "?params=" + parameters, callback);
    }
  };

  analogRead(pin, callback) {

    if (this.type === 'http') {
      request({
        uri: 'http://' + this.address + '/analog/' + pin,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/analog/' + pin
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/analog/' + pin, callback);
    }
  };

  analogWrite(pin, value, callback) {

    if (this.type === 'http') {
      request({
        uri: 'http://' + this.address + '/analog/' + pin + '/' + value,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/analog/' + pin + '/' + value
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/analog/' + pin + '/' + value, callback);
    }
  };

  digitalRead(pin, callback) {

    if (this.type === 'http') {
      request({
        uri: 'http://' + this.address + '/digital/' + pin,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/digital/' + pin
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/digital/' + pin, callback);
    }
  };

  digitalWrite(pin, value, callback) {

    if (this.type === 'http') {
      request({
        uri: 'http://' + this.address + '/digital/' + pin + '/' + value,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/digital/' + pin + '/' + value
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/digital/' + pin + '/' + value, callback);
    }
  };

  takeSnapshot(callback) {

    if (this.type === 'http') {
      request({
        uri: 'http://' + this.address + '/camera/snapshot/',
        json: true,
        timeout: 1000
      }, callback);
    }
  };

  pinMode(pin, value, callback) {

    if (this.type === 'http') {
      request({
        uri: 'http://' + this.address + '/mode/' + pin + '/' + value,
        json: true,
        timeout: 1000
      }, callback);
    }

    if (this.type === 'serial') {
      this.serialRequest({
        command: '/mode/' + pin + '/' + value
      }, callback);
    }

    if (this.type === 'xbee') {
      this.xbeeRequest('/mode/' + pin + '/' + value, callback);
    }

  };
}

String.prototype.endsWith = function (string) {
  return this.length >= string.length && this.substr(this.length - string.length) === string;
};

function initXBee(serial_port) {

  // Create XBee object
  let xbee = new XBee({
    port: serial_port,
    baudrate: 9600
  }).init();

  // Init XBee
  xbee.on("initialized", function (params) {
    xbee.discover();
    console.log("Node discovery starded...");
  });

  // Discover nodes
  xbee.on("newNodeDiscovered", function (node) {

    // If node is discovered
    console.log("Node %s discovered", node.remote64.hex);

    // Answer
    let answer;

    // Listen for data
    node.once("data", function (data) {
      console.log("%s> %s", node.remote64.hex, data);
      if (data.endsWith('\r\n')) {
        answer = JSON.parse(data.toString('utf8'));

        if (!(aREST.deviceExist(answer.id))) {

          let new_device = new Device();
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
    node.send("/id\r", function (err, status) {
      // Transmission successful if err is null
      if (err) {
        console.log(err);
      }
      ;
    });

  });

  // Stop discovery
  xbee.on("discoveryEnd", function () {
    console.log("...node discovery over");
  });
}

routes.post('/api/add/device/', function (req, res) {
  let new_device = new Device();
  new_device.type = req.body.type;
  new_device.address = req.body.address;

  if (typeof speed !== 'undefined') {
    new_device.speed = req.body.speed;
  }

  if (req.body.type === 'serial') {
    new_device.openSerialPort();
  }

  if (req.body.type === 'xbee') {
    initXBee(address);
  }

  if (req.body.type === 'serial' || req.body.type === 'http') {
    setTimeout(function () {
      new_device.getVariable('id', function (error, response, body) {
        if (error || typeof(body) === 'undefined') {
          console.log('The device is offline and cannot be added!');
          res.status(404).json({'error': 'The device is offline and cannot be added!'});
        }
        else {
          new_device.id = body.id;
          new_device.name = body.name;
          new_device.hardware = body.hardware;
          aREST.devices.push(new_device);

          // Send response headers back to client
          res.status(200).json({
            'address': 'req.body.address',
            'id': body.id
          });
          console.log("Device added with ID: " + body.id);
        }
      });
    }, 2000);
  }

});

// Return all devices
routes.get('/api/devices', function (req, res) {

  let simple_devices = [];

  for (let i = 0; i < aREST.devices.length; i++) {
    let simple_device = {};
    simple_device.id = aREST.devices[i].id;
    simple_device.name = aREST.devices[i].name;
    simple_device.hardware = aREST.devices[i].hardware;
    simple_device.type = aREST.devices[i].type;
    simple_device.address = aREST.devices[i].address;

    simple_devices.push(simple_device);
  }

  res.json(simple_devices);

});

// Return a specific device
routes.get('/api/:device', function (req, res) {

  console.log('Data sync request sent to device: ' + req.params.device);

  let device = aREST.getDevice(req.params.device);

  if (typeof(device) !== 'undefined') {

    // Get status
    device.getDevice(function (error, response, body) {
      res.json(body);
    });

  }
  else {
    res.json({message: 'Device not found'});
  }
});

// Command
routes.get('/api/:device/:command', function (req, res) {

  // Get device
  let device = aREST.getDevice(req.params.device);

  if (typeof(device) !== 'undefined') {

    if (req.query.params) {

      console.log('Function request sent to device: ' + req.params.device);
      // Execute function
      device.execFunction(req.params.command, req.query.params, function (error, response, body) {
        res.json(body);
      });

    }
    else {

      console.log('Variable request sent to device: ' + req.params.device);
      // Get variable
      device.getVariable(req.params.command, function (error, response, body) {
        res.json(body);
      });
    }

  }
  else {
    res.json({message: 'Device not found'});
  }

});

// Digital write
routes.get('/api/:device/digital/:pin/:value', function (req, res) {

  console.log('Digital write request sent to device: ' + req.params.device);

  // Get device
  let device = aREST.getDevice(req.params.device);

  if (typeof(device) !== 'undefined') {

    // Send command
    device.digitalWrite(req.params.pin, req.params.value, function (error, response, body) {
      res.json(body);
    });
  }
  else {
    res.json({message: 'Device not found'});
  }
});

// Analog read
routes.get('/api/:device/analog/:pin/', function (req, res) {

  console.log('Analog read request sent to device: ' + req.params.device);

  // Get device
  let device = aREST.getDevice(req.params.device);

  // Get variable
  device.analogRead(req.params.pin, function (error, response, body) {
    res.json(body);
  });
});

// Analog Write
routes.get('/api/:device/analog/:pin/:value', function (req, res) {

  console.log('Analog write request sent to device: ' + req.params.device);

  // Get device
  let device = aREST.getDevice(req.params.device);

  // Get variable
  device.analogWrite(req.params.pin, req.params.value, function (error, response, body) {
    res.json(body);
  });
});

// Digital read
routes.get('/api/:device/digital/:pin/', function (req, res) {

  console.log('Digital read request sent to device: ' + req.params.device);

  // Get device
  let device = aREST.getDevice(req.params.device);

  // Get variable
  device.digitalRead(req.params.pin, function (error, response, body) {
    res.json(body);
  });
});

// Pin mode
routes.get('/api/:device/mode/:pin/:value', function (req, res) {

  console.log('pinMode request sent to device: ' + req.params.device);

  // Get device
  let device = aREST.getDevice(req.params.device);

  // Get variable
  device.pinMode(req.params.pin, req.params.value, function (error, response, body) {
    res.json(body);
  });
});

// Take picture (for RPi)
routes.get('/api/:device/camera/snapshot', function (req, res) {

  console.log('Snapshot request sent to device: ' + req.params.device);

  // Get device
  let device = aREST.getDevice(req.params.device);

  // Take shot
  device.takeSnapshot(function (error, response, body) {
    res.json(body);
  });
});

// Exporting app routs to express.js
module.exports = routes;
