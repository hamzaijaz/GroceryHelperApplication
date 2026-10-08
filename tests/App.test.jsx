import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import * as api from '../src/api/groceryApi';

vi.mock('../src/api/groceryApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getGroceries: vi.fn(),
    createGrocery: vi.fn(),
    updateGrocery: vi.fn(),
    deleteGrocery: vi.fn(),
  };
});

const milk = { id: '1', name: 'Milk', quantity: 2, category: 'Dairy' };
const apple = { id: '2', name: 'Apple', quantity: 6, category: 'Fruit' };

function addForm() {
  return within(screen.getByRole('form', { name: 'Add grocery' }));
}

function editForm() {
  return within(screen.getByRole('form', { name: 'Edit grocery' }));
}

function rowFor(name) {
  return within(screen.getByRole('row', { name: new RegExp(name) }));
}

async function renderLoaded(items = [milk, apple]) {
  api.getGroceries.mockResolvedValue(items);
  render(<App />);
  if (items.length) await screen.findByRole('cell', { name: items[0].name });
  else await screen.findByText(/no groceries found/i);
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  describe('listing', () => {
    it('shows a loading indicator then the groceries', async () => {
      api.getGroceries.mockResolvedValue([milk, apple]);
      render(<App />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(await screen.findByRole('cell', { name: 'Milk' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Apple' })).toBeInTheDocument();
      expect(rowFor('Apple').getByRole('cell', { name: '6' })).toBeInTheDocument();
      expect(api.getGroceries).toHaveBeenCalledWith(undefined);
    });

    it('shows an empty-state message', async () => {
      await renderLoaded([]);
      expect(screen.getByText(/no groceries found/i)).toBeInTheDocument();
    });

    it('filters by category via the dropdown', async () => {
      await renderLoaded();
      api.getGroceries.mockResolvedValue([apple]);

      await userEvent.selectOptions(screen.getByLabelText('Filter by category'), 'Fruit');

      await waitFor(() => expect(api.getGroceries).toHaveBeenLastCalledWith('Fruit'));
      await waitFor(() => expect(screen.queryByRole('cell', { name: 'Milk' })).not.toBeInTheDocument());
      expect(screen.getByRole('cell', { name: 'Apple' })).toBeInTheDocument();
    });

    it('shows a load error and lets the user retry', async () => {
      api.getGroceries.mockRejectedValueOnce(new api.ApiError(0, 'Could not reach the server.'));
      render(<App />);

      expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server.');

      api.getGroceries.mockResolvedValue([milk]);
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByRole('cell', { name: 'Milk' })).toBeInTheDocument();
      expect(screen.queryByText('Could not reach the server.')).not.toBeInTheDocument();
    });
  });

  describe('adding', () => {
    it('creates a grocery and shows it in the list', async () => {
      await renderLoaded([milk]);
      const created = { id: '3', name: 'Carrot', quantity: 4, category: 'Vegetables' };
      api.createGrocery.mockResolvedValue(created);

      const form = addForm();
      await userEvent.type(form.getByLabelText('Name'), 'Carrot');
      await userEvent.clear(form.getByLabelText('Quantity'));
      await userEvent.type(form.getByLabelText('Quantity'), '4');
      await userEvent.selectOptions(form.getByLabelText('Category'), 'Vegetables');
      await userEvent.click(form.getByRole('button', { name: 'Add' }));

      expect(api.createGrocery).toHaveBeenCalledWith({ name: 'Carrot', quantity: 4, category: 'Vegetables' });
      expect(await screen.findByRole('cell', { name: 'Carrot' })).toBeInTheDocument();
      expect(form.getByLabelText('Name')).toHaveValue('');
    });

    it('creates a grocery without a category', async () => {
      await renderLoaded([milk]);
      api.createGrocery.mockResolvedValue({ id: '4', name: 'Bread', quantity: 1, category: null });

      const form = addForm();
      expect(form.getByLabelText('Category')).toHaveValue('');
      await userEvent.type(form.getByLabelText('Name'), 'Bread');
      await userEvent.click(form.getByRole('button', { name: 'Add' }));

      expect(api.createGrocery).toHaveBeenCalledWith({ name: 'Bread', quantity: 1, category: null });
      expect(await screen.findByRole('cell', { name: 'Bread' })).toBeInTheDocument();
      expect(rowFor('Bread').getByRole('cell', { name: '—' })).toBeInTheDocument();
    });

    it('does not show a new item that does not match the active filter', async () => {
      await renderLoaded([milk]);
      await userEvent.selectOptions(screen.getByLabelText('Filter by category'), 'Dairy');
      api.createGrocery.mockResolvedValue({ id: '3', name: 'Pear', quantity: 1, category: 'Fruit' });

      const form = addForm();
      await userEvent.type(form.getByLabelText('Name'), 'Pear');
      await userEvent.selectOptions(form.getByLabelText('Category'), 'Fruit');
      await userEvent.click(form.getByRole('button', { name: 'Add' }));

      await waitFor(() => expect(api.createGrocery).toHaveBeenCalled());
      expect(screen.queryByRole('cell', { name: 'Pear' })).not.toBeInTheDocument();
    });

    it('shows backend validation errors on the add form', async () => {
      await renderLoaded([milk]);
      api.createGrocery.mockRejectedValue(
        new api.ApiError(400, 'One or more validation errors occurred.', { name: ['Name already exists.'] })
      );

      const form = addForm();
      await userEvent.type(form.getByLabelText('Name'), 'Milk');
      await userEvent.click(form.getByRole('button', { name: 'Add' }));

      expect(await form.findByText('Name already exists.')).toBeInTheDocument();
      expect(form.getByRole('alert')).toHaveTextContent('One or more validation errors occurred.');
    });
  });

  describe('editing', () => {
    it('opens a pre-filled edit form and saves changes', async () => {
      await renderLoaded();
      api.updateGrocery.mockResolvedValue({ ...milk, quantity: 3 });

      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Edit' }));
      const form = editForm();
      expect(form.getByLabelText('Name')).toHaveValue('Milk');
      expect(form.getByLabelText('Quantity')).toHaveValue(2);
      expect(form.getByLabelText('Category')).toHaveValue('Dairy');

      await userEvent.click(form.getByRole('button', { name: /increase quantity/i }));
      await userEvent.click(form.getByRole('button', { name: 'Save' }));

      expect(api.updateGrocery).toHaveBeenCalledWith('1', { name: 'Milk', quantity: 3, category: 'Dairy' });
      await waitFor(() => expect(screen.queryByRole('form', { name: 'Edit grocery' })).not.toBeInTheDocument());
      expect(rowFor('Milk').getByRole('cell', { name: '3' })).toBeInTheDocument();
    });

    it('closes the edit form on cancel without saving', async () => {
      await renderLoaded();
      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Edit' }));
      await userEvent.click(editForm().getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('form', { name: 'Edit grocery' })).not.toBeInTheDocument();
      expect(api.updateGrocery).not.toHaveBeenCalled();
    });

    it('handles 404 by removing the stale item and explaining why', async () => {
      await renderLoaded();
      api.updateGrocery.mockRejectedValue(new api.ApiError(404, 'Grocery 1 was not found.'));

      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Edit' }));
      await userEvent.click(editForm().getByRole('button', { name: 'Save' }));

      expect(await screen.findByText(/no longer exists/i)).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: 'Milk' })).not.toBeInTheDocument();
      expect(screen.queryByRole('form', { name: 'Edit grocery' })).not.toBeInTheDocument();
    });

    it('shows backend validation errors on the edit form', async () => {
      await renderLoaded();
      api.updateGrocery.mockRejectedValue(new api.ApiError(400, 'Invalid.', { quantity: ['Quantity must be at most 100.'] }));

      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Edit' }));
      await userEvent.click(editForm().getByRole('button', { name: 'Save' }));

      expect(await editForm().findByText('Quantity must be at most 100.')).toBeInTheDocument();
    });
  });

  describe('deleting', () => {
    it('deletes a grocery after confirmation', async () => {
      await renderLoaded();
      api.deleteGrocery.mockResolvedValue(null);

      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Delete' }));

      expect(window.confirm).toHaveBeenCalled();
      expect(api.deleteGrocery).toHaveBeenCalledWith('1');
      await waitFor(() => expect(screen.queryByRole('cell', { name: 'Milk' })).not.toBeInTheDocument());
    });

    it('does nothing when the user cancels the confirmation', async () => {
      await renderLoaded();
      window.confirm.mockReturnValue(false);

      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Delete' }));

      expect(api.deleteGrocery).not.toHaveBeenCalled();
      expect(screen.getByRole('cell', { name: 'Milk' })).toBeInTheDocument();
    });

    it('handles 404 by removing the stale item and explaining why', async () => {
      await renderLoaded();
      api.deleteGrocery.mockRejectedValue(new api.ApiError(404, 'Not Found'));

      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Delete' }));

      expect(await screen.findByText(/no longer exists/i)).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: 'Milk' })).not.toBeInTheDocument();
    });

    it('shows other delete errors and keeps the item', async () => {
      await renderLoaded();
      api.deleteGrocery.mockRejectedValue(new api.ApiError(500, 'A server error occurred.'));

      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Delete' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('A server error occurred.');
      expect(screen.getByRole('cell', { name: 'Milk' })).toBeInTheDocument();
    });

    it('lets the user dismiss an error message', async () => {
      await renderLoaded();
      api.deleteGrocery.mockRejectedValue(new api.ApiError(500, 'A server error occurred.'));
      await userEvent.click(rowFor('Milk').getByRole('button', { name: 'Delete' }));

      await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));

      expect(screen.queryByText('A server error occurred.')).not.toBeInTheDocument();
    });
  });
});
