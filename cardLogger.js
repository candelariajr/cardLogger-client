//closure used to maintain the active state of the application
//throughout its lifecycle.
var applicationStateObject = function(){
	//closure used to maintain the on/offline status of the application
	var offlineState = true;
	//data for location maintenance
	var locations = ['default'];
	locationIndex = 0;
	
	var offlineTransactions = [];
	
	return{
		//getters and setters for offline status
		getOfflineState: function(){
				return offlineState;
		},
		setOfflineState: function(setState){
				if(setState != true && setState != false){
					throw{
						"name": "IllegalArguemntException",
						"message" : "setOfflineState takes args of true or false only. Given: " + setState
					}
				}else{
					offlineState = setState;
				}
		},
		//getters and setters for location related data
		setLocations: function(locationArray){
				if(locationArray instanceof Array){				
					locations = locationArray;
				}else{
					console.log("Unable to set locations array equal to an object that isn't an array!");
				}
		},
		setLocationIndex: function(index){
				if(index < 0 || index > locations.length - 1){
					console.log("Invalid array index. Should be between 0 and " + (locations.length - 1))
				}else{
					locationIndex = index;
				}
		},
		incrementLocationIndex: function(){
				if((locationIndex + 1) > locations.length - 1){
					locationIndex = 0;
				}else{
					locationIndex++;
				}
				return locations[locationIndex];
		},
		getLocationIndex: function(){
				return index;
		},
		getLocationName: function(){
				return locations[locationIndex];
		},
		//getters and setters for offline transactions
		addOfflineTransaction: function(cardNumber){
			var transaction = {
				"cardNumber" : cardNumber,
				"location" : getLocation(),
				//remember time is in this format: '2011-11-04 10:24:31'
				"time" : 3
			}
			offlineTransactions.push(transaction);
		},
		getOfflineTransactions: function(){
			var returnedTransactions = offlineTransactions;
			offlineTransactions = [];
			return returnedTransactions;
		}
	};
}

/*
TODO: DO NOT PUBLISH THIS CRAP!
This is all test code that is supposed to be REMOVED
*/
var applicationState = applicationStateObject();
//Test on offline state
console.log(applicationState.getOfflineState());
//applicationState.setOfflineState(4);
console.log(applicationState.getOfflineState());
applicationState.setOfflineState(false);
console.log(applicationState.getOfflineState());

//Test on locations
console.log(applicationState.getLocationName());
applicationState.setLocations(['Karl','Bryan','Will','Hunter']);
applicationState.setLocationIndex(2);
console.log(applicationState.getLocationName());
applicationState.incrementLocationIndex();
applicationState.incrementLocationIndex();
console.log(applicationState.getLocationName());


/*
END TEST CODE
*/

/*
IMBEDDED OBJECTS:
*/

var Gpio = require('onoff').Gpio;
/*
 * Object that generates event handlers for each button. Can generate a
        * limitless number of buttons. Designed for assigning functions to buttons
        * at will for open extension:
        *
        * pin: this pin associated with the button
        * direction: the direction of current associated with button being pressed
        * action: the curve of voltage to watch for
        * event: reference to function triggered on button press detection
        *
        * Note: to prevent excessive commands from queueing up in the system,
        * a button has an assigned timeout of 500ms. After a button is pressed, you can't
        * press it again for that timeout period. To change this, you can call the
        * changeTimeout(x) function upon instantiation of the button handler object.
        * */
var buttonGenerator = (function(pin, direction, action, event){
    function GetButton(pin, direction, action, event){
        this.button = new Gpio(pin, direction, action);
		var timeout = 1000;
        this.pin = pin;
        this.direction = direction;
        this.action = action;
        this.event = event;
		var eventState = false;

		var callEvent = function(){
		    event();
		    setTimeout(function(){
			eventState = false;	
		    }, timeout);
		}

		this.button.watch(function(err, value){
		    if(!eventState){
			eventState = true;
			//process.stdout.write("Button on: " + pin + " pressed\n" );
			callEvent();
		    }else if(eventState){
		    	console.log("Event currently executing on pin" + pin + "!");
		    }
		});
		
        /* Outputs the core attributes to the console. This is for debugging only.
        * */
        this.getAttributes = function(){
            console.log(this.pin + " " + this.direction + " " + this.action)
        };
        /* Passes an external reference to a function to the event attribute.
        * */
        this.addEvent = function(event){
			this.event = event;
        };
        /* Sets the timeout between accepting button presses
        * */
        this.assignTimeout = function(value){
            timeout = value;
        };
        /* Calls the event if timeout is not in effect
        * */
        this.runEvent = function(){
            if(this.event != null && !eventState){
                this.event();
                eventState = true;
                setTimeout(function(){
                    eventState = false;
                }, this.timeout);
            }else if(eventState){
                console.log("Unable. Command currently executing");
            }else{
                console.log("There is no event assigned to this button press!");
            }
        };
		var runEvent = function(){
			this.runEvent();
		}
        return this;
    }
    return {
        getButton: function(pin, direction, action, event){
            return new GetButton(pin, direction, action, event);
        }
    }
})();

