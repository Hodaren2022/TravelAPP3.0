import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const PageName = styled.span`
  flex: 1;
`;

const ToggleButton = styled.button`
  background-color: ${props => props.$active ? '#1abc9c' : '#95a5a6'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.7 : 1};
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  margin-right: 0.5rem;
`;

const StorageCard = styled(Card)`
  margin-bottom: 1rem;
`;

const StorageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const StorageIcon = styled.div`
  width: 24px;
  height: 24px;
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: ${props => {
    if (props.$usage < 50) return '#2ecc71';
    if (props.$usage < 80) return '#f39c12';
    return '#e74c3c';
  }};
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background-color: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, 
    ${props => {
      if (props.$usage < 50) return '#2ecc71, #27ae60';
      if (props.$usage < 80) return '#f39c12, #e67e22';
      return '#e74c3c, #c0392b';
    }}
  );
  width: ${props => props.$usage}%;
  transition: width 0.3s ease;
`;

const StorageDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const StorageItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const RefreshButton = styled.button`
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: auto;
`;

// 定義可用頁面列表
const availablePages = [
  { id: 'tripManagement', name: '行程管理', path: '/', default: true },
  { id: 'dailyItinerary', name: '每日行程', path: '/daily', default: true },
  { id: 'hotelInfo', name: '旅館資訊', path: '/hotel', default: true },
  { id: 'travelTips', name: '旅遊須知', path: '/tips', default: true },
  { id: 'packingList', name: '物品清單', path: '/packing', default: true },
  { id: 'travelNotes', name: '旅遊筆記', path: '/notes', default: true },
  { id: 'expenseTracker', name: '消費追蹤', path: '/expenses', default: true },
  { id: 'dataManagement', name: '數據管理', path: '/data', default: true },
  { id: 'notes', name: '記事本', path: '/notebook', default: true },
  { id: 'settings', name: '設定', path: '/settings', default: true }
];

