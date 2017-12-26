# P5 FutureNow plugins for homebridge

Homebridge support for P5 FutureNow units as light accessories


## Requirements

* FutureNow unit must have static IP


## Example

```javascript
{
  "bridge": {
    "name": "Homebridge",
    "username": "AB:CD:EF:12:34:45",
    "port": 12345,
    "pin": "012-34-567"
  },    

  "description": "Example config",

  "accessories": [
    {
      "accessory": "fnip6x2ad-output",
      "name" : "Kitchen Spotlights",
      "ipaddress": "192.168.1.150",
      "port": 7078,
      "channel": 1
    },
    {
      "accessory": "fnip8x10a-output",
      "name" : "Main Bathroom Lights",
      "ipaddress": "192.168.1.151",
      "port": 7078,
      "channel": 1
    },
  ],

  "platforms": [
  ]
}
```
