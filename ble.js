// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const rebootButton = document.getElementById('rebootBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const retrievedValue = document.getElementById('valueContainer');
const mainModeValue = document.getElementById('mainModeContainer');
const latestValueSent = document.getElementById('valueSent');
const bleStateContainer = document.getElementById('bleState');
const timestampContainer = document.getElementById('timestamp');

// Define BLE Device Specs
var deviceName ='uHeater';

var bleService = 'b0eb7b09-a92f-4cd7-a3ef-e009449bb46a';
var bleMainService = 'b0eb7b09-a92f-4cd7-a3ef-e009449bb46a';
var bleStatService = 'd6d09854-4b2a-48ea-a307-416a2b7269d1';
var mainBootCharacteristic = '44d8a42d-9720-4adb-878d-5922094b247c';
var mainModeCharacteristic = '85f369a6-4581-4d30-854f-65d4f9240cc6';

var ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
var sensorCharacteristic= '19b10001-e8f2-537e-4f6c-d104768a1214';

// Global Variables to Handle Bluetooth
var bleServer;
var bleServiceFound;
var sensorCharacteristicFound;
var mainModeCharacteristicFound;

// Connect Button (search for BLE Devices only if BLE is available)
connectButton.addEventListener('click', (event) => {
    if (isWebBluetoothEnabled()){
        connectToDevice();
    }
});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Write to the ESP32 LED Characteristic
// onButton.addEventListener('click', () => writeOnCharacteristic(ledCharacteristic, 1));
// offButton.addEventListener('click', () => writeOnCharacteristic(ledCharacteristic, 0));

rebootButton.addEventListener('click', () => writeOnCharacteristic(mainBootCharacteristic, 'Y'));

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log('Web Bluetooth API is not available in this browser!');
        bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser/device!";
        return false
    }
    console.log('Web Bluetooth API supported in this browser.');
    return true
}

// Connect to BLE Device and Enable Notifications
function connectToDevice() {
    console.log('Initializing Bluetooth...');
    navigator.bluetooth.requestDevice({
        filters: [{name: deviceName}],
        optionalServices: [bleService]
    })
    .then(device => {
        console.log('Device Selected:', device.name);
        // bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        // bleStateContainer.style.color = "#24af37";

        connectButton.classList.toggle("visually-hidden");
        disconnectButton.classList.toggle("visually-hidden");
        rebootButton.classList.toggle("visually-hidden");
        
        device.addEventListener('gattservicedisconnected', onDisconnected);
        
        return device.gatt.connect();
    })
    .then(gattServer => {
        bleServer = gattServer;
        console.log("Connected to GATT Server");
        return bleServer.getPrimaryService(bleService);
    })
    .then(service => {
        bleServiceFound = service;
        console.log("Service discovered:", service.uuid);
        return service.getCharacteristic(mainModeCharacteristic);
    })
    .then(characteristic => {
        console.log("Characteristic discovered: ", characteristic.uuid);
        mainModeCharacteristicFound = characteristic;
        return characteristic.readValue();
    })
    .then(value => {
        console.log("Read value: ", value);
        const decodedValue = new TextDecoder().decode(value);
        console.log("Decoded value: ", decodedValue);
        mainModeValue.innerHTML = decodedValue;
    })
    // .then(characteristic => {
    //     console.log("Characteristic discovered:", characteristic.uuid);
    //     sensorCharacteristicFound = characteristic;
    //     characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
    //     characteristic.startNotifications();
    //     console.log("Notifications Started.");
    //     return characteristic.readValue();
    // })
    // .then(value => {
    //     console.log("Read value: ", value);
    //     const decodedValue = new TextDecoder().decode(value);
    //     console.log("Decoded value: ", decodedValue);
    //     retrievedValue.innerHTML = decodedValue;
    // })
    .catch(error => {
        console.log('Error: ', error);
    })
}

function onDisconnected(event) {
    console.log('Device Disconnected:', event.target.device.name);
    // bleStateContainer.innerHTML = "Device disconnected";
    // bleStateContainer.style.color = "#d13a30";

    connectToDevice();
}

function handleCharacteristicChange(event){
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Characteristic value changed: ", newValueReceived);
    retrievedValue.innerHTML = newValueReceived;
    timestampContainer.innerHTML = getDateTime();
}

function writeOnCharacteristic(uuid, value) {
    console.log("writeOnCharacteristic");
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(uuid)
            .then(characteristic => {
                console.log("Found the characteristic: ", characteristic.uuid);
                const data = new Uint8Array([value]);
                return characteristic.writeValue(data);
            })
            .then(() => {
                // latestValueSent.innerHTML = value;
                console.log("Value written to the characteristic:", value);
            })
            .catch(error => {
                console.error("Error writing to the characteristic: ", error);
            });
    } else {
        console.error("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }
}

function disconnectDevice() {
    console.log("Disconnect Device.");
    if (bleServer && bleServer.connected) {
        if (sensorCharacteristicFound) {
            sensorCharacteristicFound.stopNotifications()
                .then(() => {
                    console.log("Notifications Stopped");
                })
                .catch(error => {
                    console.log("An error occurred:", error);
                });
        } else {
            console.log("No characteristic found to disconnect.");
        }
        
        bleServer.disconnect();
        console.log("Device Disconnected");
        // bleStateContainer.innerHTML = "Device Disconnected";
        // bleStateContainer.style.color = "#d13a30";

        connectButton.classList.toggle("visually-hidden");
        disconnectButton.classList.toggle("visually-hidden");
        rebootButton.classList.toggle("visually-hidden");
    } else {
        // Throw an error if Bluetooth is not connected
        console.error("Bluetooth is not connected.");
        window.alert("Bluetooth is not connected.")
    }
}

function getDateTime() {
    var currentdate = new Date();
    var day = ("00" + currentdate.getDate()).slice(-2); // Convert day to string and slice
    var month = ("00" + (currentdate.getMonth() + 1)).slice(-2);
    var year = currentdate.getFullYear();
    var hours = ("00" + currentdate.getHours()).slice(-2);
    var minutes = ("00" + currentdate.getMinutes()).slice(-2);
    var seconds = ("00" + currentdate.getSeconds()).slice(-2);

    var datetime = day + "/" + month + "/" + year + " at " + hours + ":" + minutes + ":" + seconds;
    return datetime;
}
