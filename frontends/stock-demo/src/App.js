import React from 'react';
import { StateProvider } from './store';
import { useWebSocket } from './websocket';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Navbar from 'react-bootstrap/Navbar';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';

import Logo from './assets/img/logo.png';

import './styles.scss';

const SkuCard = ({ sku }) => (
  <Card className="dashboard--card">
    <Card.Header as="h5" style={{ color: sku.color }} className="dashboard--card--title">{sku.name}</Card.Header>
    <Card.Body>
      <h1 style={{ color: sku.color }} className="dashboard--card--number">{sku.count}</h1>
      <h5 style={{ color: sku.color }} className="dashboard--card--number--unit">TAGS</h5>
    </Card.Body>
  </Card>
);

const ReaderCard = ({ reader }) => (
  <Card className="dashboard--card">
    <Card.Header as="h5" style={{ color: reader.color }} className="dashboard--card--title">{reader.name}</Card.Header>
    <Card.Body>
      <h1 style={{ color: reader.color }} className="dashboard--card--number">{reader.count}</h1>
      <h5 className="dashboard--card--number--unit">TAGS</h5>
    </Card.Body>
  </Card>
);

const SkuBadge = ({ sku }) => (
  <Badge variant="secondary" className="dashboard--badge--sku" style={{backgroundColor: sku.color}}>{sku.name}</Badge>
);

const App = () => {
  const [ { state } ] = useWebSocket();
  const { websocket, tags, readers, skus, readerCount } = state;

  return (
    <div className="app">
      <Navbar bg="light" expand="lg" className="page--header">
        <Navbar.Brand href="/">
          <img src={Logo} alt="IoTechnics Logo" className="page--header--logo" />
        </Navbar.Brand>
        <Navbar.Text className="justify-content-end page--header--text">
          RFID Stock Demo
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
        {!readerCount && 
          <Row>
            <Col>
              <Alert variant="info" className="text-center">Waiting for RFID updates...</Alert>
            </Col>
          </Row>
        }

        {!!readerCount && 
          <>
            <Row>
              <Col>
                <h1 className="text-center">PRODUCT SKUS</h1>
                <hr />
              </Col>
            </Row>
            <Row>
              {skus.map((sku) => (
                <Col key={sku.code} sm={6} md={4} className="mb-4">
                  <SkuCard sku={sku} />
                </Col>
              ))}
            </Row>

            <Row>
              <Col>
                <h1 className="text-center">READERS</h1>
                <hr />
              </Col>
            </Row>
            <Row>
              {Object.keys(readers).map((id) => {
                const reader = readers[id];
                return (
                  <Col key={reader.macAddress} sm={6} md={4} className="mb-4">
                    <ReaderCard reader={reader} />
                  </Col>
                );
              })}
            </Row>

            <Row>
              <Col>
                <h1 className="text-center">TAGS</h1>
                <hr />
              </Col>
            </Row>
            <Row>
              <Col>
              <Table bordered>
                <thead>
                  <tr>
                    <th>TAG</th>
                    <th>SKU</th>
                    <th>READER</th>
                    <th>LAST UPDATE</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(tags).map((id) => {
                    const tag = tags[id];
                    return (
                      <tr key={tag.tag}>
                        <td>{tag.tag}</td>
                        <td><SkuBadge sku={skus[tag.sku]} /></td>
                        <td>{readers[tag.macAddress].name}</td>
                        <td>{tag.timestamp.calendar()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              </Col>
            </Row>
            </>
          }
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
