# MQTT-AWS-FORWARDER
**MQTT things data to AWS shadow forwader**

This node js application comes in handy when not all of your things comply with
the AWS topic and json formatting specification and a the things code will not be changed.

What this tool does is to subscribe on Thing topics and forward these messages via MQTT
to the IOT Shadow devices.

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
A "exampleMqttForwarderConfig.js" config file was attached for reference.
Fill in with your AWS and mqtt browser data.
Update the config file location in the main mqttFowarder.js file.

## How to run
Open shell or the windows cmd, cd inside and type:
```js
node mqttForwarder.js -c <PATH_TO_CONFIG_FILE>
```
