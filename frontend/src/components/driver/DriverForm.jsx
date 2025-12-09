import { useState } from 'react';
import './DriverForm.css';

const DriverForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    license_number: initialData?.license_number || '',
    status: initialData?.status || 'ACTIVE',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.license_number.trim()) {
      newErrors.license_number = 'El número de licencia es requerido';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="driver-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="first_name">Nombre *</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Juan"
            className={errors.first_name ? 'error' : ''}
          />
          {errors.first_name && <span className="error-text">{errors.first_name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Apellido *</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Pérez"
            className={errors.last_name ? 'error' : ''}
          />
          {errors.last_name && <span className="error-text">{errors.last_name}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="license_number">Número de Licencia *</label>
        <input
          type="text"
          id="license_number"
          name="license_number"
          value={formData.license_number}
          onChange={handleChange}
          placeholder="ABC123456"
          className={errors.license_number ? 'error' : ''}
        />
        {errors.license_number && <span className="error-text">{errors.license_number}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="status">Estado</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancelar
        </button>
        <button type="submit" className="btn-submit">
          {initialData ? 'Actualizar' : 'Crear Conductor'}
        </button>
      </div>
    </form>
  );
};

export default DriverForm;
