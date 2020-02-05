import React from 'react';
import { StateProvider } from './store';
import { useWebSocket } from './websocket';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Navbar from 'react-bootstrap/Navbar';
import renderers from './packet-renderers';

import Logo from './assets/img/logo.png';

import './styles.scss';

const App = () => {
  const [ { state } ] = useWebSocket();
  const { websocket, messages } = state;

  return (
    <div className="app">
      <Navbar bg="light" expand="lg" className="page--header">
        <Navbar.Brand href="/">
          <img src={Logo} alt="IoTechnics Logo" className="page--header--logo" />
        </Navbar.Brand>
        <Navbar.Text className="justify-content-end page--header--text">
          SmartMesh Activity Viewer
        </Navbar.Text>
      </Navbar>
      <Container className="p-4 page--content">
        {!websocket.connected &&
          <Row>
            <Col>
              <Alert variant="danger" className="text-center">Connection to server lost, please check the API is running and accessible</Alert>
            </Col>
          </Row>
        }
        {(!messages || !messages.length) && 
          <Row>
            <Col>
              <Alert variant="info" className="text-center">Waiting for SmartMesh messages...</Alert>
            </Col>
          </Row>
        }
        {messages.map(({ type, data }) => {
          const Component = (renderers[type] || renderers['unknown']);
          return (
            <Row className="mb-2" key={data.id}>
              <Col>
                <Component type={type} data={data} />
              </Col>
            </Row>
          );
        })}
      </Container>
    </div>
  );
};

const Provider = () => {
  return (
    <StateProvider>
      <App />
    </StateProvider>
  )
};

export default Provider;
