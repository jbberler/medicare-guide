type ComparisonRow = {
  dimension: string;
  optionA: string;
  optionB: string;
};

type ComparisonSnippetProps = {
  labelA: string;
  labelB: string;
  rows: ComparisonRow[];
  footnote?: string;
};

export function ComparisonSnippet({
  labelA,
  labelB,
  rows,
  footnote,
}: ComparisonSnippetProps) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 mb-3">
        Quick Comparison
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-medium text-violet-500 pb-2 pr-4 w-1/3" />
              <th className="text-left font-semibold text-violet-900 pb-2 pr-4">
                {labelA}
              </th>
              <th className="text-left font-semibold text-violet-900 pb-2">
                {labelB}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-violet-100">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="py-2 pr-4 text-xs font-medium text-violet-600 align-top">
                  {row.dimension}
                </td>
                <td className="py-2 pr-4 text-violet-900 align-top">{row.optionA}</td>
                <td className="py-2 text-violet-900 align-top">{row.optionB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && (
        <p className="mt-2 text-xs text-violet-600 leading-relaxed">{footnote}</p>
      )}
    </div>
  );
}
