"use client";

// the print stylesheet in globals.css hides the menu and filters, so the page prints as a statement
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-secondary">
      Print
    </button>
  );
}
