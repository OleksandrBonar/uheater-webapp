// DOM Elements
const mainCard = document.getElementById('mainCard');
const wifiCard = document.getElementById('wifiCard');
const mqttCard = document.getElementById('mqttCard');
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const rebootButton = document.getElementById('rebootBleButton');

const mainModeContainer = document.getElementById('mainModeContainer');
const actionsContainer = document.getElementById('actionsContainer');

const errorCard = document.getElementById('errorCard');
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');
const welcomeCard = document.getElementById('welcomeCard');
const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeMessage = document.getElementById('welcomeMessage');

const mainTmpaInput = document.getElementById('mainTmpaInput');
const mainTmpbInput = document.getElementById('mainTmpbInput');
const wifiSsidInput = document.getElementById('wifiSsidInput');
const mqttHostInput = document.getElementById('mqttHostInput');
const mqttPortInput = document.getElementById('mqttPortInput');
const mqttUserInput = document.getElementById('mqttUserInput');

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
var bleServiceMain;
var bleServiceWifi;
var bleServiceMqtt;
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
connectButton.addEventListener('click', connectToDevice);
// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Write to the ESP32 Characteristic
rebootButton.addEventListener('click', () => writeOnCharacteristic(bleServiceMain, mainBootCharacteristicUuid, 'Y'));

mainTmpaInput.addEventListener('change', () => writeOnCharacteristic(bleServiceMain, mainTmpaCharacteristicUuid, mainTmpaInput.value));
mainTmpbInput.addEventListener('change', () => writeOnCharacteristic(bleServiceMain, mainTmpbCharacteristicUuid, mainTmpbInput.value));

wifiSsidInput.addEventListener('change', () => writeOnCharacteristic(bleServiceWifi, wifiSsidCharacteristicUuid, wifiSsidInput.value));
wifiPassInput.addEventListener('change', () => writeOnCharacteristic(bleServiceWifi, wifiPassCharacteristicUuid, wifiPassInput.value));

mqttHostInput.addEventListener('change', () => writeOnCharacteristic(bleServiceMqtt, mqttHostCharacteristicUuid, mqttHostInput.value));
mqttPortInput.addEventListener('change', () => writeOnCharacteristic(bleServiceMqtt, mqttPortCharacteristicUuid, mqttPortInput.value));
mqttUserInput.addEventListener('change', () => writeOnCharacteristic(bleServiceMqtt, mqttUserCharacteristicUuid, mqttUserInput.value));
mqttPassInput.addEventListener('change', () => writeOnCharacteristic(bleServiceMqtt, mqttPassCharacteristicUuid, mqttPassInput.value));

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log('Web Bluetooth API is not available in this browser!');

        errorTitle.textContent = 'Sorry';
        errorMessage.textContent = 'Web Bluetooth API is not available in this browser!';

        welcomeCard.classList.toggle('visually-hidden');
        errorCard.classList.toggle('visually-hidden');
        actionsContainer.classList.toggle('visually-hidden');

        return false
    }

    console.log('Web Bluetooth API supported in this browser.');

    return true
}

