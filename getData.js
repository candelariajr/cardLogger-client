//Requirements:
var jsonfile = require('jsonfile');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

//get access to the config file
var file = 'config.json';
var configFileState = jsonfile.readFileSync(file);
var offlineState = true;

/*  Template for using XHR in Node. 
function getLocations(){
	var targetUrl = "http://" + configFileState.server_addr + "/" + configFileState.app + "/";
	var oReq = new XMLHttpRequest();
	oReq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			processResults(oReq.responseText);
		}
	};
	oReq.open('GET', targetUrl + configFileState.configuration, true);
	oReq.responseType = 'json';
	oReq.send();
}*/

webRequest('postTest.php', 'POST', {
		"data" : "stuff", "dudes" : "dinos"}, processLocationResults);
webRequest('getLocations.php', 'GET', null, processLocationResults);
console.log("Showing that execution is continuting");
function thefunction(){console.log("Here's a function");}
thefunction();
console.log(offlineState);

/*
Web handler: 
triggers a PHP file server side and returns its results: 
targetFile : the name of the php file 
requestType : 'GET' or 'POST'
payload : JSON-formatted data to be sent to the server with a POST requestType
callBack : this function will be called back with the reply as it's argument
*/
function webRequest(targetFile, requestType, payload, callBack){
	var targetUrl = "http://" + configFileState.server_addr + "/" + configFileState.app + "/";
	var oReq = new XMLHttpRequest();
	oReq.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			offlineTimeout = null;
			offlineState = false;
			callBack(oReq.responseText);
		}else{
			console.log(this.readyState + " : " + this.status);
		}
	};
	var offlineTimeout = setTimeout(function(){
		console.log("offline");
		oReq = null;
		}, 1000);
	oReq.open(requestType, targetUrl + targetFile, true);
	if(payload != null){
		oReq.setRequestHeader('Content-Type', 'application/json');
	}
	oReq.responseType = 'json';
	oReq.send(JSON.stringify(payload));	
}

function processLocationResults(results){
	console.log(results);
	var resultArray = JSON.parse(results);
    if(resultArray.hasOwnProperty('error')){
		//console.log(resultArray.error);
    }
	else{
		populateConfigFile(JSON.parse(results));
	}
}

function populateConfigFile(results){
	var locationArray = [];
	for(var i = 0; i < results.length; i++){
		locationArray.push(results[i].location_name);
	}
	configFileState.locations = locationArray;
	jsonfile.writeFile(file, configFileState, function(err){
		if(err!= null){
			console.log(err);
		}
	}); 
}
