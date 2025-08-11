import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTrip } from '../contexts/TripContext'

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`

const TripCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const TripForm = styled.form`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`

const FormSection = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
`

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`

const FormGroup = styled.div`
  flex: 1;
  margin-bottom: 0.5rem;

  input, select, textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: ${props => props.$editing ? '#fff8e6' : 'white'};
    transition: background-color 0.3s ease;
  }
`

const FlightTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`

const Button = styled.button`
  background-color: ${props => props.$primary ? '#3498db' : '#e74c3c'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
`

const Toast = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #4CAF50;
  color: white;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: fadeIn 0.3s, fadeOut 0.3s 0.7s;
  opacity: 0;
  transition: opacity 0.3s;
  
  &.show {
    opacity: 1;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`

// 台灣航空公司列表
const taiwanAirlines = [
  '中華航空',
  '長榮航空',
  '立榮航空',
  '華信航空',
  '台灣虎航',
  '星宇航空',
  '遠東航空',
  '其他'
];

const TripManagement = () => {
  const { trips, setTrips, setSelectedTripId } = useTrip();
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' 為新到舊，'asc' 為舊到新
  
  // 浮動視窗狀態
  const [toast, setToast] = useState({
    show: false,
    message: ''
  });

  const [newTrip, setNewTrip] = useState({
    id: '',
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    flights: []
  });

  const [newFlight, setNewFlight] = useState({
    date: '',
    airline: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: '',
    departureTime: '',
    arrivalTime: '',
    departureTimezone: 'UTC+8 (台灣)',  // 預設台灣時區
    arrivalTimezone: 'UTC+8 (台灣)',     // 預設台灣時區
    customAirline: '',
    duration: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingFlight, setIsEditingFlight] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Create a temporary object with the updated value
    const updatedTrip = { ...newTrip, [name]: value };

    setNewTrip(updatedTrip);

    // Validate dates immediately if either date changed
    if (name === 'startDate' || name === 'endDate') {
      const startDate = new Date(updatedTrip.startDate);
      const endDate = new Date(updatedTrip.endDate);

      // Check if both dates are selected and endDate is before startDate
      if (updatedTrip.startDate && updatedTrip.endDate && endDate < startDate) {
        alert("結束日期不能早於開始日期，請檢查您的日期輸入。\n\n請注意：日期輸入錯誤可能導致每日行程頁面無法正常顯示與編輯。");
      }
    }
  };

  const handleFlightInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFlight = { ...newFlight, [name]: value };

    // 當起飛時間、降落時間或時區變更時，計算飛行時間
    if (name === 'departureTime' || name === 'arrivalTime' || name === 'departureTimezone' || name === 'arrivalTimezone') {
      if (updatedFlight.departureTime && updatedFlight.arrivalTime) {
        updatedFlight.duration = calculateFlightDuration(
          updatedFlight.departureTime,
          updatedFlight.arrivalTime,
          updatedFlight.departureTimezone,
          updatedFlight.arrivalTimezone
        );
      }
    }

    setNewFlight(updatedFlight);
  };

  // 生成時區選項
  const generateTimezoneOptions = () => {
    const timezones = [];
    // 時區與代表性國家對應表
    const timezoneCountries = {
      '-12': '',
      '-11': '(美屬薩摩亞)',
      '-10': '(夏威夷)',
      '-9': '(阿拉斯加)',
      '-8': '(美國西岸、加拿大溫哥華)',
      '-7': '(美國山區、墨西哥)',
      '-6': '(美國中部、墨西哥城)',
      '-5': '(美國東岸、加拿大多倫多)',
      '-4': '(加拿大、南美洲)',
      '-3': '(巴西、阿根廷)',
      '-2': '(大西洋中部)',
      '-1': '(亞速爾群島)',
      '0': '(英國、葡萄牙)',
      '1': '(法國、德國)',
      '2': '(芬蘭、希臘)',
      '3': '(俄羅斯、土耳其)',
      '4': '(阿拉伯聯合大公國)',
      '5': '(巴基斯坦)',
      '5.5': '(印度、斯里蘭卡)',
      '6': '(孟加拉)',
      '7': '(泰國、越南)',
      '8': '(台灣)', // Add Taiwan annotation
      '9': '',
      '10': '',
      '11': '',
      '12': '',
      '13': '',
      '14': ''
    };

    for (let i = -12; i <= 14; i++) {
      // 處理特殊時區（如印度的UTC+5.5）
      if (i === 5) {
        timezones.push(`UTC+5`);
        timezones.push(`UTC+5.5 ${timezoneCountries['5.5']}`);
        continue;
      }

      const sign = i >= 0 ? '+' : '';
      const annotation = timezoneCountries[i.toString()];
      // Construct the string carefully to avoid trailing space
      const timezoneString = `UTC${sign}${i}${annotation ? ' ' + annotation : ''}`;
      timezones.push(timezoneString);
    }
    return timezones;
  };

  const timezoneOptions = generateTimezoneOptions();

  // 計算飛行時間函數，考慮時區差異
  const calculateFlightDuration = (departureTime, arrivalTime, departureTimezone, arrivalTimezone) => {
    // 解析時區偏移量（格式如 UTC+8 或 UTC-5）
    const parseTimezoneOffset = (timezone) => {
      if (!timezone) return 0;
      const match = timezone.match(/UTC([+-]?\d+(\.\d+)?)/); // Updated regex to handle decimals
      if (match) {
        return parseFloat(match[1]); // Use parseFloat for decimal offsets
      }
      return 0;
    };

    // 獲取時區偏移量（小時）
    const departureOffset = parseTimezoneOffset(departureTimezone);
    const arrivalOffset = parseTimezoneOffset(arrivalTimezone);

    // 創建日期對象用於計算時間差
    // 使用一個固定的日期，只關注時間和時區
    const departureDate = new Date(`2000-01-01T${departureTime}:00Z`); // Treat times as UTC initially
    const arrivalDate = new Date(`2000-01-01T${arrivalTime}:00Z`); // Treat times as UTC initially

    // Apply timezone offsets to get the actual time points in a common reference (like UTC)
    departureDate.setHours(departureDate.getHours() - departureOffset);
    arrivalDate.setHours(arrivalDate.getHours() - arrivalOffset);


    // 處理跨日航班（如果計算後的降落時間早於起飛時間，表示跨日）
    if (arrivalDate < departureDate) {
       arrivalDate.setDate(arrivalDate.getDate() + 1);
    }

    // 計算時間差（毫秒）
    let durationMs = arrivalDate - departureDate;

     // 確保飛行時間不為負數，這應該已經被跨日處理涵蓋，但保留以防萬一
     if (durationMs < 0) {
         durationMs += 24 * 60 * 60 * 1000; // Add 24 hours in milliseconds
     }


    // 轉換為小時和分鐘
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    // 格式化為 小時小時分鐘分 的格式
    return `${hours}小時${minutes}分`;
  };


  // 排序航班函數 - 按日期和時間排序，日期時間較近的排在上方
  const sortFlights = (flights) => {
    return [...flights].sort((a, b) => {
      // 先比較日期
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB; // 日期較早的排前面
      }

      // 如果日期相同，比較時間
      const timeA = a.departureTime || '';
      const timeB = b.departureTime || '';

      return timeA.localeCompare(timeB);
    });
  };
  
  // 排序行程函數 - 根據開始日期排序
  const sortTrips = (tripsToSort) => {
    return [...tripsToSort].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      
      // 根據排序順序決定排序方向
      return sortOrder === 'desc' 
        ? dateB - dateA // 新到舊（降序）
        : dateA - dateB; // 舊到新（升序）
    });
  };
  
  // 切換排序順序
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleEditFlight = (flight) => {
    // 將選中的航班信息加載到表單中
    setNewFlight({
      ...flight,
      // 確保時區信息存在，如果不存在則使用預設值 'UTC+8 (台灣)'
      departureTimezone: flight.departureTimezone || 'UTC+8 (台灣)',
      arrivalTimezone: flight.arrivalTimezone || 'UTC+8 (台灣)',
      // 如果航空公司是自定義的（不在預設列表中），則設置為「其他」
      airline: taiwanAirlines.includes(flight.airline) ? flight.airline : '其他',
      // 如果是自定義航空公司，保存到customAirline字段
      customAirline: taiwanAirlines.includes(flight.airline) ? '' : flight.airline
    });

    // 設置編輯狀態和編輯中的航班ID
    setIsEditingFlight(true);
    setEditingFlightId(flight.id);
  };

  const addFlight = () => {
    // 處理自定義航空公司
    let airlineName = newFlight.airline;
    if (airlineName === '其他' && newFlight.customAirline) {
      airlineName = newFlight.customAirline;
    }

    // 確保飛行時間已計算
    let flightDuration = newFlight.duration;
    if (!flightDuration && newFlight.departureTime && newFlight.arrivalTime) {
      flightDuration = calculateFlightDuration(
        newFlight.departureTime,
        newFlight.arrivalTime,
        newFlight.departureTimezone,
        newFlight.arrivalTimezone
      );
    }

    if (isEditingFlight) {
      // 更新現有航班
      setNewTrip(prev => {
        const updatedFlights = prev.flights.map(flight => {
          if (flight.id === editingFlightId) {
            return {
              ...newFlight,
              airline: airlineName,
              duration: flightDuration,
              id: editingFlightId
            };
          }
          return flight;
        });

        // 排序更新後的航班
        return {
          ...prev,
          flights: sortFlights(updatedFlights)
        };
      });

      // 重置編輯狀態
      setIsEditingFlight(false);
      setEditingFlightId(null);
      showToast('已更新航班'); // 顯示更新航班提示
    } else {
      // 添加新航班
      const flight = {
        ...newFlight,
        airline: airlineName,
        duration: flightDuration,
        id: Date.now().toString()
      };

      setNewTrip(prev => {
        // 添加新航班並排序
        const updatedFlights = sortFlights([...(prev.flights || []), flight]);

        return {
          ...prev,
          flights: updatedFlights
        };
      });
      
      showToast('已新增航班'); // 顯示新增航班提示
    }

    // 重置航班表單
    setNewFlight({
      date: '',
      airline: '',
      flightNumber: '',
      departureCity: '',
      arrivalCity: '',
      departureTime: '',
      arrivalTime: '',
      departureTimezone: 'UTC+8 (台灣)',  // 保留預設時區
      arrivalTimezone: 'UTC+8 (台灣)',     // 保留預設時區
      customAirline: '',
      duration: ''
    });
  };

  const removeFlight = (flightId) => {
    setNewTrip(prev => ({
      ...prev,
      flights: prev.flights.filter(flight => flight.id !== flightId)
    }));
    showToast('已刪除航班'); // 顯示刪除航班提示
  };

  // 顯示浮動視窗的函數
  const showToast = (message) => {
    setToast({
      show: true,
      message
    });
    
    // 1秒後自動隱藏
    setTimeout(() => {
      setToast({
        show: false,
        message: ''
      });
    }, 1000);
  };
  
  // 監聽toast狀態變化，處理動畫
  useEffect(() => {
    // 這裡不需要額外處理，因為我們使用CSS動畫和transition
  }, [toast.show]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Re-validate dates on submit just in case
    const startDate = new Date(newTrip.startDate);
    const endDate = new Date(newTrip.endDate);

    if (endDate < startDate) {
      alert("結束日期不能早於開始日期，請檢查您的日期輸入。\n\n請注意：日期輸入錯誤可能導致每日行程頁面無法正常顯示與編輯。");
      return; // Prevent form submission
    }

    if (isEditing) {
      setTrips(trips.map(trip => trip.id === newTrip.id ? newTrip : trip));
      setIsEditing(false);
      setSelectedTripId(newTrip.id); // 設置編輯後的行程為當前選定行程
      showToast('已更新'); // 顯示更新提示
    } else {
      const id = Date.now().toString();
      setTrips([...trips, { ...newTrip, id }]);
      setSelectedTripId(id); // 設置新創建的行程為當前選定行程
      showToast('已新增'); // 顯示新增提示
    }

    setNewTrip({
      id: '',
      name: '',
      destination: '',
      startDate: '',
      endDate: '',
      description: '',
      flights: []
    });

    setNewFlight({
      date: '',
      airline: '',
      flightNumber: '',
      departureCity: '',
      arrivalCity: '',
      departureTime: '',
      arrivalTime: '',
      departureTimezone: 'UTC+8 (台灣)',  // 預設台灣時區
      arrivalTimezone: 'UTC+8 (台灣)',     // 預設台灣時區
      customAirline: '',
      duration: ''
    });
  };

  const handleEdit = (trip) => {
    // 檢查並計算所有航班的飛行時間
    if (trip.flights && trip.flights.length > 0) {
      const updatedFlights = trip.flights.map(flight => {
        // 確保每個航班都有時區信息
        const flightWithTimezones = {
          ...flight,
          // 確保時區信息存在，如果不存在則使用預設值 'UTC+8 (台灣)'
          departureTimezone: flight.departureTimezone || 'UTC+8 (台灣)',
          arrivalTimezone: flight.arrivalTimezone || 'UTC+8 (台灣)'
        };

        // 如果航班已有飛行時間或缺少起飛/降落時間，則保持不變
        if (flight.duration || !flight.departureTime || !flight.arrivalTime) {
          return flightWithTimezones;
        }

        // 計算並添加飛行時間，考慮時區差異
        const duration = calculateFlightDuration(
          flight.departureTime,
          flight.arrivalTime,
          flightWithTimezones.departureTimezone,
          flightWithTimezones.arrivalTimezone
        );

        return {
          ...flightWithTimezones,
          duration
        };
      });

      setNewTrip({
        ...trip,
        flights: updatedFlights
      });
    } else {
      setNewTrip(trip);
    }

    setIsEditing(true);
    showToast('已編輯'); // 顯示編輯提示
  };

  const handleDelete = (id) => {
    // 顯示確認對話框，詢問用戶是否確定要刪除該行程
    const isConfirmed = window.confirm("確定要刪除此行程嗎？此操作無法復原。");
    
    // 只有當用戶點擊確認後，才執行刪除操作
    if (isConfirmed) {
      setTrips(trips.filter(trip => trip.id !== id));
      showToast('已刪除'); // 顯示刪除提示
    }
    // 如果用戶點擊取消，則不執行任何操作
  };

  return (
    <Container>
      {/* 浮動視窗 */}
      {toast.show && (
        <Toast className={toast.show ? 'show' : ''}>
          {toast.message}
        </Toast>
      )}
      <h2>行程管理</h2>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>我的行程</h3>
          <Button 
            $primary 
            onClick={toggleSortOrder} 
            style={{ padding: '0.3rem 0.8rem' }}
          >
            {sortOrder === 'desc' ? '目前：新到舊 ↓' : '目前：舊到新 ↑'}
          </Button>
        </div>
        {trips.length === 0 ? (
          <p>尚未建立任何行程</p>
        ) : (
          sortTrips(trips).map(trip => (
            <TripCard key={trip.id}>
              <h4>{trip.name}</h4>
              <p><strong>目的地:</strong> {trip.destination}</p>
              <p><strong>日期:</strong> {trip.startDate} 至 {trip.endDate}</p>
              <p>{trip.description}</p>

              {trip.flights && trip.flights.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h5>航班資訊</h5>
                  <FlightTable>
                    <thead>
                      <tr>
                        <th>日期</th>
                        <th>航空公司</th>
                        <th>航班編號</th>
                        <th>起飛/降落城市</th>
                        <th>起飛時間(24小時制)/時區</th>
                        <th>降落時間(24小時制)/時區</th>
                        <th>飛行時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortFlights(trip.flights).map(flight => (
                        <tr key={flight.id}>
                          <td>{flight.date}</td>
                          <td>{flight.airline}</td>
                          <td>{flight.flightNumber}</td>
                          <td>{flight.departureCity}/{flight.arrivalCity}</td>
                          <td>{flight.departureTime} ({flight.departureTimezone || 'UTC+8 (台灣)'})</td>
                          <td>{flight.arrivalTime} ({flight.arrivalTimezone || 'UTC+8 (台灣)'})</td>
                          <td>{flight.duration || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </FlightTable>
                </div>
              )}

              <ButtonGroup>
                <Button $primary onClick={() => handleEdit(trip)}>編輯</Button>
                <Button onClick={() => handleDelete(trip.id)}>刪除</Button>
              </ButtonGroup>
            </TripCard>
          ))
        )}
      </div>
      
      <TripForm onSubmit={handleSubmit}>
        <h3>
          {isEditing ? '編輯行程（黃色背景表示正在編輯）' : '新增行程'}
        </h3>

        <FormGroup $editing={isEditing}>
          <label htmlFor="name">行程名稱</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newTrip.name}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup $editing={isEditing}>
          <label htmlFor="destination">目的地</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={newTrip.destination}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup $editing={isEditing}>
          <label htmlFor="startDate">開始日期</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={newTrip.startDate}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup $editing={isEditing}>
          <label htmlFor="endDate">結束日期</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={newTrip.endDate}
            onChange={handleInputChange}
            required
          />
        </FormGroup>

        <FormGroup $editing={isEditing}>
          <label htmlFor="description">行程描述</label>
          <textarea
            id="description"
            name="description"
            value={newTrip.description}
            onChange={handleInputChange}
            rows="4"
          ></textarea>
        </FormGroup>

        <FormSection>
          <h4>
            {isEditingFlight ?
              '編輯航班資訊（黃色背景表示正在編輯）' :
              '航班資訊（選填）'
            }
          </h4>

          <FormRow>
            <FormGroup $editing={isEditingFlight}>
              <label htmlFor="flightDate">日期</label>
              <input
                type="date"
                id="flightDate"
                name="date"
                value={newFlight.date}
                onChange={handleFlightInputChange}
              />
            </FormGroup>

            <FormGroup $editing={isEditingFlight}>
              <label htmlFor="airline">航空公司</label>
              <select
                id="airline"
                name="airline"
                value={newFlight.airline}
                onChange={handleFlightInputChange}
              >
                <option value="">-- 請選擇航空公司 --</option>
                {taiwanAirlines.map(airline => (
                  <option key={airline} value={airline}>{airline}</option>
                ))}
              </select>
            </FormGroup>

            {newFlight.airline === '其他' && (
              <FormGroup $editing={isEditingFlight}>
                <label htmlFor="customAirline">自定義航空公司</label>
                <input
                  type="text"
                  id="customAirline"
                  name="customAirline"
                  value={newFlight.customAirline}
                  onChange={handleFlightInputChange}
                />
              </FormGroup>
            )}
          </FormRow>

          <FormRow>
            <FormGroup $editing={isEditingFlight}>
              <label htmlFor="flightNumber">航班編號</label>
              <input
                type="text"
                id="flightNumber"
                name="flightNumber"
                value={newFlight.flightNumber}
                onChange={handleFlightInputChange}
                placeholder="例如: BR182"
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup $editing={isEditingFlight}>
              <label htmlFor="departureTime">起飛時間</label>
              <input
                type="time"
                id="departureTime"
                name="departureTime"
                value={newFlight.departureTime}
                onChange={handleFlightInputChange}
              />
            </FormGroup>

            <FormGroup $editing={isEditingFlight}>
              <label htmlFor="departureTimezone">起飛時區</label>
              <select
                id="departureTimezone"
                name="departureTimezone"
                value={newFlight.departureTimezone}
                onChange={handleFlightInputChange}
              >
                {timezoneOptions.map(timezone => (
                  <option key={timezone} value={timezone}>{timezone}</option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup $editing={isEditingFlight}>
              <label htmlFor="arrivalTime">降落時間</label>
              <input
                type="time"
                id="arrivalTime"
                name="arrivalTime"
                value={newFlight.arrivalTime}
                onChange={handleFlightInputChange}
              />
            </FormGroup>

            <FormGroup $editing={isEditingFlight}>
              <label htmlFor="arrivalTimezone">降落時區</label>
              <select
                id="arrivalTimezone"
                name="arrivalTimezone"
                value={newFlight.arrivalTimezone}
                onChange={handleFlightInputChange}
              >
                {timezoneOptions.map(timezone => (
                  <option key={timezone} value={timezone}>{timezone}</option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <ButtonGroup style={{ marginTop: '0.5rem' }}>
            <Button
              type="button"
              $primary
              onClick={addFlight}
            >
              {isEditingFlight ? '更新航班' : '新增航班'}
            </Button>

            {isEditingFlight && (
              <Button
                type="button"
                onClick={() => {
                  // 取消編輯，重置表單
                  setIsEditingFlight(false);
                  setEditingFlightId(null);
                  setNewFlight({
                    date: '',
                    airline: '',
                    flightNumber: '',
                    departureCity: '',
                    arrivalCity: '',
                    departureTime: '',
                    arrivalTime: '',
                    departureTimezone: 'UTC+8 (台灣)',
                    arrivalTimezone: 'UTC+8 (台灣)',
                    customAirline: '',
                    duration: ''
                  });
                }}
              >
                取消編輯
              </Button>
            )}
          </ButtonGroup>

          {newTrip.flights && newTrip.flights.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h5>已新增航班</h5>
              <FlightTable>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>航空公司</th>
                    <th>航班編號</th>
                    <th>起飛/降落城市</th>
                    <th>起飛時間(24小時制)/時區</th>
                    <th>降落時間(24小時制)/時區</th>
                    <th>飛行時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortFlights(newTrip.flights).map(flight => (
                    <tr
                      key={flight.id}
                      style={{
                        backgroundColor: flight.id === editingFlightId ? '#fff8e6' : 'transparent',
                      }}
                    >
                      <td>{flight.date}</td>
                      <td>{flight.airline}</td>
                      <td>{flight.flightNumber}</td>
                      <td>{flight.departureCity}/{flight.arrivalCity}</td>
                      <td>{flight.departureTime} ({flight.departureTimezone || 'UTC+8 (台灣)'})</td>
                      <td>{flight.arrivalTime} ({flight.arrivalTimezone || 'UTC+8 (台灣)'})</td>
                      <td>{flight.duration || '-'}</td>
                      <td>
                        <ButtonGroup>
                          <Button $primary type="button" onClick={(e) => {
                            e.preventDefault(); // 防止事件冒泡觸發表單提交
                            e.stopPropagation(); // 阻止事件傳播
                            handleEditFlight(flight);
                          }}>編輯</Button>
                          <Button type="button" onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFlight(flight.id);
                          }}>刪除</Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </FlightTable>
            </div>
          )}
        </FormSection>

        <ButtonGroup>
          <Button $primary type="submit">
            {isEditing ? '更新行程' : '新增行程'}
          </Button>
          {isEditing && (
            <Button type="button" onClick={() => {
              setIsEditing(false);
              setNewTrip({
                id: '',
                name: '',
                destination: '',
                startDate: '',
                endDate: '',
                description: '',
                flights: [] // Reset flights as well when cancelling edit
              });
              // 使用重置航班表單函數
              setNewFlight({
                date: '',
                airline: '',
                flightNumber: '',
                departureCity: '',
                arrivalCity: '',
                departureTime: '',
                arrivalTime: '',
                departureTimezone: 'UTC+8 (台灣)',
                arrivalTimezone: 'UTC+8 (台灣)',
                customAirline: '',
                duration: ''
              });
            }}>
              取消
            </Button>
          )}
        </ButtonGroup>
      </TripForm>
    </Container>
  );
};

export default TripManagement;