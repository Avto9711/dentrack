import type { ReactNode } from 'react';
import './DataTable.css';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data = [], isLoading = false, emptyMessage = 'No records yet.' }: DataTableProps<T>) {
  if (isLoading) {
    return <div className="table-state">Cargando...</div>;
  }

  if (!data.length) {
    return <div className="table-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const fallbackRow = row as Record<string, unknown>;
            return (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : (fallbackRow[column.key] as ReactNode)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
