import { createContext, useState, useEffect, useContext } from 'react';

// 創建上下文
const TripContext = createContext();

// 提供上下文的組件
export const TripProvider = ({ children }) => {
  // 從localStorage獲取行程數據
  const [trips, setTrips] = useState(() => {
    const savedTrips = localStorage.getItem('trips');
    return savedTrips ? JSON.parse(savedTrips) : [];
  });

  // 從localStorage獲取最後選擇的行程ID
  const [selectedTripId, setSelectedTripId] = useState(() => {
    const lastSelectedTrip = localStorage.getItem('lastSelectedTrip');
    return lastSelectedTrip || '';
  });

  // 當選定的行程ID變化時，保存到localStorage
  useEffect(() => {
    localStorage.setItem('lastSelectedTrip', selectedTripId);
  }, [selectedTripId]);

  // 當行程數據變化時，保存到localStorage
  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  // 提供給上下文的值
  const value = {
    trips,
    setTrips,
    selectedTripId,
    setSelectedTripId,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

// 自定義鉤子，方便使用上下文
export const useTrip = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrip必須在TripProvider內使用');
  }
  return context;
};

export default TripContext;