// Base URL of the GroceryHelper API. Empty by default so requests go to /api on the same
// origin (proxied to the backend by Vite in dev). Set VITE_API_BASE_URL to call it directly.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const GROCERIES_URL = `${BASE_URL}/api/groceries`;

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const DEFAULT_MESSAGES = {
  400: 'The request was invalid. Please check your input.',
  404: 'The requested grocery was not found.',
};

function defaultMessage(status) {
  if (DEFAULT_MESSAGES[status]) return DEFAULT_MESSAGES[status];
  if (status >= 500) return 'A server error occurred. Please try again later.';
  return `Request failed with status ${status}.`;
}

// Turns ValidationProblemDetails keys such as "Name" or "$.quantity" into "name" / "quantity".
function normaliseFieldErrors(errors) {
  if (!errors || typeof errors !== 'object') return {};
  const result = {};
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.replace(/^\$\.?/, '');
    const normalised = field ? field.charAt(0).toLowerCase() + field.slice(1) : 'request';
    result[normalised] = [...(result[normalised] ?? []), ...(Array.isArray(messages) ? messages : [String(messages)])];
  }
  return result;
}

async function readJson(response) {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(url, { method = 'GET', body } = {}) {
  const options = { method, headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError(0, 'Could not reach the server. Please check that the GroceryHelper API is running.');
  }

  if (response.status === 204) return null;

  const data = await readJson(response);
  if (!response.ok) {
    const problem = data ?? {};
    throw new ApiError(
      response.status,
      problem.detail || problem.title || defaultMessage(response.status),
      normaliseFieldErrors(problem.errors)
    );
  }
  return data;
}

export function getGroceries(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`${GROCERIES_URL}${query}`);
}

export function createGrocery(grocery) {
  return request(GROCERIES_URL, { method: 'POST', body: grocery });
}

export function updateGrocery(id, grocery) {
  return request(`${GROCERIES_URL}/${encodeURIComponent(id)}`, { method: 'PUT', body: grocery });
}

export function deleteGrocery(id) {
  return request(`${GROCERIES_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
