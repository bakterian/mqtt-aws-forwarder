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

function isDictionary(obj)
{
   return ((typeof obj==='object') && 
           (obj!==null) && 
           (!Array.isArray(obj)) && 
           (!(obj instanceof Date)));
}

function getPayloadChunk(pathPieces, obj)
{
  var res = {isValid: false, val: -1};

  if((typeof(obj) != "undefined") &&
      (Array.isArray(pathPieces)) &&
      (pathPieces.length > 0))
  {
    var searchedPiece = pathPieces[0];
		if(isDictionary(obj))
    {
      for(let [k, v] of Object.entries(obj))
      {
        if(k == searchedPiece)
        {
          if(pathPieces.length == 1)
          {//found the payload chunk
            res.isValid = true;
            res.val = v;
          }
          else
          { //remove one piece from the array and recurse deeper
            pathPieces.shift()
            res = getPayloadChunk(pathPieces, v)
          }
        }
        if( res.isValid == true ) break;
      }
    }
    else if(Array.isArray(obj))
    {
      for(var i in obj)
      { //verify all array elements
        res = getPayloadChunk(pathPieces, obj[i])
        if( res.isValid == true ) break;
      }
    }
    else
    {
      console.log("[getPayloadChunk()] error obj type: " + typeof(obj))
    }
  }

  else
  {
    console.log("[getPayloadChunk()] wrong input args.")
  }

  return res;
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
				var errorFound = false;

				for(var o in config.shadows[i].payloadChunks)
				{
					var payloadChunk = config.shadows[i].payloadChunks[o];
					var chunkPathPieces = payloadChunk.thingId.split('.');
					var payloadChunkValue = getPayloadChunk(chunkPathPieces, msgJson);
					if(payloadChunkValue.isValid == false)
					{
						var currTime = getDateTime();
						console.log("[ERROR] captured at " + currTime + "\nTopic: " + topic + "\nMessage: " + message +
                       "\nWhile searching for the value of chunk: " + payloadChunk.thingId);
            errorFound = true;
            break;
					}
					payload[payloadChunk.shadowId] = payloadChunkValue.val;
				};

				if(errorFound == false)
        {
					var shadowJson = 
					{
						"state":
						{	
							"reported": payload
						}
					};
					shadowConnections[i].publish(config.shadows[i].updateTopic,JSON.stringify(shadowJson));
        }
        else
        {
          console.log("No publishing because errors in message payload have been found.");
				}
				
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
