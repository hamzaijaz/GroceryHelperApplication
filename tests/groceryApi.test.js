import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGroceries,
  createGrocery,
  updateGrocery,
  deleteGrocery,
  ApiError,
} from '../src/api/groceryApi';

function jsonResponse(status, body, contentType = 'application/json') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType },
  });
}

describe('groceryApi', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  describe('getGroceries', () => {
    it('GETs /api/groceries without a category', async () => {
      const items = [{ id: '1', name: 'Milk', quantity: 2, category: 'Dairy' }];
      fetchMock.mockResolvedValue(jsonResponse(200, items));

      const result = await getGroceries();

      expect(fetchMock).toHaveBeenCalledWith('/api/groceries', expect.objectContaining({ method: 'GET' }));
      expect(result).toEqual(items);
    });

    it('adds the category query parameter when given', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, []));

      await getGroceries('FrozenFood');

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/groceries?category=FrozenFood',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('createGrocery', () => {
    it('POSTs JSON and returns the created grocery', async () => {
      const request = { name: 'Apple', quantity: 3, category: 'Fruit' };
      const created = { id: 'abc', ...request };
      fetchMock.mockResolvedValue(jsonResponse(201, created));

      const result = await createGrocery(request);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/groceries',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
      expect(result).toEqual(created);
    });
  });

  describe('updateGrocery', () => {
    it('PUTs to /api/groceries/{id} and returns the updated grocery', async () => {
      const request = { name: 'Apple', quantity: 5, category: 'Fruit' };
      fetchMock.mockResolvedValue(jsonResponse(200, { id: 'abc', ...request }));

      const result = await updateGrocery('abc', request);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/groceries/abc',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(request) })
      );
      expect(result).toEqual({ id: 'abc', ...request });
    });

    it('encodes the id in the URL', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      await updateGrocery('a/b', { name: 'x', quantity: 1, category: 'Dairy' });
      expect(fetchMock.mock.calls[0][0]).toBe('/api/groceries/a%2Fb');
    });
  });

  describe('deleteGrocery', () => {
    it('DELETEs /api/groceries/{id} and handles 204 No Content', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

      const result = await deleteGrocery('abc');

      expect(fetchMock).toHaveBeenCalledWith('/api/groceries/abc', expect.objectContaining({ method: 'DELETE' }));
      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('throws ApiError with normalised field errors for 400 ValidationProblemDetails', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(
          400,
          {
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { Name: ['Name is required.'], '$.quantity': ['Invalid number.'] },
          },
          'application/problem+json'
        )
      );

      const error = await createGrocery({ name: '', quantity: 1, category: 'Dairy' }).catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(400);
      expect(error.message).toBe('One or more validation errors occurred.');
      expect(error.fieldErrors).toEqual({ name: ['Name is required.'], quantity: ['Invalid number.'] });
    });

    it('throws ApiError using ProblemDetails detail for 404', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(404, { title: 'Not Found', status: 404, detail: 'Grocery abc was not found.' }, 'application/problem+json')
      );

      const error = await deleteGrocery('abc').catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(404);
      expect(error.message).toBe('Grocery abc was not found.');
      expect(error.fieldErrors).toEqual({});
    });

    it('falls back to a generic message when the error body is not JSON', async () => {
      fetchMock.mockResolvedValue(new Response('boom', { status: 500, headers: { 'Content-Type': 'text/plain' } }));

      const error = await getGroceries().catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(500);
      expect(error.message).toMatch(/server error/i);
    });

    it('throws a friendly ApiError when the server cannot be reached', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      const error = await getGroceries().catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(0);
      expect(error.message).toMatch(/could not reach the server/i);
    });
  });
});
