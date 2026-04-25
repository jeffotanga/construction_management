import React, { useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { Button, Modal, Form, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { FaCamera, FaTrash, FaEye } from 'react-icons/fa';
import api from '../services/api';

const PhotoUpload = ({ entityType, entityId, entityName, onPhotoUploaded }) => {
  const [showModal, setShowModal] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);

  const loadPhotos = async () => {
    try {
      const response = await api.get(`/photos/${entityType}/${entityId}`);
      setPhotos(response.data.photos);
    } catch (error) {
      console.error('Failed to load photos');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      // eslint-disable-next-line no-unused-vars
      const response = await api.post(`/photos/${entityType}/${entityId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Photo uploaded successfully');
      setSelectedFile(null);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadPhotos();
      if (onPhotoUploaded) {
        onPhotoUploaded();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/photos/${photoId}`);
      setSuccess('Photo deleted successfully');
      loadPhotos();
      if (onPhotoUploaded) {
        onPhotoUploaded();
      }
    } catch (error) {
      setError('Failed to delete photo');
    }
  };

  const openModal = () => {
    setShowModal(true);
    loadPhotos();
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
    setSelectedFile(null);
    setCaption('');
  };

  return (
    <>
      <Button
        variant="outline-primary"
        size="sm"
        onClick={openModal}
        className="me-2"
      >
        <FaCamera className="me-1" />
        Photos ({photos.length})
      </Button>

      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Photos for {entityName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleUpload} className="mb-4">
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Photo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Caption (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Enter photo caption"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="mt-3">
              <Button type="submit" disabled={loading || !selectedFile}>
                {loading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </div>
          </Form>

          <h5>Uploaded Photos</h5>
          {photos.length === 0 ? (
            <p className="text-muted">No photos uploaded yet.</p>
          ) : (
            <Row>
              {photos.map((photo) => (
                <Col md={4} key={photo.id} className="mb-3">
                  <Card>
                    <Card.Img
                      variant="top"
                      src={photo.file_path}
                      style={{ height: '150px', objectFit: 'cover' }}
                    />
                    <Card.Body className="p-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {new Date(photo.uploaded_at).toLocaleDateString()}
                        </small>
                        <div>
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-1"
                            onClick={() => window.open(photo.file_path, '_blank')}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(photo.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                      {photo.caption && (
                        <p className="mb-0 small">{photo.caption}</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PhotoUpload;