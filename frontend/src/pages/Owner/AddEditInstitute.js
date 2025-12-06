import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

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
      <Modal.Header closeButton>
        <Modal.Title>{initial ? 'Edit Institute' : 'Add Institute'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control name="instituteName" value={form.instituteName} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control name="email" value={form.email} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control name="address" value={form.address} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <Form.Control name="instituteType" value={form.instituteType} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Teachers</Form.Label>
            <Form.Control type="number" name="totalTeachers" value={form.totalTeachers} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Students</Form.Label>
            <Form.Control type="number" name="totalStudents" value={form.totalStudents} onChange={handleChange} />
          </Form.Group>
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="secondary" onClick={onHide}>Cancel</Button>
            <Button variant="primary" type="submit">{initial ? 'Update' : 'Add'}</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddEditInstitute;
