var request = require('request');
var net = require('net');
var xml2js = require('xml2js');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform("homebridge-futurenow", "FutureNow", FutureNowPlatform);
}

function FutureNowPlatform(log, config) {
  this.log = log;
  var conf = [];

  this.outputChannels = config["output_channels"];
  
  conf.deviceType = config["device_type"];
  conf.ipAddress = config["ipaddress"];
  conf.port = config["port"];
  conf.httpAuthUser = config["http_user"];
  conf.httpAuthPass = config["http_pass"];
  
  this.config = conf;
}

function FutureNowAccessory(log, device, config) {
  this.name = device.name;
  this.channel = device.channel;
  this.isDimmer = device.dimmable;
  this.powerState = 0;
  this.brightness = 0;
  this.config = config;
}

function onErr(err) {
  console.log(err);
  return 1;
}

FutureNowPlatform.prototype = {
  accessories: function(callback) {
    this.log("Adding FutureNow output channels as devices...");
    var self = this;

    var getLights = function () {
      var foundAccessories = [];
      if (self.outputChannels) {
        for (var i=0; i<self.outputChannels.length; ++i) {
          var accessory = new FutureNowAccessory(self.log, self.outputChannels[i], self.config);
          foundAccessories.push(accessory);
        }
        callback(foundAccessories);
      }
    };

    getLights();
  },
};

FutureNowAccessory.prototype = {  // Get Services

  setPowerState: function(on, callback) {
    var self = this;
    if (!on || (on && !self.powerState)) {
      if (self.config.deviceType == 'fnip8x10a') {
        var action = on ? 'ON,' + self.channel : 'OFF,' + self.channel;
      } else {
        var action = on ? 'LEV,' + self.channel + ',' + self.brightness : 'OFF,' + self.channel;
      }
      var client = new net.Socket();
      client.connect(self.config.port, self.config.ipAddress, function() {
        client.setTimeout(1000);
        client.write('FN,' + action + "\r\n");
      });
      client.on('data', function(data) {
        client.destroy(); // kill client after server's response
      });
      client.on('close', function() {
        if (!on) self.powerState = 0;
        callback();
      });
      client.on('error', function (err) {
        client.destroy();
        console.log(err);
      });
    }
    else {
      callback();
    }
  },

  getPowerState: function(callback) {
    var self = this;
    var parseString = require('xml2js').parseString;
    var httpAuth = self.config.httpAuthUser ? self.config.httpAuthUser + ':' + self.config.httpAuthPass + '@' : '';
    var url = 'http://' + httpAuth + self.config.ipAddress + '/status.xml';
    if (self.config.deviceType == 'fnip8x10a') {
      var channel = self.channel-1;
      var find = 'result.response.led' + channel;
    } else {
      var channel = self.channel;
      var find = 'result.response.level' + channel;
    }
    request.get(url, function (error, response, body) {
      parseString(body, function(err, result) {
        self.powerState = parseInt(eval(find));
        callback(null, self.powerState < 1 ? false : true);
      });
    });
  },

  getBrightness: function(callback) {
    var self = this;
    var parseString = require('xml2js').parseString;
    var httpAuth = self.config.httpAuthUser ? self.config.httpAuthUser + ':' + self.config.httpAuthPass + '@' : '';
    var url = 'http://' + httpAuth + self.config.ipAddress + '/status.xml';
    request.get(url, function (error, response, body) {
      parseString(body, function(err, result) {
        var find = 'result.response.level' + self.channel;
        self.brightness = parseInt(eval(find));
        callback(null, self.brightness);
      });
    });
  },

  setBrightness: function(brightness, callback, context) {
    var self = this;
    var client = new net.Socket();
    client.connect(self.config.port, self.config.ipAddress, function() {
      client.setTimeout(1000);
      client.write('FN,LEV,' + self.channel + ',' + brightness + "\r\n");
    });
    client.on('data', function(data) {
      client.destroy(); // kill client after server's response
    });
    client.on('error', function (err) {
      client.destroy();
      console.log(err);
    });
    self.brightness = brightness;
    callback();
  },

  getServices: function() {
    var self = this;

    this.lightService = new Service.Lightbulb(this.name);
    this.lightService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));
    if (this.isDimmer) {
      this.lightService
        .getCharacteristic(Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));
    }
    return [this.lightService];
  },

};
