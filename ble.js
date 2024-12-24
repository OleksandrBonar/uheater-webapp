// DOM Elements
const mainCard = document.getElementById('mainCard');
const wifiCard = document.getElementById('wifiCard');
const mqttCard = document.getElementById('mqttCard');
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const rebootButton = document.getElementById('rebootBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const retrievedValue = document.getElementById('valueContainer');

const mainModeContainer = document.getElementById('mainModeContainer');
const welcomeContainer = document.getElementById('welcome');
const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeText = document.getElementById('welcomeText');

const latestValueSent = document.getElementById('valueSent');
const bleStateContainer = document.getElementById('bleState');
const mainTmpaInput = document.getElementById('mainTmpaInput');
const mainTmpbInput = document.getElementById('mainTmpbInput');

// Define BLE Device Specs
var deviceName ='uHeater';

var mainServiceUuid = 'b0eb7b09-a92f-4cd7-a3ef-e009449bb46a';
var wifiServiceUuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
var mqttServiceUuid = '71842a85-784f-41d9-b4a3-d27994a35047';

var mainBootCharacteristicUuid = '44d8a42d-9720-4adb-878d-5922094b247c';
var mainModeCharacteristicUuid = '85f369a6-4581-4d30-854f-65d4f9240cc6';
var mainTmpaCharacteristicUuid = '9bf61fc0-f498-4a91-9077-f0997b9a25af';
var mainTmpbCharacteristicUuid = '0655d6c3-6e50-4c84-ab94-6903e1176b72';
var wifiSsidCharacteristicUuid = '9c298009-647c-4a4d-86f7-6cd0bf2ceac0';
var wifiPassCharacteristicUuid = '9d0a19d9-049b-445e-acf1-2c9c74dad82e';
var mqttHostCharacteristicUuid = '47ecdd61-bb6f-47c7-abbc-d22a66c8bad4';
var mqttPortCharacteristicUuid = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
var mqttUserCharacteristicUuid = 'c89baae7-6efb-4149-8aed-1537d7b489b0';
var mqttPassCharacteristicUuid = '116ce63e-c67f-470c-9380-4c32b4379c9d';

// Global Variables to Handle Bluetooth
var bleServer;
var bleService;
var sensorCharacteristic;
var mainModeCharacteristic;
var mainTmpaCharacteristic;
var mainTmpbCharacteristic;
var wifiSsidCharacteristic;
var wifiPassCharacteristic;
var mqttHostCharacteristic;
var mqttPortCharacteristic;
var mqttUserCharacteristic;
var mqttPassCharacteristic;

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

rebootButton.addEventListener('click', () => writeOnCharacteristic(mainBootCharacteristicUuid, 'Y'));

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
        optionalServices: [mainServiceUuid]
    })
    .then(device => {
        console.log('Device Selected:', device.name);
        // bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        // bleStateContainer.style.color = "#24af37";

        welcomeTitle.innerHtml = 'Success';
        welcomeText.innerHtml = 'Connected to device ' + device.name;

        connectButton.classList.toggle("visually-hidden");
        disconnectButton.classList.toggle("visually-hidden");
        rebootButton.classList.toggle("visually-hidden");
        
        device.addEventListener('gattservicedisconnected', onDisconnected);
        
        return device.gatt.connect();
    })
    .then(gattServer => {
        bleServer = gattServer;
        console.log("Connected to GATT Server");
        return bleServer.getPrimaryService(mainServiceUuid);
    })
    .then(service => {
        bleService = service;
        console.log("Service discovered:", service.uuid);

        service
            .getCharacteristic(mainModeCharacteristicUuid)
            .then(characteristic => {
                console.log("Characteristic discovered: ", characteristic.uuid);
                mainTmpaCharacteristic = characteristic;
                return characteristic.readValue();
            })
            .then(value => {
                console.log("Read value: ", value);
                const decodedValue = new TextDecoder().decode(value);
                console.log("Decoded value: ", decodedValue);

                mainModeContainer.classList.toggle("visually-hidden");
                mainModeContainer.innerHTML = decodedValue;
            })
            .catch(error => {
                console.log('Error: ', error);
            });
    
        service
            .getCharacteristic(mainTmpaCharacteristicUuid)
            .then(characteristic => {
                console.log("Characteristic discovered: ", characteristic.uuid);
                mainTmpaCharacteristic = characteristic;
                return characteristic.readValue();
            })
            .then(value => {
                console.log("Read value: ", value);
                const decodedValue = new TextDecoder().decode(value);
                console.log("Decoded value: ", decodedValue);
                mainTmpaInput.value = decodedValue;
            })
            .catch(error => {
                console.log('Error: ', error);
            });
    
        service
            .getCharacteristic(mainTmpbCharacteristicUuid)
            .then(characteristic => {
                console.log("Characteristic discovered: ", characteristic.uuid);
                mainTmpbCharacteristic = characteristic;
                return characteristic.readValue();
            })
            .then(value => {
                console.log("Read value: ", value);
                const decodedValue = new TextDecoder().decode(value);
                console.log("Decoded value: ", decodedValue);
                mainTmpbInput.value = decodedValue;

                mainCard.classList.toggle("visually-hidden");
                wifiCard.classList.toggle("visually-hidden");
                mqttCard.classList.toggle("visually-hidden");
            })
            .catch(error => {
                console.log('Error: ', error);
            });
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
    });
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
        bleService.getCharacteristic(uuid)
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
        if (sensorCharacteristic) {
            sensorCharacteristic.stopNotifications()
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

        mainCard.classList.toggle("visually-hidden");
        wifiCard.classList.toggle("visually-hidden");
        mqttCard.classList.toggle("visually-hidden");

        connectButton.classList.toggle("visually-hidden");
        disconnectButton.classList.toggle("visually-hidden");
        rebootButton.classList.toggle("visually-hidden");
    } else {
        // Throw an error if Bluetooth is not connected
        console.error("Bluetooth is not connected.");
        window.alert("Bluetooth is not connected.")
    }
}
