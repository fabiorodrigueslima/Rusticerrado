/**
 * Índice de Serviços
 * Exporta todos os serviços disponíveis
 */

export { default as api } from './api';
export { default as authService } from './authService';
export { default as productService } from './productService';
export { default as cartService } from './cartService';
export { default as userService } from './userService';
export { default as reviewService } from './reviewService';
export { default as contactService } from './contactService';

// Exportar como objeto único
import api from './api';
import authService from './authService';
import productService from './productService';
import cartService from './cartService';
import userService from './userService';
import reviewService from './reviewService';
import contactService from './contactService';

const services = {
  api,
  authService,
  productService,
  cartService,
  userService,
  reviewService,
  contactService
};

export default services;