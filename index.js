var axios = require('axios');
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
  axios.get(url)
  .then(function (response) {
    parseString(response.data, function(err, result) {
      var find = 'result.response.level' + self.config.channel;
      var brightness = parseInt(eval(find));
      self.powerState = brightness > 0 ? true : false;
      self.log.info('State is ' + self.powerState);
      callback(null, self.powerState);
    })
  })
  .catch(function (error) {
    self.log.error(error);
  });
}

FNIPDimmer.prototype.getBrightness = function(callback) {
  var self = this;
  var parseString = require('xml2js').parseString;
  var url = 'http://' + self.config.ipaddress + '/status.xml';
  axios.get(url)
  .then(function (response) {
    parseString(response.data, function(err, result) {
      var find = 'result.response.level' + self.config.channel;
      self.brightness = parseInt(eval(find));
      self.log.info('Brightness is at ' + self.brightness);
      callback(null, self.brightness);
    })
  })
  .catch(function (error) {
    self.log.error(error);
  });
}

FNIPDimmer.prototype.setPowerState = function(on, callback) {
  var self = this;
  const action = on ? 'on' : 'off';
  if (action == 'off' || (action == 'on' && !self.powerState)) {
    var url = 'http://' + self.config.ipaddress + '/action.cgi';
    var data = 'action=' + action + '&output=' + self.config.channel;
    axios.post(url, data);
    self.log.info('Setting state to ' + on);
    self.powerState = on;
    callback(null);
  }
}

FNIPDimmer.prototype.setBrightness = function(brightness, callback, context) {
  var self = this;
  var url = 'http://' + self.config.ipaddress + '/action.cgi';
  var data = 'action=lev&output=' + self.config.channel + '&val=' + brightness;
  axios.post(url, data);
  self.brightness = brightness;
  self.log.info('Setting brightness to ' + brightness);
  callback(null);
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
  axios.get(url)
  .then(function (response) {
    parseString(response.data, function(err, result) {
      var channel = self.config.channel-1;
      var find = 'result.response.led' + channel;
      var state = parseInt(eval(find)) == 1 ? true : false;
      self.powerState = state;
      self.log.info('State is ' + self.powerState);
      callback(null, self.powerState);
    })
  })
  .catch(function (error) {
    self.log.error(error);
  });
}

FNIPRelay.prototype.setPowerState = function(on, callback) {
  var self = this;
  const action = on ? 'on' : 'off';
  if (action == 'off' || (action == 'on' && !self.powerState)) {
    var url = 'http://' + self.config.ipaddress + '/action.cgi';
    var data = 'action=' + action + '&output=' + self.config.channel;
    axios.post(url, data);
    self.log.info('Setting state to ' + on);
    self.powerState = on;
    callback(null);
  }
}

FNIPRelay.prototype.getServices = function() {
  return [this.lightService];
}
