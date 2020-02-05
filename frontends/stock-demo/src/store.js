import React, {createContext, useReducer} from 'react';
import moment from 'moment';

const masterSkus = [
	{ code: 0, name: 'Blue', color: '#5da5da' },
	{ code: 1, name: 'Orange', color: '#faa43a' },
	{ code: 2, name: 'Green', color: '#60bd68' },
	{ code: 3, name: 'Pink', color: '#f17cb0' },
	{ code: 4, name: 'Purple', color: '#b276b2' },
];

const initialState = {
	websocket: {
		connected: false,
		error: null,
		socket: null,
	},
	readerCount: 0,
	readers: {},
	tags: {},
	skus: masterSkus.map(x => ({ ...x, count: 0 })),
};

const store = createContext(initialState);
const { Provider } = store;

// SKU code of 0-4, based on first byte of EPC
const getSkuCode = (data) => data[0] % 5;

const toHexString = (arr) => {
	let str = '';
	for (let b of arr) {
		str += ('0' + (b & 0xFF).toString(16)).slice(-2);
	}
	return str;
};

const toHexStringWithSeparator = (arr, sep = ':') => toHexString(arr).replace(/(.{2})/g, `$1${sep}`).slice(0, -1);

const transformRfidTagUpdate = ({ type, data }) => {
	const timestamp = moment(data.timestamp);
	const macAddress = toHexStringWithSeparator(data.macAddress);
	const tags = data.items.reduce((agg, tagData) => {
		const tag = toHexStringWithSeparator(tagData);
		const sku = getSkuCode(tagData);
		agg[tag] = {
			timestamp,
			macAddress,
			tag,
			sku,
		};
		return agg;
	}, {});
	const reader = {
		timestamp,
		macAddress,
	};
	return { tags, reader };
};

const calculateStats = ({ tags, readers }) => {
	const skus = masterSkus.map(x => ({ ...x, count: 0 }));
	const newReaders = Object.keys(readers).reduce((agg, id) => {
		agg[id] = { ...readers[id], count: 0 };
		return agg;
	}, {});
	for (let id of Object.keys(tags)) {
		skus[tags[id].sku].count++;
		newReaders[tags[id].macAddress].count++;
	}
	return { skus, readers: newReaders };
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
			case 'mesh.rfid.tag_update':
				const { tags, reader } = transformRfidTagUpdate(action);
				const newTags = {
					...state.tags,
					...tags,
				};
				let readerCount = state.readerCount;
				let readers = state.readers[reader.macAddress] ? { ...state.readers } : {
					...state.readers,
					[reader.macAddress]: {
						...reader,
						name: `Reader #${++readerCount}`,
					}
				};
				let { skus, readers: newReaders } = calculateStats({ tags: newTags, readers });
				
				
				return {
					...state,
					readers: newReaders,
					tags: newTags,
					skus,
					readerCount,
				};
      default:
				console.warn(`Unexpected action type: ${action.type}`, action);
				return state;
    };
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
