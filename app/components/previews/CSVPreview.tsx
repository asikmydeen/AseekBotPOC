import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

interface CSVPreviewProps {
  fileUrl: string;
  fileName?: string;
}

const CSVPreview: React.FC<CSVPreviewProps> = ({ fileUrl, fileName }) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseCSV = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              setParsedData(results.data);
              // Extract headers from the first row
              if (results.meta && results.meta.fields) {
                setHeaders(results.meta.fields);
              }
            } else {
              setError('No data found in the CSV file');
            }
            setIsLoading(false);
          },
          error: (error: { message: any; }) => {
            setError(`Error parsing CSV: ${error.message}`);
            setIsLoading(false);
          }
        });
      } catch (err) {
        setError(`Failed to parse CSV file: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      parseCSV();
    }
  }, [fileUrl]);

  if (isLoading) {
    return <div className="p-4 text-center">Loading CSV data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (parsedData.length === 0) {
    return <div className="p-4 text-center">No data available in the CSV file</div>;
  }

  return (
    <div className="csv-preview overflow-auto p-4">
      <h3 className="text-lg font-semibold mb-2">{fileName || 'CSV Preview'}</h3>
      <div className="border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parsedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map((header, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {row[header] !== undefined ? String(row[header]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Showing {parsedData.length} rows
      </div>
    </div>
  );
};

export default CSVPreview;
