import React, {createContext, useReducer} from 'react';
import moment from 'moment';

const initialState = {
	websocket: {
		connected: false,
		error: null,
		socket: null,
	},
	messages: [],
	maxMessages: 25,
};

const store = createContext(initialState);
const { Provider } = store;

const truncate = (arr, maxSize) => arr.slice(0, Math.min(arr.length, maxSize));

const toHexString = (arr) => {
	let str = '';
	for (let b of arr) {
		str += ('0' + (b & 0xFF).toString(16)).slice(-2);
	}
	return str;
};

const toHexStringWithSeparator = (arr, sep = ':') => toHexString(arr).replace(/(.{2})/g, `$1${sep}`).slice(0, -1);

const transformRfidTagUpdate = ({ type, data }) => {
	const macAddress = toHexStringWithSeparator(data.macAddress);
	return {
		id: `${type}--${macAddress}--${data.timestamp}`,
		timestamp: moment(data.timestamp),
		macAddress,
		items: data.items.map(tag => toHexStringWithSeparator(tag)).sort(),
	};
};

const transformUnknownNotif = ({ type, data }) => {
	const { macAddress: rawMacAddress, srcPort, dstPort, timestamp, data: payloadData } = data;
	const macAddress = toHexStringWithSeparator(rawMacAddress);
	const payload = toHexStringWithSeparator(payloadData, ' ');
	return {
		id: `${type}--${macAddress}--${timestamp}`,
		timestamp: moment(timestamp),
		macAddress,
		srcPort,
		dstPort,
		data: payload,
	};
};

const StateProvider = ( { children } ) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch(action.type) {
			case 'websocket.connected':
				return {
					...state,
					websocket: {
						...state.websocket,
						connected: true,
						socket: action.socket,
					},
				};
			case 'websocket.disconnected':
				return {
					...state,
					websocket: {
						...state.websocket,
						connected: false,
						socket: null,
					},
				};
			case 'websocket.error':
				return {
					...state,
					websocket: {
						...state.websocket,
						error: action.error,
					},
				};
      case 'mesh.notif':
				return {
					...state,
					messages: truncate([ 
						{
							type: action.type,
							data: transformUnknownNotif(action),
						}, 
						...state.messages 
					], state.maxMessages),
				};
			case 'mesh.rfid.tag_update':
				return {
					...state,
					messages: truncate([ 
						{
							type: action.type,
							data: transformRfidTagUpdate(action),
						},
						...state.messages 
					], state.maxMessages),
				};
      default:
				console.warn(`Unexpected action type: ${action.type}`, action);
				return state;
    };
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
