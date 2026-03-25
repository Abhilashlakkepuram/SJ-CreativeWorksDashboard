import { useState, useEffect } from "react";
import api from "../../services/api";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useSocket } from "../../socket/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { getLocation } from "../../utils/getLocation";
import { useAttendanceValidation } from "../../hooks/useAttendanceValidation";

function Dashboard() {
  const { user } = useAuth();
  const socket = useSocket();

  const [status, setStatus] = useState("Not punched in");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const { status: validationStatus, message } = useAttendanceValidation();

  // 🔔 Socket
  useEffect(() => {
    if (!socket) return;

    socket.on("leave-approved", (data) => {
      alert(data.message);
    });

    return () => socket.off("leave-approved");
  }, [socket]);

  // 📊 Fetch Data
  useEffect(() => {
    fetchStatus();
    fetchAttendance();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/attendance/today-status");

      if (res.data.punchIn && !res.data.punchOut) {
        setStatus("Punched In");
        setTodayAttendance(res.data);
      } else if (res.data.punchOut) {
        setStatus("Completed");
        setTodayAttendance(res.data);
      } else {
        setStatus("Not punched in");
        setTodayAttendance(null);
      }
    } catch {
      setStatus("Not punched in");
      setTodayAttendance(null);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/attendance/my-attendance");
      setAttendance(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // ⏱️ Live Timer
  useEffect(() => {
    let interval;

    if (status === "Punched In" && todayAttendance?.punchIn) {
      const calculateElapsed = () => {
        const diff = new Date() - new Date(todayAttendance.punchIn);
        setElapsedMinutes(Math.floor(diff / (1000 * 60)));
      };

      calculateElapsed();
      interval = setInterval(calculateElapsed, 60000);
    } else {
      setElapsedMinutes(0);
    }

    return () => clearInterval(interval);
  }, [status, todayAttendance?.punchIn]);

  // 🧮 Worked Hours
  const workedHoursDisplay = () => {
    if (status === "Completed" && todayAttendance?.workMinutes !== undefined) {
      const h = Math.floor(todayAttendance.workMinutes / 60);
      const m = todayAttendance.workMinutes % 60;
      return `${h}h ${m}m`;
    }

    if (status === "Punched In") {
      const h = Math.floor(elapsedMinutes / 60);
      const m = elapsedMinutes % 60;
      return `${h}h ${m}m`;
    }

    return "0h 0m";
  };

  // 🟢 Punch In
  const punchIn = async () => {
    try {
      setLoading(true);

      const location = await getLocation();

      const res = await api.post("/attendance/punch-in", { location });

      alert(res.data.message);
      fetchStatus();
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Punch Out
  const punchOut = async () => {
    try {
      setLoading(true);

      const location = await getLocation();

      const res = await api.post("/attendance/punch-out", { location });

      alert(res.data.message);
      fetchStatus();
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">

      {/* 🔹 Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">
            Welcome, {user?.name || "Employee"} 👋
          </h2>
          <p className="text-slate-500 mt-2">
            Manage your attendance and track your shift.
          </p>
        </div>

        <Badge
          status={
            status === "Punched In"
              ? "present"
              : status === "Completed"
                ? "default"
                : "pending"
          }
        >
          {status}
        </Badge>
      </div>

      {/* 🔥 VALIDATION UI (NEW) */}
      {/* <div
        className={`p-4 rounded-xl font-medium ${validationStatus === "success"
          ? "bg-green-50 text-green-700"
          : validationStatus === "error"
            ? "bg-red-50 text-red-700"
            : "bg-yellow-50 text-yellow-700"
          }`}
      >
        {message}
      </div> */}

      {/* 🔹 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Start Shift</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-slate-500">
                {todayAttendance?.punchIn
                  ? `Punched in at: ${new Date(todayAttendance.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : "You haven't punched in yet today."}
              </div>
              <Button
                onClick={punchIn}
                disabled={loading || status !== "Not punched in"}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
              >
                Punch In
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>End Shift</span>
              <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="text-sm text-slate-500">
                {todayAttendance?.punchOut
                  ? `Punched out at: ${new Date(todayAttendance.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : "Remember to punch out when leaving."}
              </div>
              <Button
                onClick={punchOut}
                disabled={loading || status !== "Punched In"}
                className="w-full justify-center bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
              >
                Punch Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300">
          {/* ⏱️ Today's Log */}
          <Card>
            <CardHeader>
              <CardTitle>
                Today's Log{" "}
                {status === "Punched In" && (
                  <span className="text-xs text-green-600 ml-2">
                    ● Live
                  </span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <CardContent className="flex flex-col justify-center ">
            <div className="text-center">
              <span className="block text-4xl font-bold text-slate-800 tracking-tight">
                {workedHoursDisplay()}
              </span>
              <span className="text-sm font-medium text-slate-500 mt-1 block"> Hours Worked</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;