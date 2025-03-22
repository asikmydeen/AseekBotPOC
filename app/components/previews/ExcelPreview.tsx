import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface ExcelPreviewProps {
  fileUrl: string;
  maxRows?: number;
  maxCols?: number;
}

const ExcelPreview: React.FC<ExcelPreviewProps> = ({
  fileUrl,
  maxRows = 100,
  maxCols = 20
}) => {
  const [data, setData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');

  useEffect(() => {
    const fetchExcelFile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch Excel file');
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Get all sheet names
        const sheets = workbook.SheetNames;
        setSheetNames(sheets);

        if (sheets.length === 0) {
          throw new Error('No sheets found in the Excel file');
        }

        // Set the first sheet as active by default
        const firstSheet = sheets[0];
        setActiveSheet(firstSheet);

        // Process the first sheet
        processSheet(workbook, firstSheet);
      } catch (err) {
        console.error('Error loading Excel file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Excel file');
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      fetchExcelFile();
    }
  }, [fileUrl]);

  const processSheet = (workbook: XLSX.WorkBook, sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (jsonData.length === 0) {
      setHeaders([]);
      setData([]);
      return;
    }

    // Extract headers (first row)
    const headerRow = jsonData[0];
    const headers = headerRow.slice(0, maxCols).map(header =>
      header ? header.toString() : `Column ${header}`
    );

    // Extract data (remaining rows)
    const rows = jsonData.slice(1, maxRows + 1).map(row =>
      row.slice(0, maxCols)
    );

    setHeaders(headers);
    setData(rows);
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSheet = e.target.value;
    setActiveSheet(selectedSheet);

    // Re-fetch and process the selected sheet
    const fetchAndProcessSheet = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        processSheet(workbook, selectedSheet);
      } catch (err) {
        console.error('Error processing sheet:', err);
        setError(err instanceof Error ? err.message : 'Failed to process sheet');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessSheet();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <span className="ml-2">Loading Excel file...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 border border-red-300 rounded bg-red-50">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (data.length === 0 && headers.length === 0) {
    return (
      <div className="p-4 text-gray-500 border border-gray-300 rounded bg-gray-50">
        <p>No data found in the Excel file</p>
      </div>
    );
  }

  return (
    <div className="excel-preview overflow-hidden border border-gray-200 rounded-md">
      {sheetNames.length > 1 && (
        <div className="p-2 bg-gray-50 border-b border-gray-200">
          <label className="mr-2 text-sm font-medium">Sheet:</label>
          <select
            value={activeSheet}
            onChange={handleSheetChange}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            {sheetNames.map(sheet => (
              <option key={sheet} value={sheet}>{sheet}</option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-3 py-2 text-sm text-gray-500 border-r border-gray-200 last:border-r-0"
                  >
                    {cell !== undefined && cell !== null ? cell.toString() : ''}
                  </td>
                ))}
                {/* Add empty cells if row has fewer cells than headers */}
                {row.length < headers.length &&
                  Array(headers.length - row.length).fill(0).map((_, i) => (
                    <td key={`empty-${i}`} className="px-3 py-2 text-sm text-gray-500 border-r border-gray-200 last:border-r-0"></td>
                  ))
                }
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length >= maxRows && (
        <div className="p-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
          Showing first {maxRows} rows of data
        </div>
      )}
    </div>
  );
};
export default ExcelPreview;