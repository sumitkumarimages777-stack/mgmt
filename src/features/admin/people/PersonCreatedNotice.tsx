import { Modal } from "../../../components/ui";

/** Shown once after creating a login: the details to send the new person. */
export function PersonCreatedNotice({ name, email, password, onClose }: {
  name: string;
  email: string;
  password: string;
  onClose: () => void;
}) {
  const text =
    `Login: ${window.location.origin}\nEmail: ${email}\nTemporary password: ${password}\n\n` +
    "Please change your password after signing in (click your name at the bottom-left).";
  return (
    <Modal title="Person added" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Done</button>}>
      <div className="form">
        <div className="alert alert-ok">{name || email} can now sign in. Send them these details privately (e.g. WhatsApp):</div>
        <textarea className="textarea" readOnly value={text} style={{ minHeight: 120 }} onFocus={(e) => e.target.select()} />
        <div>
          <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(text)}>Copy</button>
        </div>
        <p className="faint small" style={{ margin: 0 }}>This password is not shown again. You can reset it later from this page.</p>
      </div>
    </Modal>
  );
}
