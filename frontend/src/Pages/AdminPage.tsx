// TradingPage 하나 만드는데도 시간이 너무 오래걸려서 완성하지 못합니다..
// 내년에 잘 바꿔 쓰길 바랍니다..

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import NavigationBar from '../components/NavigationBar';


const STOCKS = [
  "삼성",
  "LG",
  "TSLA",
  "마이크로소프트",
  "아마존",
  "현대",
  "메타",
  "SK"
];


// Custom Tooltip formatter for chart (reused from App.tsx)
const customTooltipFormatter = (value: number, name: string, props: any) => {
  const timestamp = props.payload.time;
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format time as HH:MM
  return [`₩${Math.round(value).toLocaleString()}`, timeString]; // Display value (rounded) and time with locale string
};


function AdminPage() {
  const [isTradingEnabled, setIsTradingEnabled] = useState(true);
  const [stockPrices, setStockPrices] = useState<{ [key: string]: number }>({}); // Placeholder for current prices
  const [Fluctuation, setFluctation] = useState<{ [key: string]: number}>({});
  const [manualPriceInput, setManualPriceInput] = useState<{ [key: string]: string }>({});
  const [autoFluctuationInput, setAutoFluctuationInput] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState(dummyUsers);
  // TODO: set to real data
  const [selectedStock, setSelectedStock] = useState('삼성'); // For chart selection

  // State for News Management
  const [newsTargetCompany, setNewsTargetCompany] = useState(Object.keys(dummyStockData)[0] || ''); // Default to first stock
  const [newsTitle, setNewsTitle] = useState('');
  // Removed newsContent state
  const [newsImpactValue, setNewsImpactValue] = useState(''); // Integer value (can be positive or negative)
  const [postedNews, setPostedNews] = useState<any[]>([]); // State to hold posted news

  // Initialize placeholder prices (can be improved by linking to actual simulation)
  useEffect(() => {
      const initialPrices: { [key: string]: number } = {};
      Object.keys(dummyStockData).forEach(stock => {
          const data = dummyStockData[stock];
          if (data.length > 0) {
              initialPrices[stock] = data[data.length - 1].value;
          } else {
              initialPrices[stock] = 0;
          }
          setManualPriceInput(prev => ({ ...prev, [stock]: '' }));
          setAutoFluctuationInput(prev => ({ ...prev, [stock]: '' }));
      });
      setStockPrices(initialPrices);
  }, []);


  const handleToggleTrading = () => {
    setIsTradingEnabled(!isTradingEnabled);
    // In a real app, this would update a global state or backend setting
  };

  const handleSetManualPrice = (stock: string) => {
    const price = parseFloat(manualPriceInput[stock] || '0');
    if (!isNaN(price) && price >= 0) {
      // In a real app, this would update the stock price simulation/data source
      setStockPrices(prev => ({ ...prev, [stock]: price })); // Update placeholder price
      setManualPriceInput(prev => ({ ...prev, [stock]: '' })); // Clear input
    } else {
    }
  };

  const handleSetAutoFluctuation = (stock: string) => {
    const percentage = parseFloat(autoFluctuationInput[stock] || '0');

     if (!isNaN(percentage)) {
      // In a real app, this would update the fluctuation logic for this stock
      setFluctation(prev => ({ ...prev, [stock]: percentage }));
      setAutoFluctuationInput(prev => ({ ...prev, [stock]: '' })); // Clear input
    } else {
      // pass
    }
  };

  const handleToggleBlockUser = (userId: number) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, isBlocked: !user.isBlocked } : user
    ));

    const user = users.find(u => u.id === userId);
    if (user) {
        // In a real app, this would update user status in the backend
    }
  };

  const handlePostNews = () => {
    // Parse impact value as integer
    const impactValue = parseInt(newsImpactValue || '0', 10);
    // Removed check for newsContent
    if (!newsTargetCompany || !newsTitle || isNaN(impactValue)) {
      alert('대상 기업, 뉴스 제목, 영향 값을 모두 입력해주세요.');
      return;
    }

    const newsData = {
      id: Date.now(), // Simple unique ID for dummy data
      targetCompany: newsTargetCompany,
      title: newsTitle,
      impactValue: impactValue,
      timestamp: Date.now(),
    };

    // toDO: database


    // Add the posted news to the state
    setPostedNews(prev => [...prev, newsData]);

    alert('뉴스 게시 완료');

    // clear
    setNewsTargetCompany(Object.keys(dummyStockData)[0] || '');
    setNewsTitle('');
    setNewsImpactValue('');
  };

  const handleDeleteNews = (newsId: number) => {
    setPostedNews(prev => prev.filter(news => news.id !== newsId));
    // TODO: In a real app, this would send a delete request to the backend API
    alert('뉴스 삭제 완료');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col font-sans">
      <NavigationBar />
      <div className="flex-grow flex items-center justify-center p-4 md:p-8 xl:p-12 pt-20">
        <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-screen-2xl mx-auto border border-gray-200">
          {/* Left Column (Admin Controls) */}
          <div className="flex flex-col gap-6 md:gap-8 lg:col-span-1">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">관리자 페이지</h1>

            {/* Trading Toggle */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">주식 거래 활성화</h3>
              <button
                className={`w-full py-3 px-4 rounded-lg font-semibold shadow-md transition duration-200 ${
                  isTradingEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
                onClick={handleToggleTrading}
              >
                {isTradingEnabled ? '거래 비활성화' : '거래 활성화'}
              </button>
            </div>

            {/* Stock Price Control */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">주식 가격 제어</h3>
              <div className="space-y-4">
                {Object.keys(dummyStockData).map(stock => (
                  <div key={stock} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <h4 className="font-semibold text-gray-800 mb-2">{stock} (현재: ₩{Math.round(stockPrices[stock] || 0).toLocaleString()}, {(Fluctuation[stock] ?? 0)}%)</h4>
                    <div className="flex flex-col gap-2">
                      {/* Manual Price */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="수동 가격"
                          className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={manualPriceInput[stock] || ''}
                          onChange={(e) => setManualPriceInput(prev => ({ ...prev, [stock]: e.target.value }))}
                        />
                        <button
                          className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition duration-200"
                          onClick={() => handleSetManualPrice(stock)}
                        >
                          설정
                        </button>
                      </div>
                      {/* Auto Fluctuation */}
                       <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="가격 변동률 (%)"
                          className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={autoFluctuationInput[stock] || ''}
                          onChange={(e) => setAutoFluctuationInput(prev => ({ ...prev, [stock]: e.target.value }))}
                        />
                         <button
                          className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition duration-200"
                          onClick={() => handleSetAutoFluctuation(stock)}
                        >
                          설정
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News Management */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">뉴스 관리</h3>
              <div className="space-y-4">
                 {/* Target Company */}
                 <div>
                  <label htmlFor="news-target-company" className="block text-sm font-medium text-gray-700 mb-1">대상 기업</label>
                  <select
                    id="news-target-company"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={newsTargetCompany}
                    onChange={(e) => setNewsTargetCompany(e.target.value)}
                  >
                    {Object.keys(dummyStockData).map(stockTicker => (
                        <option key={stockTicker} value={stockTicker}>{stockTicker}</option>
                    ))}
                  </select>
                </div>
                {/* News Title */}
                <div>
                  <label htmlFor="news-title" className="block text-sm font-medium text-gray-700 mb-1">뉴스 제목</label>
                  <input
                    type="text"
                    id="news-title"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="뉴스 제목 입력"
                  />
                </div>
                 <div>
                  <label htmlFor="news-impact-value" className="block text-sm font-medium text-gray-700 mb-1">영향 값 (정수)</label>
                  <input
                    type="number"
                    id="news-impact-value"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={newsImpactValue}
                    onChange={(e) => setNewsImpactValue(e.target.value)}
                    placeholder="예: 5 (긍정적), -3 (부정적)"
                  />
                </div>

                <button
                  className="w-full py-3 px-4 rounded-lg font-semibold shadow-md transition duration-200 bg-green-500 hover:bg-green-600 text-white"
                  onClick={handlePostNews}
                >
                  뉴스 게시
                </button>
              </div>
            </div>

             {/* Posted News List */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">게시된 뉴스 목록</h3>
              <div className="h-64 overflow-y-auto text-sm text-gray-800">
                {postedNews.length === 0 ? (
                  <p className="text-center text-gray-500 italic">게시된 뉴스가 없습니다.</p>
                ) : (
                  <ul className="space-y-4">
                    {[...postedNews]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((news) => (
                      <li key={news.id} className="flex justify-between items-start border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex-grow mr-4">
                          <p className="font-bold text-gray-900 mb-1">{news.targetCompany}: {news.title}</p>
                          <p className={`mt-1 text-xs font-semibold ${news.impactValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            영향: {news.impactValue >= 0 ? '긍정적' : '부정적'} ({news.impactValue})
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                             시간: {new Date(news.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-red-600 transition duration-200 flex-shrink-0"
                          onClick={() => handleDeleteNews(news.id)}
                        >
                          삭제
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Charts & User Assets) */}
          <div className="flex flex-col gap-6 md:gap-8 lg:col-span-2">
             {/* Stock Charts */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">주식 차트</h3>
              <div className="mb-4">
                <label htmlFor="stock-select" className="block text-sm font-medium text-gray-700 mb-1">차트 주식 선택:</label>
                <select
                  id="stock-select"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                >
                  {Object.keys(dummyStockData).map(stockTicker => (
                      <option key={stockTicker} value={stockTicker}>{stockTicker}</option>
                  ))}
                </select>
              </div>

              {/* Chart Display */}
              <div className="h-64 md:h-80 rounded-lg bg-gray-100 p-4 border border-gray-200 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dummyStockData[selectedStock] || []}>
                    <XAxis
                      dataKey="time"
                      scale="time"
                      type="number"
                      domain={['auto', 'auto']}
                      hide={true}
                    />
                    <YAxis hide={true} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }} formatter={customTooltipFormatter} labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

             {/* User Management */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">사용자 관리</h3>
              <div className="h-64 overflow-y-auto text-sm text-gray-800">
                <ul className="space-y-3">
                  {users.map(user => (
                    <li key={user.id} className="flex justify-between items-center border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className={`text-xs ${user.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                          상태: {user.isBlocked ? '차단됨' : '활성'}
                        </p>
                      </div>
                      <button
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition duration-200 ${
                          user.isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                        } text-white`}
                        onClick={() => handleToggleBlockUser(user.id)}
                      >
                        {user.isBlocked ? '차단 해제' : '차단'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">사용자 자산 현황</h3>
               <div className="h-64 overflow-y-auto text-sm text-gray-800">
                <ul className="space-y-4">
                  {users.map(user => (
                    <li key={user.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <p className="font-bold text-gray-900 mb-1">{user.name}</p>
                      <p className="text-gray-700">재화: ₩{Math.round(user.balance).toLocaleString()}</p>
                      <p className="text-gray-700 mt-1">보유 주식:</p>
                      {Object.keys(user.shares).length === 0 ? (
                        <p className="text-xs text-gray-500 italic ml-2">보유 주식 없음</p>
                      ) : (
                        <ul className="ml-2 space-y-1 text-xs text-gray-600">
                          {Object.entries(user.shares).map(([stock, quantity]) => (
                            <li key={stock}>{stock}: {quantity}주</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright Footer */}
      <footer className="w-full text-center py-4 text-gray-600 text-sm bg-gray-100 border-t border-gray-200">
        © 2025 Team Greennarae
      </footer>
    </div>
  );
}

export default AdminPage;