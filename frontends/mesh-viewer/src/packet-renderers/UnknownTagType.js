import React, { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const UnknownTagType = ({ type, data }) => {
  const { macAddress, timestamp, srcPort, dstPort, data: payload } = data;
  const [ open, setOpen ] = useState(false);
  return (
    <Card className="list-item">
      <Card.Header className="list-item--header">
				<Container fluid>
					<Row noGutters>
						<Col xs={12} md={4}><h1>SmartMesh Notification</h1></Col>
						<Col xs={12} md={4}><h2>{macAddress}</h2></Col>
						<Col xs={12} md={4}><span className="list-item--header--date">{timestamp.format('DD/MM/YYYY HH:mm:ss')}</span></Col>
					</Row>
				</Container>
      </Card.Header>
      <Card.Body>
        <Card.Title>Message Information:</Card.Title>
        <table className="table mt-2">
          <tbody>
            <tr>
              <th>Source Port:</th>
              <td>{srcPort} <small className="text-muted">( 0x{srcPort.toString(16)} )</small></td>
            </tr>
            <tr>
              <th>Destination Port:</th>
              <td>{dstPort} <small className="text-muted">( 0x{dstPort.toString(16)} )</small></td>
            </tr>
            <tr>
              <th>Payload:</th>
              <td><pre><code>{(payload.match(/.{1,30}/g) || []).join('\n')}</code></pre></td>
            </tr>
          </tbody>
        </table>
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

export default UnknownTagType;