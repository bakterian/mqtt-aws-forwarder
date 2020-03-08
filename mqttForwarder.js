// ============================ RESOURCES ================================
var mqtt = require('mqtt');
var awsDeviceModule = require('aws-iot-device-sdk/device');
var moment = require('moment-timezone');
const argParser = require('./argParser').parser;
const fs = require('fs');
// =======================================================================

// ============================ GLOBALS ==================================
const args = argParser.parseArgs();
const configFileRaw = fs.readFileSync(args.config, 'utf-8');
var config = JSON.parse(configFileRaw);

/* Store object in a JSON file synchronisly */ 
//const jsonString = JSON.stringify(testObj, null, 2)
//fs.writeFileSync('./out.json', jsonString)

var shadowConnections = [];
var i;
for (i in config.shadows)
{
	shadowConnections.push(awsDeviceModule(config.shadows[i].brokerOptions));
};

var client = mqtt.connect(config.thingsBroker.url,config.thingsBroker.options);
var subscribed = false;
// =======================================================================


// ==================== HELPER FUNCTIONS =================================
function getDateTime() 
{
    return moment().tz(config.time.zone).format(config.time.format);
}

function forwardThingPub(topic, message)
{
	if(typeof(message) != "undefined") 
	{//acounting for broken messages
		for (var i in config.shadows)
		{
			if(topic == config.shadows[i].thingTopic)
			{
				var msgJson;		
				try
				{
					msgJson = JSON.parse(message.toString());
				}
				catch(e)
				{
					console.log("Error was captured during parsing: " + e.message);
					continue;
				}
				var payload = {};
				payload["deviceId"] = config.shadows[i].deviceId;
				payload["time"] = getDateTime();
				
				for(var o in config.shadows[i].payloadChunks)
				{
					var p = config.shadows[i].payloadChunks[o];	
					if(!(p.thingId in msgJson)) 
					{ //in case of missing data put -1
						payload[p.shadowId] = -1;
					}
					else
					{
						payload[p.shadowId] = msgJson[p.thingId];
					}
				};
					
				var shadowJson = 
				{
					"state":
					{	
						"reported": payload
					}
				};
				shadowConnections[i].publish(config.shadows[i].updateTopic,JSON.stringify(shadowJson));
			}
		}
	}
}

function handleShadowUpdateAck(topic, message, packet) 
{
	for (var i in config.shadows)
	{
		if(topic == config.shadows[i].updateAcceptedTopic)
		{
			console.log(config.shadows[i].deviceId + " succesfully forwarded to shadow.");
		}
		else if(topic == config.shadows[i].updateRejectedTopic)
		{
			console.log(config.shadows[i].deviceId + " forward to shadow FAILED!!!");
			console.log(message.toString());
		}
	}
}

function subsribeToThingTopics()
{
	for (var i in config.shadows)
	{
		client.subscribe(config.shadows[i].thingTopic);
	};
}

function subsribeToShadowTopics()
{
	for (var i in config.shadows)
	{
		shadowConnections[i].subscribe(config.shadows[i].updateAcceptedTopic);
		shadowConnections[i].subscribe(config.shadows[i].updateRejectedTopic);
	};
}
// =======================================================================


// =============== Messages to and from Things ===========================
client.on('connect', function()
{
	console.log("Connected to Mqtt Broker");
	if(subscribed != true)
	{
		subsribeToThingTopics();
		subsribeToShadowTopics();
		subscribed = true;
		console.log("Subsriptions are done");
	}
});

client.on('message', function (topic, message)
{
	console.log(message.toString());
	forwardThingPub(topic,message);
});

client.on('error', function(error)
{
	console.log("Error received");
	console.log(error);
});
// =======================================================================


// =============== Messages to and from AWS Thing Shadows ================
for (var i in shadowConnections)
{
	shadowConnections[i].on('message', function(topic, message, packet) 
	{
		handleShadowUpdateAck(topic, message, packet);
	});
};
// =======================================================================