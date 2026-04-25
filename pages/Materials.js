import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBoxes } from 'react-icons/fa';
import AppLayout from '../components/AppLayout';
import PhotoUpload from '../components/PhotoUpload';
import api from '../services/api';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    project_id: '',
    unit: 'pieces',
    available_quantity: 0,
    remaining_quantity: 0,
    used_quantity: 0,
    received_quantity: 0,
    unit_cost: 0,
    supplier: ''
  });

  useEffect(() => {
    loadMaterials();
    loadProjects();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await api.get('/materials/');
      setMaterials(response.data.materials);
    } catch (error) {
      setError('Failed to load materials');
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
      if (editingMaterial) {
        await api.put(`/materials/${editingMaterial.id}`, formData);
        setSuccess('Material updated successfully');
      } else {
        await api.post('/materials/', formData);
        setSuccess('Material created successfully');
      }
      setShowModal(false);
      setEditingMaterial(null);
      resetForm();
      loadMaterials();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingMaterial(item);
    setFormData({
      name: item.name,
      project_id: item.project_id,
      unit: item.unit,
      available_quantity: item.available_quantity,
      remaining_quantity: item.remaining_quantity,
      used_quantity: item.used_quantity,
      received_quantity: item.received_quantity,
      unit_cost: item.unit_cost,
      supplier: item.supplier || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      await api.delete(`/materials/${id}`);
      setSuccess('Material deleted successfully');
      loadMaterials();
    } catch (error) {
      setError('Failed to delete material');
    }
  };

  const handleUsageUpdate = async (id, field, value) => {
    try {
      const updateData = { [field]: parseFloat(value) };
      await api.patch(`/materials/${id}/usage`, updateData);
      setSuccess('Material usage updated successfully');
      loadMaterials();
    } catch (error) {
      setError('Failed to update material usage');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      project_id: '',
      unit: 'pieces',
      available_quantity: 0,
      remaining_quantity: 0,
      used_quantity: 0,
      received_quantity: 0,
      unit_cost: 0,
      supplier: ''
    });
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getStockStatus = (remaining, available) => {
    const ratio = available > 0 ? remaining / available : 0;
    if (ratio <= 0.1) return <Badge bg="danger">Low Stock</Badge>;
    if (ratio <= 0.3) return <Badge bg="warning">Medium Stock</Badge>;
    return <Badge bg="success">Good Stock</Badge>;
  };

  return (
    <AppLayout title="Materials Management" subtitle="Track material inventory, usage, and deliveries">
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h2><FaBoxes className="me-2" />Materials Management</h2>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingMaterial(null);
                  resetForm();
                  setShowModal(true);
                }}
              >
                <FaPlus className="me-2" />
                Add Material
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
                      <th>Material</th>
                      <th>Project</th>
                      <th>Available</th>
                      <th>Remaining</th>
                      <th>Used</th>
                      <th>Received</th>
                      <th>Unit Cost</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          <div className="text-muted small">
                            Unit: {item.unit} | Supplier: {item.supplier || 'N/A'}
                          </div>
                        </td>
                        <td>{getProjectName(item.project_id)}</td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.available_quantity}
                            onChange={(e) => handleUsageUpdate(item.id, 'available_quantity', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.remaining_quantity}
                            onChange={(e) => handleUsageUpdate(item.id, 'remaining_quantity', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.used_quantity}
                            onChange={(e) => handleUsageUpdate(item.id, 'used_quantity', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            value={item.received_quantity}
                            onChange={(e) => handleUsageUpdate(item.id, 'received_quantity', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td>${item.unit_cost.toFixed(2)}</td>
                        <td>{getStockStatus(item.remaining_quantity, item.available_quantity)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(item)}
                          >
                            <FaEdit />
                          </Button>
                          <PhotoUpload
                            entityType="material"
                            entityId={item.id}
                            entityName={item.name}
                          />
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <FaTrash />
                          </Button>
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
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
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
                    <Form.Label>Project *</Form.Label>
                    <Form.Select
                      value={formData.project_id}
                      onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Unit</Form.Label>
                    <Form.Select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      <option value="pieces">Pieces</option>
                      <option value="kg">Kilograms</option>
                      <option value="liters">Liters</option>
                      <option value="meters">Meters</option>
                      <option value="tons">Tons</option>
                      <option value="cubic_meters">Cubic Meters</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Unit Cost ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_cost}
                      onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value) || 0})}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Supplier</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Available Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.available_quantity}
                      onChange={(e) => setFormData({...formData, available_quantity: parseFloat(e.target.value) || 0})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Remaining Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.remaining_quantity}
                      onChange={(e) => setFormData({...formData, remaining_quantity: parseFloat(e.target.value) || 0})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Used Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.used_quantity}
                      onChange={(e) => setFormData({...formData, used_quantity: parseFloat(e.target.value) || 0})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Received Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.received_quantity}
                      onChange={(e) => setFormData({...formData, received_quantity: parseFloat(e.target.value) || 0})}
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
                {loading ? 'Saving...' : (editingMaterial ? 'Update' : 'Create')}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </AppLayout>
  );
};

export default Materials;