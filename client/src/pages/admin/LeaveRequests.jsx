import { useEffect, useState } from "react";
import api from "../../services/api";

function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/leaves/all");
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const approveLeave = async (id) => {
    setLoading(true);
    try {
      await api.patch(`/leaves/approve/${id}`);
      alert("Leave approved!");
      fetchLeaves();
    } catch {
      alert("Error approving leave");
    } finally {
      setLoading(false);
    }
  };

  const rejectLeave = async (id) => {
    if (!window.confirm("Are you sure you want to reject this leave request?")) return;
    setLoading(true);
    try {
      await api.patch(`/leaves/reject/${id}`);
      fetchLeaves();
    } catch {
      alert("Error rejecting leave");
    } finally {
      setLoading(false);
    }
  };

  const deleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave record? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await api.delete(`/leaves/delete/${id}`);
      fetchLeaves();
    } catch {
      alert("Error deleting leave request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Requests</h2>
        <p className="mt-1 text-slate-500">Review and manage staff leave requests</p>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Staff Member</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Start</th>
                <th className="px-6 py-4 font-semibold text-slate-700">End</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Reason</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No leave requests found.</td></tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{leave.user?.name || "Unknown"}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs">
                      <div className="line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                        {leave.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase ${leave.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        leave.status === "rejected" ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {leave.status === "pending" ? (
                          <>
                            <button
                              onClick={() => approveLeave(leave._id)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLeave(leave._id)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-200 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => deleteLeave(leave._id)}
                            disabled={loading}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Request"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LeaveRequests;
