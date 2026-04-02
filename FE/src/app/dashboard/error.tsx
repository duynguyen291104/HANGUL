'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fafaf5]">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-[#72564c] mb-4">Lỗi Dashboard</h2>
        <p className="text-[#504441] mb-4 text-sm">{error.message}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-xs text-yellow-800">
            <strong>Debug:</strong> Kiểm tra xem backend server trên port 3001 có đang chạy không
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-[#72564c] text-white rounded-lg hover:bg-[#5c453a] transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
