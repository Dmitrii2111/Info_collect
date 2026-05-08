import { useEffect } from "react";
import { CloseOutlined } from "@ant-design/icons";

export function DesktopModalShell({
  children,
  onClose,
  size = "default",
  title,
  subtitle,
  headerContent,
  footer,
  closeDisabled = false,
  bodyClassName = "",
  headerClassName = "",
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDisabled, onClose]);

  const handleClose = () => {
    if (!closeDisabled) {
      onClose();
    }
  };

  return (
    <div className="reg-modal-layer" role="presentation" onMouseDown={handleClose}>
      <div
        className={`reg-modal reg-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "desktop-modal-title" : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`reg-modal-header ${headerClassName}`}>
          {headerContent ?? (
            <div>
              <h2 className="reg-modal-title" id="desktop-modal-title">{title}</h2>
              {subtitle ? <p className="reg-modal-subtitle">{subtitle}</p> : null}
            </div>
          )}
          <button
            className="reg-modal-close"
            type="button"
            onClick={handleClose}
            aria-label="Закрыть"
            disabled={closeDisabled}
          >
            <CloseOutlined aria-hidden="true" />
          </button>
        </div>
        <div className={`reg-modal-body ${bodyClassName}`}>
          {children}
        </div>
        {footer ? <div className="reg-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
