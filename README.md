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

  "platforms": [
    {
      "platform": "FutureNow",
      "device_type": "fnip6x2ad",
      "ipaddress": "192.168.1.150",
      "port": 7078,
      "http_user": "admin",
      "http_pass": "futurenow",
      "output_channels": [
        {
          "name": "Kitchen Spotlights",
          "dimmable": 1,
          "channel": 1
        },
        {
          "name": "Livingroom Spotlights",
          "dimmable": 1,
          "channel": 2
        }
      ]
    },
    {
      "platform": "FutureNow",
      "device_type": "fnip8x10a",
      "ipaddress": "192.168.1.151",
      "port": 7078,
      "http_user": "admin",
      "http_pass": "futurenow",
      "output_channels": [
        {
          "name": "Bathroom lights",
          "channel": 1
        },
        {
          "name": "Sauna lights",
          "channel": 2
        }
      ]
    }
  ]
}
```
