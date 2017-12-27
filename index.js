var request = require('request');
var net = require('net');
var xml2js = require('xml2js');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-fnip6x2ad-output", "fnip6x2ad-output", FNIPDimmer);
  homebridge.registerAccessory("homebridge-fnip8x10a-output", "fnip8x10a-output", FNIPRelay);
}

function FNIPDimmer(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"];
  this.brightness = 0;
  this.powerState = false;

  this.lightService = new Service.Lightbulb(this.name);
  this.lightService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));
  this.lightService
      .getCharacteristic(Characteristic.Brightness)
      .on('get', this.getBrightness.bind(this))
      .on('set', this.setBrightness.bind(this));
}

FNIPDimmer.prototype.getPowerState = function(callback) {
  var self = this;
  var parseString = require('xml2js').parseString;
  var url = 'http://' + self.config.ipaddress + '/status.xml';
  request.get(url, function (error, response, body) {
    parseString(body, function(err, result) {
      var find = 'result.response.level' + self.config.channel;
      var brightness = parseInt(eval(find));
      self.powerState = brightness > 0 ? true : false;
      self.log.debug('State is ' + self.powerState);
      callback(null, self.powerState);
    });
  });
}

FNIPDimmer.prototype.getBrightness = function(callback) {
  var self = this;
  var parseString = require('xml2js').parseString;
  var url = 'http://' + self.config.ipaddress + '/status.xml';
  request.get(url, function (error, response, body) {
    parseString(body, function(err, result) {
      var find = 'result.response.level' + self.config.channel;
      self.brightness = parseInt(eval(find));
      self.log.debug('Brightness is at ' + self.brightness);
      callback(null, self.brightness);
    });
  });
}

FNIPDimmer.prototype.setPowerState = function(on, callback) {
  var self = this;
  const action = on ? 'LEV,' + self.config.channel + ',' + self.brightness : 'OFF,' + self.config.channel;
  if (!on || (on && !self.powerState)) {
    self.log.debug('Setting state to ' + on);
    var client = new net.Socket();
    client.connect(self.config.port, self.config.ipaddress, function() {
      client.setTimeout(1000);
      client.write('FN,' + action + "\r\n");
    });
    client.on('data', function(data) {
      client.destroy(); // kill client after server's response
    });
    client.on('close', function() {
      self.powerState = on;
      callback();
    });
    client.on('error', function (err) {
      client.destroy();
      self.log.error(err);
    });
  }
  else {
    callback();
  }
}

FNIPDimmer.prototype.setBrightness = function(brightness, callback, context) {
  var self = this;
  var client = new net.Socket();
  client.connect(self.config.port, self.config.ipaddress, function() {
    client.setTimeout(1000);
    client.write('FN,LEV,' + self.config.channel + ',' + brightness + "\r\n");
  });
  client.on('data', function(data) {
    client.destroy(); // kill client after server's response
  });
  client.on('error', function (err) {
    client.destroy();
    self.log.error(err);
  });
  self.brightness = brightness;
  self.log.debug('Setting brightness to ' + brightness);
  callback();
}

FNIPDimmer.prototype.getServices = function() {
  return [this.lightService];
}

function FNIPRelay(log, config) {
  this.log = log;
  this.config = config;
  this.name = config["name"];

  this.lightService = new Service.Lightbulb(this.name);
  this.lightService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));
}

FNIPRelay.prototype.getPowerState = function(callback) {
  var self = this;
  var parseString = require('xml2js').parseString;
  var url = 'http://' + self.config.ipaddress + '/status.xml';
  var channel = self.config.channel-1;
  request.get(url, function (error, response, body) {
    parseString(body, function(err, result) {
      var find = 'result.response.led' + channel;
      var state = parseInt(eval(find)) == 1 ? true : false;
      self.powerState = state;
      self.log.debug('State is ' + self.powerState);
      callback(null, self.powerState);
    });
  });
}

FNIPRelay.prototype.setPowerState = function(on, callback) {
  var self = this;
  const action = on ? 'ON' : 'OFF';
  if (action == 'OFF' || (action == 'ON' && !self.powerState)) {
    self.log.debug('Setting state to ' + on);
    var client = new net.Socket();
    client.connect(self.config.port, self.config.ipaddress, function() {
      client.setTimeout(1000);
      client.write('FN,' + action + ',' + self.config.channel + "\r\n");
    });
    client.on('data', function(data) {
      client.destroy(); // kill client after server's response
    });
    client.on('close', function() {
      self.powerState = on;
      callback();
    });
    client.on('error', function (err) {
      client.destroy();
      self.log.error(err);
    });
  }
  else {
    callback();
  }
}

FNIPRelay.prototype.getServices = function() {
  return [this.lightService];
}
