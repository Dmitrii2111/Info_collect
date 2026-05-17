import { CloseOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";

export function MobileBottomSheet({ title, subtitle, mode = "sheet", onClose, children, footer, className = "" }) {
  const closeTimerRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  const close = (afterClose) => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      if (typeof afterClose === "function") {
        afterClose();
        return;
      }

      onClose();
    }, 220);
  };

  return (
    <div className={`mobile-overlay is-${mode}${isClosing ? " is-closing" : ""}`} role="presentation">
      <button className="mobile-overlay-backdrop" type="button" aria-label="Закрыть" onClick={() => close()} />
      <section className={`mobile-bottom-sheet ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="mobile-bottom-sheet-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" aria-label="Закрыть" onClick={() => close()}>
            <CloseOutlined aria-hidden="true" />
          </button>
        </header>
        <div className="mobile-bottom-sheet-body">{children}</div>
        {footer ? (
          <footer className="mobile-bottom-sheet-footer">
            {typeof footer === "function" ? footer({ close }) : footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
