import { useCallback, useEffect, useState } from 'react';
import { getGroceries, createGrocery, updateGrocery, deleteGrocery } from './api/groceryApi';
import CategorySelect from './components/CategorySelect';
import ErrorMessage from './components/ErrorMessage';
import GroceryForm from './components/GroceryForm';
import GroceryList from './components/GroceryList';

const NOT_FOUND_MESSAGE = 'That grocery no longer exists (it may have been deleted elsewhere). It has been removed from the list.';

export default function App() {
  const [groceries, setGroceries] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editing, setEditing] = useState(null);

  const loadGroceries = useCallback(async (category) => {
    setLoading(true);
    setLoadError('');
    try {
      setGroceries(await getGroceries(category || undefined));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroceries(filter);
  }, [filter, loadGroceries]);

  const matchesFilter = (grocery) => !filter || grocery.category === filter;

  function removeLocally(id) {
    setGroceries((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleAdd(request) {
    const created = await createGrocery(request);
    setActionError('');
    if (matchesFilter(created)) setGroceries((prev) => [...prev, created]);
  }

  async function handleUpdate(request) {
    try {
      const updated = await updateGrocery(editing.id, request);
      setGroceries((prev) => prev.map((g) => (g.id === updated.id ? updated : g)).filter(matchesFilter));
      setEditing(null);
      setActionError('');
    } catch (error) {
      if (error.status !== 404) throw error;
      removeLocally(editing.id);
      setEditing(null);
      setActionError(NOT_FOUND_MESSAGE);
    }
  }

  async function handleDelete(grocery) {
    if (!window.confirm(`Delete "${grocery.name}"?`)) return;
    setActionError('');
    try {
      await deleteGrocery(grocery.id);
      removeLocally(grocery.id);
    } catch (error) {
      if (error.status === 404) {
        removeLocally(grocery.id);
        setActionError(NOT_FOUND_MESSAGE);
      } else {
        setActionError(error.message);
      }
    }
    if (editing?.id === grocery.id) setEditing(null);
  }

  return (
    <main>
      <h1>Grocery Helper</h1>

      <GroceryForm title="Add grocery" submitLabel="Add" onSubmit={handleAdd} resetOnSuccess />

      {editing && (
        <GroceryForm
          key={editing.id}
          title="Edit grocery"
          submitLabel="Save"
          initialValues={editing}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      <section>
        <h2>Groceries</h2>
        <CategorySelect id="filter" label="Filter by category" value={filter} onChange={setFilter} includeAll />
        <ErrorMessage message={actionError} onDismiss={() => setActionError('')} />
        {loading ? (
          <p>Loading…</p>
        ) : loadError ? (
          <ErrorMessage message={loadError} onRetry={() => loadGroceries(filter)} />
        ) : (
          <GroceryList groceries={groceries} onEdit={setEditing} onDelete={handleDelete} />
        )}
      </section>
    </main>
  );
}
