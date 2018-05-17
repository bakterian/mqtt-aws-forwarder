# MQTT-AWS-FORWARDER
**MQTT things data to AWS shadow forwader**

## Release 1.0.0
Initial release of code and configuration examplews.

Was tested on ubuntu 16 and Win 7 with two IOT Things providing periodic measurment data.

## How to Install
Clone or unzip repository.
Open shell or the windows cmd, cd inside and type:
```js
npm install
```
## Configuration
All of the broker specific data and message formating are to be kept in a seperate js file.
Provide a valid config file location and fill connection details.

## How to run
Open shell or the windows cmd, cd inside and type:
```js
node mqttForwarder.js
```
