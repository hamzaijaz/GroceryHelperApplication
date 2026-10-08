# GroceryHelperApplication

A simple React frontend (Vite + function components) for the GroceryHelper .NET API.
It lists, filters, adds, edits and deletes groceries using these endpoints:

| Action | Endpoint |
| --- | --- |
| List / filter by category | `GET /api/groceries?category=…` |
| Add | `POST /api/groceries` |
| Edit | `PUT /api/groceries/{id}` |
| Delete | `DELETE /api/groceries/{id}` |

## Requirements

- Node.js 24+
- The GroceryHelper API running locally

## Setup

```bash
npm install
```

Point the dev server at your API by copying `.env.example` to `.env` and setting `API_PROXY_TARGET`
to the API's URL (for example `https://localhost:7123`). The default is `http://localhost:5000`.
The Vite dev server proxies `/api` to that address, so you don't need CORS for local development.

To call the API directly instead (for example from a production build), set `VITE_API_BASE_URL`.
The API then has to allow CORS from the app's origin.

## Scripts

```bash
npm run dev      # start the app at http://localhost:5173
npm test         # run the test suite once
npm run test:watch
npm run build    # production build into dist/
```

## Project layout

```
src/
  api/groceryApi.js          fetch wrapper; turns ProblemDetails into ApiError
  constants/categories.js    GroceryCategory enum values
  components/                CategorySelect, QuantityInput, GroceryForm, GroceryList, ErrorMessage
  App.jsx                    page state and CRUD flows
tests/                       Vitest + React Testing Library tests
```

## Error handling

- If the API can't be reached, the app shows a "could not reach the server" message.
- On a 400, the `ValidationProblemDetails` errors are shown next to the matching field. Any errors for other fields are added to the form's message.
- On a 404 during an edit or delete, the app removes the item from the list and says the item no longer exists.
- Other errors use the `detail` or `title` from the response, or a generic message. You can dismiss the message or retry.