const Settings = () => {
  // 從localStorage獲取頁面顯示設定
  const [pageSettings, setPageSettings] = useState(() => {
    const savedSettings = localStorage.getItem('pageSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    } else {
      // 如果沒有保存的設定，使用默認值
      const defaultSettings = {};
      availablePages.forEach(page => {
        defaultSettings[page.id] = page.default;
      });
      return defaultSettings;
    }
  });
  
  // 創建一個臨時設定狀態，用於編輯
  const [tempSettings, setTempSettings] = useState({...pageSettings});
  
  // 儲存容量狀態
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 5 * 1024 * 1024, // 假設5MB限制
    details: {}
  });

  // 當pageSettings變更時更新臨時設定
  useEffect(() => {
    setTempSettings({...pageSettings});
  }, [pageSettings]);
  
  // 計算localStorage使用情況
  const calculateStorageUsage = () => {
    const storageKeys = [
      'trips',
      'hotels', 
      'itineraries',
      'packingLists',
      'travelNotes',
      'travelTips',
      'expenses',
      'notes',
      'pageSettings'
    ];
    
    let totalUsed = 0;
    const details = {};
    
    storageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        const size = new Blob([data]).size;
        details[key] = size;
        totalUsed += size;
      } else {
        details[key] = 0;
      }
    });
    
    // 計算其他未列出的localStorage項目
    let otherSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!storageKeys.includes(key)) {
        const data = localStorage.getItem(key);
        if (data) {
          otherSize += new Blob([data]).size;
        }
      }
    }
    
    if (otherSize > 0) {
      details['其他'] = otherSize;
      totalUsed += otherSize;
    }
    
    setStorageInfo({
      used: totalUsed,
      total: 5 * 1024 * 1024, // 5MB
      details
    });
  };
  
  // 組件載入時計算儲存使用情況
  useEffect(() => {
    calculateStorageUsage();
  }, []);
  
  // 格式化檔案大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 獲取儲存使用百分比
  const getUsagePercentage = () => {
    return Math.round((storageInfo.used / storageInfo.total) * 100);
  };
  
  // 獲取中文鍵名對應
  const getChineseKeyName = (key) => {
    const keyMap = {
      'trips': '行程資料',
      'hotels': '旅館資訊',
      'itineraries': '每日行程',
      'packingLists': '物品清單',
      'travelNotes': '旅遊筆記',
      'travelTips': '旅遊須知',
      'expenses': '消費追蹤',
      'notes': '記事本',
      'pageSettings': '頁面設定',
      '其他': '其他資料'
    };
    return keyMap[key] || key;
  };

  // 處理頁面顯示設定變更
  const handlePageToggle = (pageId) => {
    // 行程管理頁面不能被隱藏，因為它是主頁
    if (pageId === 'tripManagement') return;
    // 設定頁面不能被隱藏，否則無法再次訪問設定
    if (pageId === 'settings') return;
    
    setTempSettings(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
  };
  
  // 保存設定到localStorage
  const saveSettings = () => {
    localStorage.setItem('pageSettings', JSON.stringify(tempSettings));
    setPageSettings(tempSettings);
    
    // 觸發storage事件，讓App.jsx能夠接收到變更
    window.dispatchEvent(new Event('storage'));
    
    // 更新儲存使用情況
    calculateStorageUsage();
    
    // 提示用戶刷新頁面以查看更新後的頁面
    alert('設定已保存！請刷新頁面以查看更新後的導航欄。若無法顯示畫面，請嘗試關閉本頁面再重新點選網址開啟。');
  };

  // 重置所有設定為默認值
  const resetToDefaults = () => {
    const defaultSettings = {};
    availablePages.forEach(page => {
      defaultSettings[page.id] = page.default;
    });
    setTempSettings(defaultSettings);
  };

  return (
    <Container>
      <h2>應用設定</h2>
      
      <StorageCard>
        <StorageHeader>
          <StorageIcon $usage={getUsagePercentage()}>
            {getUsagePercentage() < 50 ? '✓' : getUsagePercentage() < 80 ? '!' : '⚠'}
          </StorageIcon>
          <h3 style={{ margin: 0, flex: 1 }}>儲存容量使用情況</h3>
          <RefreshButton onClick={calculateStorageUsage}>
            🔄 刷新
          </RefreshButton>
        </StorageHeader>
        
        <ProgressBar>
          <ProgressFill $usage={getUsagePercentage()} />
        </ProgressBar>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>已使用: {formatFileSize(storageInfo.used)}</span>
          <span>總容量: {formatFileSize(storageInfo.total)} ({getUsagePercentage()}%)</span>
        </div>
        
        <StorageDetails>
          {Object.entries(storageInfo.details)
            .filter(([key, size]) => size > 0)
            .sort(([,a], [,b]) => b - a)
            .map(([key, size]) => (
              <StorageItem key={key}>
                <span>{getChineseKeyName(key)}</span>
                <span>{formatFileSize(size)}</span>
              </StorageItem>
            ))
          }
        </StorageDetails>
        
        {getUsagePercentage() > 80 && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px',
            color: '#856404'
          }}>
            ⚠️ 儲存空間使用率較高，建議清理不必要的資料或匯出備份。
          </div>
        )}
      </StorageCard>
      
      <Card>
        <h3>頁面顯示設定</h3>
        <p>選擇要在導航欄中顯示的頁面：</p>
        
        {availablePages.map(page => (
          <SettingItem key={page.id}>
            <PageName>
              {page.name}
              {(page.id === 'tripManagement' || page.id === 'settings') && 
                <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '0.5rem' }}>
                  (必須顯示)
                </span>
              }
            </PageName>
            <ToggleButton
              $active={tempSettings[page.id]}
              $disabled={page.id === 'tripManagement' || page.id === 'settings'}
              onClick={() => handlePageToggle(page.id)}
            >
              {tempSettings[page.id] ? '顯示' : '隱藏'}
            </ToggleButton>
          </SettingItem>
        ))}
        
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button onClick={saveSettings}>保存應用</Button>
          <Button onClick={resetToDefaults}>重置為默認設定</Button>
        </div>
      </Card>
    </Container>
  );
};

export default Settings;