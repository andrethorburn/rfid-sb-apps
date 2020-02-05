import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const RfidTagUpdate = ({ type, data }) => {
  const { macAddress, timestamp, items } = data;
  const [ open, setOpen ] = useState(false);
  return (
    <Card className="list-item">
      <Card.Header className="list-item--header">
				<Container fluid>
					<Row noGutters>
						<Col xs={12} md={4}><h1>RFID Tag Update</h1></Col>
						<Col xs={12} md={4}><h2>{macAddress} &#x1f87a; {items.length} tags</h2></Col>
						<Col xs={12} md={4}><span className="list-item--header--date">{timestamp.format('DD/MM/YYYY HH:mm:ss')}</span></Col>
					</Row>
				</Container>
      </Card.Header>
      <Card.Body>
        <Card.Title>RFID Tags:</Card.Title>
        <ul>
          {items.map(tag => <li key={tag}><pre className="mb-0">{tag}</pre></li>)}
        </ul>
        <div className="text-right">
          <Button variant="primary" onClick={() => setOpen(!open)}>View JSON...</Button>
        </div>
        <Modal show={open} onHide={() => setOpen(!open)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>JSON</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
          </Modal.Body>
        </Modal>
      </Card.Body>
    </Card>
  );
};

export default RfidTagUpdate;