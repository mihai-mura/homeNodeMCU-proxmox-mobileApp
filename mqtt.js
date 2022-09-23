import Paho from 'paho-mqtt';

const mqttClient = new Paho.Client(process.env.MQTT_SERVER, Number(process.env.MQTT_PORT), `proxmox-mobileApp`);

mqttClient.connect({
	mqttVersion: 3,
	onSuccess: () => {
		console.log('Connected!');
		mqttClient.subscribe('proxmox/state');
		mqttClient.subscribe('proxmox/on');
	},
	onFailure: (e) => {
		console.log('Failed to connect!');
		console.log(e);
	},
});

export const mqttClientPublish = (topic, message) => {
	const payload = new Paho.Message(message);
	payload.destinationName = topic;
	mqttClient.send(payload);
};

export default mqttClient;