// Connect to BLE Device and Enable Notifications
function connectToDevice() {
    console.log('Initializing Bluetooth...');

    if (!navigator.bluetooth) {
        console.log('Web Bluetooth API is not available in this browser!');
        return false;
    }

    console.log('Web Bluetooth API supported in this browser.');

    navigator.bluetooth.requestDevice({
        filters: [{name: deviceName}],
        optionalServices: [mainServiceUuid, wifiServiceUuid, mqttServiceUuid]
    })
    .then(device => {
        console.log('Device Selected:', device.name);

        // bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        // bleStateContainer.style.color = "#24af37";

        welcomeTitle.textContent = 'Connected';
        welcomeMessage.textContent = 'Please wait until parameters are loaded';

        connectButton.classList.toggle('visually-hidden');
        disconnectButton.classList.toggle('visually-hidden');
        rebootButton.classList.toggle('visually-hidden');
        
        device.addEventListener('gattservicedisconnected', onDisconnected);
        
        return device.gatt.connect();
    })
    .then(gattServer => {
        bleServer = gattServer;
        console.log('Connected to GATT Server');

        serviceMain = bleServer.getPrimaryService(mainServiceUuid);
        serviceWifi = bleServer.getPrimaryService(wifiServiceUuid);
        serviceMqtt = bleServer.getPrimaryService(mqttServiceUuid);

        return Promise.all([serviceMain, serviceWifi, serviceMqtt]);
    })
    .then(([serviceMain, serviceWifi, serviceMqtt]) => {
        bleServiceMain = serviceMain;
        bleServiceWifi = serviceWifi;
        bleServiceMqtt = serviceMqtt;

        characteristicMainMode = serviceMain.getCharacteristic(mainModeCharacteristicUuid);
        characteristicMainTmpa = serviceMain.getCharacteristic(mainTmpaCharacteristicUuid);
        characteristicMainTmpb = serviceMain.getCharacteristic(mainTmpbCharacteristicUuid);

        characteristicWifiSsid = serviceWifi.getCharacteristic(wifiSsidCharacteristicUuid);

        characteristicMqttHost = serviceMqtt.getCharacteristic(mqttHostCharacteristicUuid);
        characteristicMqttPort = serviceMqtt.getCharacteristic(mqttPortCharacteristicUuid);
        characteristicMqttUser = serviceMqtt.getCharacteristic(mqttUserCharacteristicUuid);

        return Promise.all([
            characteristicMainMode, characteristicMainTmpa, characteristicMainTmpb,
            characteristicWifiSsid,
            characteristicMqttHost, characteristicMqttPort, characteristicMqttUser
        ]);
    })
    .then(([
        characteristicMainMode, characteristicMainTmpa, characteristicMainTmpb,
        characteristicWifiSsid,
        characteristicMqttHost, characteristicMqttPort, characteristicMqttUser
    ]) => {
        mainModeCharacteristic = characteristicMainMode;
        mainTmpaCharacteristic = characteristicMainTmpa;
        mainTmpbCharacteristic = characteristicMainTmpb;

        wifiSsidCharacteristic = characteristicWifiSsid;

        mqttHostCharacteristic = characteristicMqttHost;
        mqttPortCharacteristic = characteristicMqttPort;
        mqttUserCharacteristic = characteristicMqttUser;

        return Promise.all([
            characteristicMainMode.readValue(), characteristicMainTmpa.readValue(), characteristicMainTmpb.readValue(),
            characteristicWifiSsid.readValue(),
            characteristicMqttHost.readValue(), characteristicMqttPort.readValue(), characteristicMqttUser.readValue(),
        ]);
    })
    .then(([
        valueMainMode, valueMainTmpa, valueMainTmpb,
        valueWifiSsid,
        valueMqttHost, valueMqttPort, valueMqttUser,
    ]) => {
        const decoder = new TextDecoder();

        mainModeContainer.innerHTML = decoder.decode(valueMainMode);
        mainModeContainer.classList.toggle('visually-hidden');

        mainTmpaInput.value = decoder.decode(valueMainTmpa);
        mainTmpbInput.value = decoder.decode(valueMainTmpb);
        mainCard.classList.toggle('visually-hidden');

        wifiSsidInput.value = decoder.decode(valueWifiSsid);
        wifiCard.classList.toggle('visually-hidden');

        mqttHostInput.value = decoder.decode(valueMqttHost);
        mqttPortInput.value = decoder.decode(valueMqttPort);
        mqttUserInput.value = decoder.decode(valueMqttUser);
        mqttCard.classList.toggle('visually-hidden');

        welcomeCard.classList.toggle('visually-hidden');
    })
    .catch(error => {
        console.log('Error: ', error);
    });
}

function onDisconnected(event) {
    console.log('Device Disconnected:', event.target.device.name);

    // bleStateContainer.innerHTML = "Device disconnected";
    // bleStateContainer.style.color = "#d13a30";
    welcomeTitle.textContent = 'Device disconnected';
    welcomeMessage.textContent = 'Please wait...';

    connectToDevice();
}

function writeOnCharacteristic(service, uuid, value) {
    if (bleServer && bleServer.connected) {
        service.getCharacteristic(uuid)
            .then(characteristic => {
                console.log("Found the characteristic: ", characteristic.uuid);
                const valueEncoded = new TextEncoder().encode(value);
                return characteristic.writeValue(valueEncoded);
            })
            .then(() => {
                console.log('Value written to the characteristic: ', value);
            })
            .catch(error => {
                console.error('Error writing to the characteristic: ', error);
            });
    } else {
        console.error('Bluetooth is not connected. Cannot write to characteristic.');
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!");
    }
}

function disconnectDevice() {
    console.log('Disconnect Device.');
    if (bleServer && bleServer.connected) {
        if (sensorCharacteristic) {
            sensorCharacteristic.stopNotifications()
                .then(() => {
                    console.log('Notifications Stopped');
                })
                .catch(error => {
                    console.log('An error occurred: ', error);
                });
        } else {
            console.log('No characteristic found to disconnect.');
        }

        bleServer.disconnect();
        console.log('Device Disconnected');

        // bleStateContainer.innerHTML = "Device Disconnected";
        // bleStateContainer.style.color = "#d13a30";
    } else {
        // Throw an error if Bluetooth is not connected
        console.error('Bluetooth is not connected.');
        window.alert('Bluetooth is not connected.');
    }

    mainCard.classList.toggle('visually-hidden');
    wifiCard.classList.toggle('visually-hidden');
    mqttCard.classList.toggle('visually-hidden');

    welcomeTitle.textContent = 'Device Disconnected';
    welcomeMessage.textContent = 'Please press connect button';
    welcomeCard.classList.toggle('visually-hidden');

    connectButton.classList.toggle('visually-hidden');
    disconnectButton.classList.toggle('visually-hidden');
    rebootButton.classList.toggle('visually-hidden');
}

isWebBluetoothEnabled();
