function Chat() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Chat
          </h2>
          <p className="mt-1 text-slate-500">
            Communicate with your team and administration
          </p>
        </div>
      </div>

      <div className="bg-white flex-1 rounded-xl shadow border border-slate-100 flex flex-col items-center justify-center text-center">
        <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-800">Chat System Offline</h3>
        <p className="text-slate-500 max-w-sm mt-2">
          The internal chat module is currently under development. Reach out via email in the meantime.
        </p>
      </div>
    </div>
  );
}

export default Chat;
