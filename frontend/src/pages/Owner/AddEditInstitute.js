import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBuilding, FaEnvelope, FaMapMarkerAlt, FaChalkboardTeacher, FaGraduationCap, FaSave, FaTimes } from 'react-icons/fa';

const AddEditInstitute = ({ show, onHide, onSave, initial }) => {
  const [form, setForm] = useState(initial || { instituteName: '', email: '', address: '', instituteType: '', totalTeachers: 0, totalStudents: 0 });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.instituteName || !form.email) {
      setError('Name and Email are required');
      return;
    }
    setError('');
    onSave(form);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton style={{
        background: 'var(--theme-color)',
        color: '#fff',
        borderBottom: 'none'
      }}>
        <Modal.Title style={{ fontSize: '1.15rem', fontWeight: 700 }}>
          <FaBuilding className="me-2" />
          {initial ? 'Edit Institute' : 'Add Institute'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4" style={{ background: '#f9fafb' }}>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="danger" onClose={() => setError('')} dismissible className="mb-3">
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              <FaBuilding className="me-1" />Name
            </Form.Label>
            <Form.Control 
              name="instituteName" 
              value={form.instituteName} 
              onChange={handleChange} 
              required
              style={{
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px 12px',
                fontSize: '0.9rem'
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              <FaEnvelope className="me-1" />Email
            </Form.Label>
            <Form.Control 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              required
              style={{
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px 12px',
                fontSize: '0.9rem'
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              <FaMapMarkerAlt className="me-1" />Address
            </Form.Label>
            <Form.Control 
              name="address" 
              value={form.address} 
              onChange={handleChange}
              style={{
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px 12px',
                fontSize: '0.9rem'
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              <FaBuilding className="me-1" />Type
            </Form.Label>
            <Form.Control 
              name="instituteType" 
              value={form.instituteType} 
              onChange={handleChange}
              style={{
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px 12px',
                fontSize: '0.9rem'
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              <FaChalkboardTeacher className="me-1" />Teachers
            </Form.Label>
            <Form.Control 
              type="number" 
              name="totalTeachers" 
              value={form.totalTeachers} 
              onChange={handleChange}
              style={{
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px 12px',
                fontSize: '0.9rem'
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              <FaGraduationCap className="me-1" />Students
            </Form.Label>
            <Form.Control 
              type="number" 
              name="totalStudents" 
              value={form.totalStudents} 
              onChange={handleChange}
              style={{
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                padding: '10px 12px',
                fontSize: '0.9rem'
              }}
            />
          </Form.Group>
          <div className="d-flex gap-2 justify-content-end mt-4">
            <Button onClick={onHide} style={{
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FaTimes />Cancel
            </Button>
            <Button type="submit" style={{
              background: 'var(--theme-color)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 1px 3px rgba(126, 34, 206, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FaSave />{initial ? 'Update' : 'Add'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddEditInstitute;
