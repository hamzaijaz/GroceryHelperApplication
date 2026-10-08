export default function ErrorMessage({ message, onDismiss, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="error">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
      {onDismiss && (
        <button type="button" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}
