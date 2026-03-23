function Holidays() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Company Holidays
          </h2>
          <p className="mt-1 text-slate-500">
            View the upcoming holiday schedule for this year
          </p>
        </div>
      </div>

      <div className="bg-white p-12 rounded-xl shadow border border-slate-100 flex flex-col items-center justify-center text-center">
        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-800">Coming Soon</h3>
        <p className="text-slate-500 max-w-sm mt-2">
          The holiday calendar is currently being updated for this year. Please check back later.
        </p>
      </div>
    </div>
  );
}

export default Holidays;
