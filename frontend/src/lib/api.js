import axios from 'axios';

const backendUrl = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const API_URL = `${backendUrl}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Accounts
export const getAccounts = () => 
  axios.get(`${API_URL}/accounts`, { headers: getAuthHeader() });

export const createAccount = (data) => 
  axios.post(`${API_URL}/accounts`, data, { headers: getAuthHeader() });

export const updateAccount = (id, data) => 
  axios.put(`${API_URL}/accounts/${id}`, data, { headers: getAuthHeader() });

export const deleteAccount = (id) => 
  axios.delete(`${API_URL}/accounts/${id}`, { headers: getAuthHeader() });

// Cards
export const getCards = () => 
  axios.get(`${API_URL}/cards`, { headers: getAuthHeader() });

export const createCard = (data) => 
  axios.post(`${API_URL}/cards`, data, { headers: getAuthHeader() });

export const updateCard = (id, data) => 
  axios.put(`${API_URL}/cards/${id}`, data, { headers: getAuthHeader() });

export const deleteCard = (id) => 
  axios.delete(`${API_URL}/cards/${id}`, { headers: getAuthHeader() });

// Transactions
export const getTransactions = (params) => 
  axios.get(`${API_URL}/transactions`, { headers: getAuthHeader(), params });

export const createTransaction = (data) => 
  axios.post(`${API_URL}/transactions`, data, { headers: getAuthHeader() });

export const updateTransaction = (id, data) => 
  axios.put(`${API_URL}/transactions/${id}`, data, { headers: getAuthHeader() });

export const deleteTransaction = (id) => 
  axios.delete(`${API_URL}/transactions/${id}`, { headers: getAuthHeader() });

// Categories
export const getCategories = () => 
  axios.get(`${API_URL}/categories`, { headers: getAuthHeader() });

export const createCategory = (data) => 
  axios.post(`${API_URL}/categories`, data, { headers: getAuthHeader() });

export const updateCategory = (id, data) => 
  axios.put(`${API_URL}/categories/${id}`, data, { headers: getAuthHeader() });

export const deleteCategory = (id) => 
  axios.delete(`${API_URL}/categories/${id}`, { headers: getAuthHeader() });

// Tags
export const getTags = () => 
  axios.get(`${API_URL}/tags`, { headers: getAuthHeader() });

export const createTag = (data) => 
  axios.post(`${API_URL}/tags`, data, { headers: getAuthHeader() });

export const deleteTag = (id) => 
  axios.delete(`${API_URL}/tags/${id}`, { headers: getAuthHeader() });

// Recurring
export const getRecurring = () => 
  axios.get(`${API_URL}/recurring`, { headers: getAuthHeader() });

export const createRecurring = (data) => 
  axios.post(`${API_URL}/recurring`, data, { headers: getAuthHeader() });

export const updateRecurring = (id, data) => 
  axios.put(`${API_URL}/recurring/${id}`, data, { headers: getAuthHeader() });

export const deleteRecurring = (id) => 
  axios.delete(`${API_URL}/recurring/${id}`, { headers: getAuthHeader() });

// Dashboard
export const getDashboard = () => 
  axios.get(`${API_URL}/dashboard`, { headers: getAuthHeader() });
