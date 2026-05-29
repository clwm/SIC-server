import React from 'react';

interface NewsItem {
  id: number;
  stock: string;
  headline: string;
  impact: number;
  timestamp: number; // Timestamp in milliseconds
}

interface NewsModalProps {
  newsItem: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function NewsModal({ newsItem, isOpen, onClose }: NewsModalProps) {
  // Use state to control the animation classes
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Delay showing the modal content slightly to allow the background to appear
      const timer = setTimeout(() => setShowModal(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
    }
  }, [isOpen]);


  if (!isOpen || !newsItem) {
    return null; // Don't render if not open or no news item
  }

  // Determine text color based on impact
  const impactColor = newsItem.impact >= 0 ? 'text-green-600' : 'text-red-600';
  const impactText = newsItem.impact >= 0 ? '긍정적' : '부정적';

  // Format timestamp
  const date = new Date(newsItem.timestamp);
  
  return (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 flex flex-col ${showModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3 border-gray-200">최신 속보</h3>
        <div className="mb-6 space-y-2 text-gray-700 pb-4 flex flex-col flex-grow">
          <p className="text-base font-medium">{newsItem.headline}</p>
          <p className={`text-base font-semibold ${impactColor}`}>
            영향: {impactText} ({newsItem.impact.toFixed(1)})
          </p>
          <p className="text-sm font-bold text-gray-500 mt-auto">
            {new Date(new Date(date).getTime() + 9 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex justify-end">
          <button
            className="bg-blue-500 text-white py-2 px-5 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold shadow-md"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewsModal;