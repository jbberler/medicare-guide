"use client";

type ComparisonRow = {
  label: string;
  a: string;
  b: string;
};

type ComparisonSnippetProps = {
  headers: [string, string];
  rows: ComparisonRow[];
};

export function ComparisonSnippet({ headers, rows }: ComparisonSnippetProps) {
  return (
    <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/3" />
            <th className="py-2 px-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wide w-1/3">
              {headers[0]}
            </th>
            <th className="py-2 px-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide w-1/3">
              {headers[1]}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              <td className="py-2 px-3 font-medium text-gray-700">
                {row.label}
              </td>
              <td className="py-2 px-3 text-gray-600">{row.a}</td>
              <td className="py-2 px-3 text-gray-600">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
