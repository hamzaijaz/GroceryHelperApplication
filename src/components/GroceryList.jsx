import { categoryLabel } from '../constants/categories';

export default function GroceryList({ groceries, onEdit, onDelete }) {
  if (!groceries.length) return <p>No groceries found.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Quantity</th>
          <th>Category</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {groceries.map((grocery) => (
          <tr key={grocery.id}>
            <td>{grocery.name}</td>
            <td>{grocery.quantity}</td>
            <td>{categoryLabel(grocery.category ?? '')}</td>
            <td>
              <button type="button" onClick={() => onEdit(grocery)}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(grocery)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
