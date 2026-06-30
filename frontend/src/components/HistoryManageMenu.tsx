import { useEffect, useRef, useState } from "react";

interface HistoryManageMenuProps {
  selectedCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteAll: () => void;
}

export function HistoryManageMenu({
  selectedCount,
  onEdit,
  onDelete,
  onDeleteAll,
}: HistoryManageMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="action-menu" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Manage history
      </button>
      {open && (
        <div className="action-menu-panel" role="menu">
          <button
            type="button"
            role="menuitem"
            className="action-menu-item"
            onClick={() => run(onEdit)}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className="action-menu-item action-menu-item-danger"
            onClick={() => run(onDelete)}
          >
            Delete{selectedCount > 1 ? ` (${selectedCount})` : ""}
          </button>
          <button
            type="button"
            role="menuitem"
            className="action-menu-item action-menu-item-danger"
            onClick={() => run(onDeleteAll)}
          >
            Delete all
          </button>
        </div>
      )}
    </div>
  );
}