function pingServer(){
    console.log("Refresh Data...");
}

function changeLocation(){
    console.log("Change Location...");
	applicationState.incrementLocationIndex();
	console.log("Location now: " + applicationState.getLocationName());
	displayHandler.addToDisplay('Location', applicationState.getLocationName());
}

function restartApplication(){
    console.log("Restarting Application...")
}

//Test Buttons
var pingButton = buttonGenerator.getButton(21, 'in', 'rising', pingServer);
var locationButton = buttonGenerator.getButton(20, 'in', 'rising', changeLocation);
var resetButton = buttonGenerator.getButton(25, 'in', 'rising', restartApplication);




var displayHandlerGenerator = (function(){
    /*Return the handler
    * */
    function GetDisplayHandler(){
        //debug mode outputs data to the console during execution
        this.debugState = true;
        //queue containing a series of arrays [top, bottom] of text to display
        var displayQueue = [];
		//boolean stating whether the handler is using the interrupt text
        var interruptState = false;
		//storage of the interrupt text
		var interruptText = [];
		//how frequently the queue is checked and the next entity is removed
        var timeOut = 1000;
		//You can add a single screens worth of data to the front of the queue
		//this is mainlt for real time info and important updates.
		this.interrupt = function(item1, item2){
		    interruptState = true;
		    interruptText = [item1, item2];
		};
        //creates the array of the top line (item1) and bottom line (item2)
        //and adds it to the back of the queue
        this.addToDisplay =  function(item1, item2){
            displayQueue.push([item1, item2]);
                if(this.debugState){
                    console.log("Item: " + item1 +","  + item2 + " added to queue");
                }
            };
            //returns the number of entities in the queue currently
            this.getQueueSize = function(){
                if(this.debugState){
                    console.log(displayQueue.length);
                }
                return displayQueue.length;
            };
            //removes the most recently added element from the queue and sends it to the
            //printToDisplay function to be output to the display.
            function display(){
				if(interruptState){
					interruptState = false;
					printToDisplay(interruptText[0], interruptText[1]);
				}else  if(displayQueue.length >= 1){
					var displayText = displayQueue.shift();
                    printToDisplay(displayText[0], displayText[1]);
                }
            }
            //LCD driver and managment code for outputing data to the display
            function printToDisplay(line1, line2){
                console.log(line1);
                console.log(line2);
                //lcd.clear();
                var lcd = require('lcd');
                lcd = new lcd({
                    rs: 26,
                    e: 24,
					//NOTE HOW YOUR WIRING IS CONFIGURED!!!!!!
                    data: [22, 18, 16, 12],
                    cols: 16,
                    rows: 2
                });
                var localLine1 = line1;
                var localLine2 = line2;
                lcd.on('ready', function(){
                    lcd.setCursor(0,0);
                    lcd.print(localLine1);
                    lcd.once('printed', function(){
                        lcd.setCursor(0,1);
                        lcd.print(localLine2);
                        lcd.once('printed', function(){
                        });
                    });
                });
                //lcd = null;
            }
            //Adds an event listener to call back on timeOut milliseconds to run the display
            //function.
            var interval = setInterval(function(){
                if(displayQueue.length > 0){
                    display();
                }
            },timeOut);
            //Stops the autonomous callback. This is for debugging purposes, as well as
            //unexpected operations management
            this.stopInterval = function(){
                clearInterval(interval);
                interval = null;
            };
            //Restarts the autonomous callback. This is for debugging purposes, as well as
            //unexpected operations management.
            this.resumeInterval = function(){
                interval = setInterval(function(){
					if(displayQueue.length > 0){
                            display();
                    }
                },timeOut);
            };
        return this;
    }
    //placeholder for the GetDisplayHandler()'s returned object.
    var instance;
    return{
        getDisplayHandler: function(){
            //If instance is null, then return a new instance.
            //If not, then set the constructor to null, therefore causing the displayModule
            //getDisplayModule function to just return this reference to the original object
            //keeping the 'Singleton' relationship intact.
            if (instance == null){
                instance = new GetDisplayHandler();
                instance.constructor = null;
            }else{
                console.log("Only one instance of the display handler can exist at a time!");
            }
                return instance;
            }
        };
    }
)();
//TEST CODE!     
var displayHandler = displayHandlerGenerator.getDisplayHandler();
displayHandler.addToDisplay('Something doing', '$34.99');
displayHandler.addToDisplay('2', 'Screen2');
displayHandler.addToDisplay('3', 'Screen3');
//TEST CODE: Testing a random asynchronous interrupt (which this app is FULL OF!!!!)
setTimeout(function(){
	    displayHandler.interrupt("Error", "No Server");
},2000);
//displayHandler.interrupt("ERROR", "No Server");
displayHandler.addToDisplay('7', 'This is SSH');
