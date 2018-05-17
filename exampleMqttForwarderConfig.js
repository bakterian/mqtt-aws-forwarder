var config = {};

config.time = 
{
	zone: "Europe/Warsaw", 
	fotmat:"YYYY-MM-DD HH:mm:ss ZZ"
};

config.thingsBroker =
{
	url: "brokerUrl",
	options: 
	{
		"port":3033,
		"username":"brokerUserName",
		"password":"brokerPass",
		"protocolVersion":4
	}
};

config.shadows = 
[
	{
		deviceId : "deviceId",
		thingTopic : "AddthingsTopic",
		updateTopic : "shadowUpdateTopic",
		updateAcceptedTopic : "shadowUpdateAcceptedTopic",
		updateRejectedTopic : "shadowUpdateRejectedTopic",
		brokerOptions :
		{
			keyPath: "aws private key location",
			certPath: "aws cert key location",
			caPath: "aws root-ca key location",
			host: "broker url"
		},
		payloadChunks :
		[
			{ shadowId: "shadowId1" , thingId: "thingId1" },
			{ shadowId: "shadowId2" , thingId: "thingId2" },
			{ shadowId: "shadowId3" , thingId: "thingId3" }			
		]
	},
	{
		deviceId : "SecondDdevice",
		thingTopic : "AddthingsTopic",
		updateTopic : "shadowUpdateTopic",
		updateAcceptedTopic : "shadowUpdateAcceptedTopic",
		updateRejectedTopic : "shadowUpdateRejectedTopic",
		brokerOptions :
		{
			keyPath: "aws private key location",
			certPath: "aws cert key location",
			caPath: "aws root-ca key location",
			host: "broker url"
		},
		payloadChunks :
		[
			{ shadowId: "shadowId1" , thingId: "thingId1" },
			{ shadowId: "shadowId2" , thingId: "thingId2" },
			{ shadowId: "shadowId3" , thingId: "thingId3" }			
		]
	}
];


module.exports = config;