import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import NavigationBar from '../components/NavigationBar';
import NewsModal from '../components/NewsModal';
import axios from 'axios';
import throttle from 'lodash/throttle';

const STOCKS = ["삼성", "LG", "TSLA", "마이크로소프트", "아마존", "현대", "메타", "SK"];

interface NewsItem {
  id: number;
  stock: string;
  headline: string;
  impact: number;
  timestamp: number;
}

interface UserInfo {
  id: number;
  username: string;
  balance: number;
}

interface StockInfo {
  symbol: string;
  price: number;
}

interface PriceHistoryItem {
  symbol: string;
  price: number;
  timestamp: number;
}

const customTooltipFormatter = (value: number, name: string, props: any) => {
  const timestamp = props.payload.timestamp;

  // ⏱ 9시간(밀리초 기준) 더하기
  const kstDate = new Date(new Date(timestamp).getTime() + 9 * 60 * 60 * 1000);
  const timeString = kstDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return [`₩${Math.round(value).toLocaleString()}`, timeString];
};

function App() {
  // fetch from server
  const token = sessionStorage.getItem("token");

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo[]>([]);
  const [accountBalance, setAccountBalance] = useState(0);
  const [sharesHeld, setSharesHeld] = useState<{ [key: string]: number }>({});
  const [TotalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [allStocksData, setAllStocksData] = useState<{ [key: string]: PriceHistoryItem[] }>({});
  const [lastKnownPrices, setLastKnownPrices] = useState<{ [key: string]: number }>({});
  const [averagePurchasePrices, setAveragePurchasePrices] = useState<{ [key: string]: number }>({});

  // for the button state
  const [isProcessing, setIsProcessing] = useState(false);

  // placeholder
  const [selectedStock, setSelectedStock] = useState('삼성');
  const [orderQuantity, setOrderQuantity] = useState('');

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNewsItem, setModalNewsItem] = useState<NewsItem | null>(null);

  const headers = { Authorization: `Bearer ${token}` };
  const SELL_FEE_RATE = 0.05; // 매도 수수료 5%


  const fetchAllAppData = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/reload`, { headers });

      // 사용자 정보
      setUserInfo(data.user);
      setAccountBalance(data.user.balance);

      // 포트폴리오
      const heldObj: { [key: string]: number } = {};
      data.portfolio.forEach((item: { symbol: string; quantity: number }) => {
        heldObj[item.symbol] = item.quantity;
      });
      setSharesHeld(heldObj);

      // 주식 정보
      setStockInfo(data.stocks);

      // 뉴스
      setNews(data.news);

      // 가격 히스토리
      const transformedData: { [key: string]: PriceHistoryItem[] } = {};
      Object.entries(data.price_history).forEach(([symbol, history]) => {
        transformedData[symbol] = (history as any[]).map((item) => ({
          symbol: item.symbol,
          price: item.price,
          timestamp: new Date(item.timestamp).getTime(),
        }));
      });
      setAllStocksData(transformedData);
    } catch (error) {
      console.error("전체 데이터 불러오기 실패:", error);
    }
  };

  // const fetchTradeHistory = async (): Promise<Trade[]> => {
  //   try {
  //     const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/trade/history`, { headers });
  //     return data;
  //   } catch (error) {
  //     console.error("거래 기록 불러오기 실패:", error);
  //     return [];
  //   }
  // };


  useEffect(() => {
    fetchAllAppData();

        // 평균 가격, 수익률 등 계산 로직 ---> 너무 복잡해서 삭제(내년에 재활용하세요)
    // const calculateAverages = async () => {
    //   const history = await fetchTradeHistory();
    //   const buyMap: { [key: string]: { totalCost: number; totalShares: number } } = {};

    //   history.forEach((trade) => {
    //     if (trade.trade_type === "buy") {
    //       if (!buyMap[trade.symbol]) {
    //         buyMap[trade.symbol] = { totalCost: 0, totalShares: 0 };
    //       }
    //       buyMap[trade.symbol].totalCost += trade.quantity * trade.price_at_trade;
    //       buyMap[trade.symbol].totalShares += trade.quantity;
    //     }
    //   });

    //   const avgPrices: { [key: string]: number } = {};
    //   Object.entries(buyMap).forEach(([symbol, { totalCost, totalShares }]) => {
    //     if (totalShares > 0) {
    //       avgPrices[symbol] = totalCost / totalShares;
    //     }
    //   });

    //   setAveragePurchasePrices(avgPrices);
    // };

    //calculateAverages();
  }, []);

  useEffect(() => {
    const prices: { [key: string]: number } = {};
    stockInfo.forEach(stock => {
      prices[stock.symbol] = stock.price;
    });
    setLastKnownPrices(prices);
  }, [stockInfo]);

  useEffect(() => {
    const total = Object.keys(sharesHeld).reduce((sum, stockTicker) => {
      const quantity = sharesHeld[stockTicker] || 0;
      const price = lastKnownPrices[stockTicker] || 0;
      return sum + quantity * price;
    }, 0);
    setTotalPortfolioValue(total);
  }, [sharesHeld, lastKnownPrices]);


  // Effect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'b') handleBuyClick();
      else if (event.key === 's') handleSellClick();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orderQuantity, selectedStock, accountBalance, sharesHeld, lastKnownPrices, averagePurchasePrices]);

  useEffect(() => {
    setOrderQuantity('');
  }, [selectedStock]);

  
  // 공통 로직 함수 정의
  const getValidQuantity = (input: string, maxQuantity: number) => {
    let quantity = parseFloat(input);
    if (isNaN(quantity) || quantity <= 0) return 0;
    return Math.min(quantity, maxQuantity);
  };

  const sendTradeToServer = async (type: "buy" | "sell", quantity: number) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/trade/`,
        { symbol: selectedStock, trade_type: type, quantity },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error("거래 실패", error);
      return null;
    }
  };

  type TradeType = "buy" | "sell";

  const throttledTrade = useMemo(() =>
    throttle(async (type: TradeType) => {
      const price = lastKnownPrices[selectedStock] || 0;
      const held = sharesHeld[selectedStock] || 0;
      const maxQuantity = type === "buy" ? Math.floor(accountBalance / price) : held;
      const quantity = getValidQuantity(orderQuantity, maxQuantity);
      if (quantity === 0) return;

      setIsProcessing(true); // ✅ 처리 시작 표시

      try {
        const result = await sendTradeToServer(type, quantity);
        if (!result) return;

        const amount = quantity * price;

        if (type === "buy") {
          setAccountBalance(prev => prev - amount);
          setSharesHeld(prev => ({ ...prev, [selectedStock]: held + quantity }));
        } else {
          const fee = amount * SELL_FEE_RATE;
          const netAmount = amount - fee;

          setAccountBalance(prev => prev + netAmount);
          setSharesHeld(prev => ({ ...prev, [selectedStock]: held - quantity }));
        }

        setOrderQuantity('');
      } finally {
        setIsProcessing(false); // ✅ 처리 종료
      }
    }, 1000, { trailing: false }),
    [selectedStock, accountBalance, sharesHeld, orderQuantity, lastKnownPrices]
  );

  const handleBuyClick = () => throttledTrade("buy");
  const handleSellClick = () => throttledTrade("sell");

  
  // Handler to open the modal with a specific news item
  const handleOpenNewsModal = (item: NewsItem) => {
    setModalNewsItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalNewsItem(null); // Clear the news item when closing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col font-sans">
      <NavigationBar />
      <div className="flex-grow flex items-center justify-center p-4 md:p-8 xl:p-12 pt-20">
        <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 w-full max-w-screen-2xl mx-auto border border-gray-200">
          {/* Left Column */}
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="border-b pb-4 border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-1">보유 재화</h2>
              <p className="text-4xl font-bold text-green-600">₩{Math.round(accountBalance).toLocaleString()}</p>
            </div>

            <div className="border-b pb-4 border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-1">보유 자산</h2>
              <p className="text-4xl font-bold text-blue-600">₩{Math.round(TotalPortfolioValue).toLocaleString()}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">보유 주식</h2>
              {Object.keys(sharesHeld).length === 0 || Object.values(sharesHeld).every(qty => qty === 0) ? (
                <p className="text-gray-500 italic">아직 주식을 구매하지 않았습니다.</p>
              ) : (
                <ul className="space-y-4 text-gray-800">
                  {Object.entries(sharesHeld).map(([stock, quantity]) => {
                    if (quantity > 0) {
                      const currentPrice = lastKnownPrices[stock] || 0;
                      const currentValue = currentPrice * quantity;
                      // 평균 가격, 수익률 등 코드 로직 ---> 너무 복잡해서 삭제(내년에 재활용하세요)
                      // const averagePrice = averagePurchasePrices[stock] || 0;
                      // const totalCost = averagePrice * quantity;
                      // const profitLoss = currentValue - totalCost;
                      // const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
                      // const profitLossColor = profitLoss > 0 ? 'text-green-600' : profitLoss < 0 ? 'text-red-600' : 'text-gray-800';
                      // const profitLossSign = profitLoss > 0 ? '+' : profitLoss < 0 ? '-' : '';
                      // const formattedProfitLoss = `${profitLossSign}₩${Math.abs(Math.round(profitLoss)).toLocaleString()}`;

                      return (
                        <li key={stock} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center text-lg font-medium mb-1">
                            <span>{stock} <span className="font-bold">{quantity}주</span></span>
                            <span className="font-bold text-gray-900">₩{Math.round(currentValue).toLocaleString()}</span>
                          </div>
                          {/* <div className={`text-sm ${profitLossColor}`}>
                            <span className="font-semibold">손익률:</span> {formattedProfitLoss} ({profitLossSign}{profitLossPercentage.toFixed(2)}%)
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            평균 단가: ₩{Math.round(averagePrice).toLocaleString()}
                          </div> */}
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              )}
            </div>

            {/* Order Section */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">주문하기 ({selectedStock})</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">현재 가격:</p>
                <p className="text-2xl font-bold text-gray-900">₩{Math.round(lastKnownPrices[selectedStock] || 0).toLocaleString()}</p>
              </div>
              <input
                type="number"
                placeholder="수량"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
              />
              <div className="flex space-x-4">
                <button
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold shadow-md disabled:opacity-50"
                  onClick={() => throttledTrade("buy")}
                  disabled={isProcessing}
                >
                  매수
                </button>
                <button
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold shadow-md disabled:opacity-50"
                  onClick={() => throttledTrade("sell")}
                  disabled={isProcessing}
                >
                  매도
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6 md:gap-8">
            {/* Stock Chart Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">{selectedStock} 차트</h2>
              <div className="h-64 md:h-80 xl:h-96 rounded-lg bg-gray-100 p-4 border border-gray-200 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={allStocksData[selectedStock] || []}>
                    <XAxis
                      dataKey="timestamp" // Use 'timestamp' as the data key for X-axis
                      scale="linear" // Use linear scale for numerical timestamps
                      type="number"
                      domain={['auto', 'auto']}
                      hide={true} // Hide X-axis labels if not needed
                    />
                    <YAxis hide={true} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                      }}
                      formatter={customTooltipFormatter}
                      labelFormatter={(label) => {
                        const kst = new Date(new Date(label).getTime() + 9 * 60 * 60 * 1000);
                        return kst.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} /> {/* Use 'price' as the data key for the line */}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Select Stock Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">주식 선택</h3>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg bg-white"
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
              >
                {STOCKS.map(stockTicker => (
                  <option key={stockTicker} value={stockTicker}>{stockTicker}</option>
                ))}
              </select>
            </div>

            {/* News Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">최신 뉴스</h3>
              <div className="h-40 overflow-y-auto bg-gray-100 p-4 rounded-lg border border-gray-200 shadow-inner text-sm text-gray-800">
                {news.length === 0 ? (
                  <p className="italic text-gray-500">뉴스가 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {news.map(item => (
                      <li
                        key={item.id}
                        className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0 cursor-pointer hover:bg-gray-200 transition duration-200 p-2 -m-2 rounded"
                        onClick={() => handleOpenNewsModal(item)}
                      >
                        <p className="font-medium">{item.headline}</p>
                        <p className="text-xs text-gray-500">
                          {
                            new Date(new Date(item.timestamp).getTime() + 9 * 60 * 60 * 1000)
                              .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <NewsModal
        newsItem={modalNewsItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Copyright Footer */}
      <footer className="w-full text-center py-4 text-gray-600 text-sm bg-gray-100 border-t border-gray-200">
        © 2025 Team Greennarae
      </footer>
    </div>
  );
}

export default App;