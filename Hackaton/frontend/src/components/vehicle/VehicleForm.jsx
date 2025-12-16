import { useState } from 'react';
import './VehicleForm.css';

const VehicleForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    plate: initialData?.plate || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
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

    if (!formData.plate.trim()) {
      newErrors.plate = 'La placa es requerida';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'La marca es requerida';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'El modelo es requerido';
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
    <form onSubmit={handleSubmit} className="vehicle-form">
      <div className="form-group">
        <label htmlFor="plate">Placa *</label>
        <input
          type="text"
          id="plate"
          name="plate"
          value={formData.plate}
          onChange={handleChange}
          placeholder="ABC-1234"
          className={errors.plate ? 'error' : ''}
        />
        {errors.plate && <span className="error-text">{errors.plate}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="brand">Marca *</label>
        <input
          type="text"
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="Toyota, Ford, etc."
          className={errors.brand ? 'error' : ''}
        />
        {errors.brand && <span className="error-text">{errors.brand}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="model">Modelo *</label>
        <input
          type="text"
          id="model"
          name="model"
          value={formData.model}
          onChange={handleChange}
          placeholder="Corolla, F-150, etc."
          className={errors.model ? 'error' : ''}
        />
        {errors.model && <span className="error-text">{errors.model}</span>}
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
          <option value="MAINTENANCE">En Mantenimiento</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancelar
        </button>
        <button type="submit" className="btn-submit">
          {initialData ? 'Actualizar' : 'Crear Vehículo'}
        </button>
      </div>
    </form>
  );
};

export default VehicleForm;
