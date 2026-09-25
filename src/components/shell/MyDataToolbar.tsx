"use client";

export interface MyDataToolbarProps {
  selecting: boolean;
  selectedCount: number;
  shownCount: number;
  totalCount: number;
  onStartSelecting: () => void;
  onFinishSelecting: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExportSelection: () => void;
  onExportView: () => void;
  onExportAll: () => void;
}

export function MyDataToolbar(props: MyDataToolbarProps) {
  if (props.selecting) {
    return (
      <div className="my-data-toolbar" role="toolbar" aria-label="Select items">
        <span aria-live="polite">{props.selectedCount} selected</span>
        <button type="button" disabled={props.shownCount === 0} onClick={props.onSelectAll}>
          Select all
        </button>
        <button type="button" disabled={props.selectedCount === 0} onClick={props.onClearSelection}>
          Clear
        </button>
        <button
          type="button"
          disabled={props.selectedCount === 0}
          onClick={props.onExportSelection}
        >
          Export selected…
        </button>
        <button type="button" onClick={props.onFinishSelecting}>
          Done
        </button>
      </div>
    );
  }
  return (
    <div className="my-data-toolbar" role="toolbar" aria-label="My Data actions">
      <button type="button" disabled={props.shownCount === 0} onClick={props.onStartSelecting}>
        Select
      </button>
      <button type="button" disabled={props.shownCount === 0} onClick={props.onExportView}>
        Export this list…
      </button>
      <button type="button" disabled={props.totalCount === 0} onClick={props.onExportAll}>
        Export all…
      </button>
    </div>
  );
}
