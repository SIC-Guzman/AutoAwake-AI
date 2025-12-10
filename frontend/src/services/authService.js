const API_URL = import.meta.env.VITE_API_URL;

/**
 * Servicio de autenticación
 */
const authService = {
  /**
   * Registra un nuevo usuario
   * @param {string} name - Nombre del usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @param {number} roleId - ID del rol (1=Admin, 2=User, etc.)
   * @returns {Promise<Object>} - Datos del usuario registrado
   */
  register: async (name, email, password, roleId = 2) => {
    try {
      const payload = { 
        name, 
        email, 
        password,
        role_id: roleId
      };
      console.log('Enviando registro:', payload);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Error al registrar usuario';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        console.error('Error del servidor:', errorMessage, 'Status:', response.status);
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        return { message: 'Usuario registrado exitosamente' };
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        return { message: text };
      }
    } catch (error) {
      console.error('Error en register:', error);
      throw error;
    }
  },

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} - Datos del usuario y token
   */
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Error al iniciar sesión';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Respuesta vacía del servidor');
      }

      const data = JSON.parse(text);
      
      // Guardar el token en localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Guardar email como user temporalmente
        localStorage.setItem('user', JSON.stringify({ email }));
      } else {
        throw new Error('No se recibió token del servidor');
      }

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Obtiene el token almacenado
   * @returns {string|null} - Token de autenticación
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Obtiene el usuario almacenado
   * @returns {Object|null} - Datos del usuario
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
