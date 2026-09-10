import "../styles/ui.css";

type CookieConsentModalProps = {
  title: string;
  body: string;
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
};

export function CookieConsentModal({
  title,
  body,
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
}: CookieConsentModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <h2 id="cookie-consent-title">{title}</h2>
        <p className="page-lede">{body}</p>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onDecline}>
            {declineLabel}
          </button>
          <button type="button" className="btn" onClick={onAccept}>
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
