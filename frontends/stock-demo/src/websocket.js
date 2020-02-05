import { useContext, useEffect } from 'react';
import io from 'socket.io-client';
import { store } from './store';

const uri = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000'
  : null;

const useWebSocket = () => {
	const state = useContext(store);
  const { dispatch } = state;

  useEffect(() => {
    const socket = uri ? io(uri) : io();

    socket.on('connect', () => {
      dispatch({ type: 'websocket.connected', socket });
    });
    socket.on('disconnect', () => {
      dispatch({ type: 'websocket.disconnected', socket });
    });
    socket.on('error', (err) => {
      console.error('Websocket error', err);
      dispatch({ type: 'websocket.error', error: err });
    });
    socket.on('mesh.rfid.tag_update', (data) => {
      dispatch({ type: 'mesh.rfid.tag_update', data });
    });

    return () => {
      socket.close();
    }
	}, [ dispatch ]);
	
	return [ state ];
};

export {
	useWebSocket,
};