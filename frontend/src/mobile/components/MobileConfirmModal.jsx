import { ExclamationCircleOutlined } from "@ant-design/icons";
import { MobileBottomSheet } from "./MobileBottomSheet.jsx";

export function MobileConfirmModal({
  isOpen,
  title,
  text,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  tone = "primary",
  onCancel,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <MobileBottomSheet
      title={title}
      mode="modal"
      onClose={onCancel}
      className="mobile-confirm-sheet"
      footer={({ close }) => (
        <>
          <button className="mobile-secondary-button" type="button" onClick={() => close(onCancel)}>
            {cancelLabel}
          </button>
          <button
            className={`mobile-primary-button${tone === "danger" ? " is-danger" : ""}`}
            type="button"
            onClick={() => close(onConfirm)}
          >
            {confirmLabel}
          </button>
        </>
      )}
    >
      <div className="mobile-confirm-body">
        <ExclamationCircleOutlined aria-hidden="true" />
        <p>{text}</p>
      </div>
    </MobileBottomSheet>
  );
}
