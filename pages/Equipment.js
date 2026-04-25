import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaWrench } from 'react-icons/fa';
import AppLayout from '../components/AppLayout';
import PhotoUpload from '../components/PhotoUpload';
import api from '../services/api';

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'available',
    project_id: '',
    serial_number: '',
    purchase_date: '',
    last_maintenance: '',
    next_maintenance: ''
  });

  useEffect(() => {
    loadEquipment();
    loadProjects();
  }, []);

  const loadEquipment = async () => {
    try {
      const response = await api.get('/equipment/');
      setEquipment(response.data.equipment);
    } catch (error) {
      setError('Failed to load equipment');
    }
  };

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects/');
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Failed to load projects');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingEquipment) {
        await api.put(`/equipment/${editingEquipment.id}`, formData);
        setSuccess('Equipment updated successfully');
      } else {
        await api.post('/equipment/', formData);
        setSuccess('Equipment created successfully');
      }
      setShowModal(false);
      setEditingEquipment(null);
      resetForm();
      loadEquipment();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      status: item.status,
      project_id: item.project_id || '',
      serial_number: item.serial_number || '',
      purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
      last_maintenance: item.last_maintenance ? item.last_maintenance.split('T')[0] : '',
      next_maintenance: item.next_maintenance ? item.next_maintenance.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return;

    try {
      await api.delete(`/equipment/${id}`);
      setSuccess('Equipment deleted successfully');
      loadEquipment();
    } catch (error) {
      setError('Failed to delete equipment');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/equipment/${id}/status`, { status });
      setSuccess('Equipment status updated successfully');
      loadEquipment();
    } catch (error) {
      setError('Failed to update equipment status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'available',
      project_id: '',
      serial_number: '',
      purchase_date: '',
      last_maintenance: '',
      next_maintenance: ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      available: 'success',
      in_use: 'primary',
      maintenance: 'warning',
      retired: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unassigned';
  };

  return (
    <AppLayout title="Equipment Management" subtitle="Manage construction equipment and maintenance schedules">
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2>Equipment Management</h2>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingEquipment(null);
                  resetForm();
                  setShowModal(true);
                }}
              >
                <FaPlus className="me-2" />
                Add Equipment
              </Button>
            </div>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row>
          <Col>
            <Card>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Project</th>
                      <th>Serial Number</th>
                      <th>Last Maintenance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.description && <div className="text-muted small">{item.description}</div>}
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>{getProjectName(item.project_id)}</td>
                        <td>{item.serial_number || '-'}</td>
                        <td>
                          {item.last_maintenance
                            ? new Date(item.last_maintenance).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(item)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="me-2"
                            onClick={() => handleDelete(item.id)}
                          >
                            <FaTrash />
                          </Button>
                          <PhotoUpload
                            entityType="equipment"
                            entityId={item.id}
                            entityName={item.name}
                          />
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(item.id, 'available')}
                              disabled={item.status === 'available'}
                            >
                              Available
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(item.id, 'in_use')}
                              disabled={item.status === 'in_use'}
                            >
                              In Use
                            </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(item.id, 'maintenance')}
                              disabled={item.status === 'maintenance'}
                            >
                              <FaWrench />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Project</Form.Label>
                    <Form.Select
                      value={formData.project_id}
                      onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Serial Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Purchase Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Maintenance</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.last_maintenance}
                      onChange={(e) => setFormData({...formData, last_maintenance: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Next Maintenance</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.next_maintenance}
                      onChange={(e) => setFormData({...formData, next_maintenance: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : (editingEquipment ? 'Update' : 'Create')}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </AppLayout>
  );
};

export default Equipment;