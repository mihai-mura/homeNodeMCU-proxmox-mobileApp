import { useEffect, useState } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import * as Device from 'expo-device';
import CircularProgress from 'react-native-circular-progress-indicator';
import mqttClient, { mqttClientPublish } from './mqtt';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldSetBadge: true,
		shouldPlaySound: true,
	}),
});

export default function App() {
	const [state, setState] = useState({});
	const [title, setTitle] = useState('');
	const [titleColor, setTitleColor] = useState('#000');
	const [pingGaugeColor, setPingGaugeColor] = useState('#2ecc71');
	const [rssiGaugeColor, setRssiPingGaugeColor] = useState('#d3435c');
	const [buttonColor, setButtonColor] = useState('#03c0f8');

	//* push notifs

	const registerForPushNotifications = async () => {
		if (!Device.isDevice) {
			alert('Must be on a physical device to receive push notifications');
			return;
		}
		const { status } = await Notifications.requestPermissionsAsync();
		if (status !== 'granted') {
			alert('Failed  to get push token for push notification!');
			return;
		}
		if (Platform.OS === 'android') {
			Notifications.setNotificationChannelAsync('default', {
				name: 'default',
				importance: Notifications.AndroidImportance.MAX,
			});
		}

		const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
		return pushToken;
	};

	useEffect(() => {
		(async () => {
			const token = await registerForPushNotifications();
			mqttClientPublish('proxmox/expo-token', token);
			mqttClient.onMessageArrived = (message) => {
				const payload = JSON.parse(message.payloadString);
				setState(payload);
			};
		})();
	}, []);

	useEffect(() => {
		switch (state.serverState) {
			case 'offline':
				setTitle(`Proxmox is offline`);
				setTitleColor('#d3435c');
				break;
			case 'online':
				setTitle(`Proxmox is online`);
				setTitleColor('#2ecc71');
				break;
			case 'waiting':
				setTitle('Waiting for ping...');
				setTitleColor('yellow');
				break;
			case 'error':
				setTitle(`Something went wrong!`);
				setTitleColor('#d3435c');
				break;
			default:
				setTitle('NodeMCU offline');
				setTitleColor('#d3435c');
				break;
		}
	}, [state.serverState]);

	return (
		<View style={styles.container}>
			<StatusBar animated={true} backgroundColor='#212121' />
			<View style={{ marginTop: 40, padding: 20 }}>
				<Text style={{ color: titleColor, fontSize: 21 }}>{title}</Text>
			</View>

			<View style={styles.gaugeContainer}>
				<CircularProgress
					value={state.ping || 0}
					maxValue={100}
					title='Ping'
					radius={80}
					titleColor={pingGaugeColor}
					progressValueColor={pingGaugeColor}
					activeStrokeColor={pingGaugeColor}
				/>
				<CircularProgress
					value={state.rssi || 0}
					maxValue={120}
					title='RSSI'
					radius={80}
					titleColor={rssiGaugeColor}
					progressValueColor={rssiGaugeColor}
					activeStrokeColor={rssiGaugeColor}
				/>
			</View>

			<Pressable
				style={{ ...styles.button, borderColor: buttonColor }}
				onPressIn={() => {
					setButtonColor('yellow');
				}}
				onPressOut={() => {
					setButtonColor('#03c0f8');
				}}
				onPress={async () => {
					mqttClientPublish('proxmox/on', 'power');
				}}>
				<Text style={{ color: buttonColor, fontSize: 16 }}>TURN ON</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		height: '100%',
		backgroundColor: '#212121',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	button: {
		width: '100%',
		height: 80,
		borderWidth: 1,
		borderRightWidth: 0,
		borderLeftWidth: 0,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 40,
	},
	gaugeContainer: {
		width: '90%',
		marginTop: 40,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
});
