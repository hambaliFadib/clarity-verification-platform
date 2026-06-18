import * as React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────
   Table wrapper
   ────────────────────────────────────────────────── */
const DataTable = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("overflow-x-auto bg-card border border-outline-variant rounded-lg shadow-subtle", className)} {...props}>
    <table className="w-full text-left text-body-md">
      {children}
    </table>
  </div>
));
DataTable.displayName = "DataTable";

/* ──────────────────────────────────────────────────
   Table Head
   ────────────────────────────────────────────────── */
const TableHead = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-surface-container-low border-b border-outline-variant", className)} {...props} />
));
TableHead.displayName = "TableHead";

/* ──────────────────────────────────────────────────
   Table Body
   ────────────────────────────────────────────────── */
const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("divide-y divide-outline-variant/50", className)} {...props} />
));
TableBody.displayName = "TableBody";

/* ──────────────────────────────────────────────────
   Table Row
   ────────────────────────────────────────────────── */
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className, clickable, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors",
      clickable && "hover:bg-surface-container-low cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

/* ──────────────────────────────────────────────────
   Table Header Cell
   ────────────────────────────────────────────────── */
const TableHeaderCell = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("text-left px-4 py-2.5 text-label-sm font-semibold text-muted-foreground uppercase tracking-wide", className)} {...props} />
));
TableHeaderCell.displayName = "TableHeaderCell";

/* ──────────────────────────────────────────────────
   Table Cell
   ────────────────────────────────────────────────── */
const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("px-4 py-3 text-body-md", className)} {...props} />
));
TableCell.displayName = "TableCell";

export { DataTable, TableHead, TableBody, TableRow, TableHeaderCell, TableCell };
