import { Routes, Route, NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { useState, useEffect } from 'react'

// 頁面組件
import TripManagement from './pages/TripManagement'
import DailyItinerary from './pages/DailyItinerary'
import HotelInfo from './pages/HotelInfo'
import TravelTips from './pages/TravelTips'
import PackingList from './pages/PackingList'
import TravelNotes from './pages/TravelNotes'
import DataManagement from './pages/DataManagement'
import ExpenseTracker from './pages/ExpenseTracker'
import Notes from './pages/Notes'
import Settings from './pages/Settings'

// 上下文提供者
import { TripProvider } from './contexts/TripContext'

// 樣式組件
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`

const Header = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
`

const MainContent = styled.main`
  flex: 1;
  padding: 1rem;
  background-color: #f5f5f5;
  
  @media (max-width: 768px) {
    padding: 0.8rem 0.5rem;
  }
`

const Navigation = styled.nav`
  background-color: #34495e;
  padding: 0.5rem;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    padding: 0.3rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`

const NavItem = styled(NavLink)`
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  
  &.active {
    background-color: #1abc9c;
  }
  
  &:hover {
    background-color: #3498db;
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.4rem;
    text-align: center;
    display: block;
  }
  
  @media (max-width: 480px) {
    text-align: center;
    display: block;
  }
`

const Footer = styled.footer`
  background-color: #2c3e50;
  color: white;
  text-align: center;
  padding: 1rem;
`

// 定義可用頁面列表
const availablePages = [
  { id: 'tripManagement', name: '行程管理', path: '/', component: TripManagement, default: true },
  { id: 'dailyItinerary', name: '每日行程', path: '/daily', component: DailyItinerary, default: true },
  { id: 'hotelInfo', name: '旅館資訊', path: '/hotel', component: HotelInfo, default: true },
  { id: 'travelTips', name: '旅遊須知', path: '/tips', component: TravelTips, default: true },
  { id: 'packingList', name: '物品清單', path: '/packing', component: PackingList, default: true },
  { id: 'travelNotes', name: '旅遊筆記', path: '/notes', component: TravelNotes, default: true },
  { id: 'expenseTracker', name: '消費追蹤', path: '/expenses', component: ExpenseTracker, default: true },
  { id: 'notes', name: '記事本', path: '/notebook', component: Notes, default: true },
  { id: 'dataManagement', name: '數據管理', path: '/data', component: DataManagement, default: true },
  { id: 'settings', name: '設定', path: '/settings', component: Settings, default: true }
];

function App() {
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

  // 當localStorage中的設定變更時更新狀態
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('pageSettings');
      if (savedSettings) {
        setPageSettings(JSON.parse(savedSettings));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <TripProvider>
      <AppContainer>
        <Header>
          <h1>旅遊應用程序</h1>
        </Header>
        
        <Navigation>
          {availablePages.map(page => (
            // 根據設定決定是否顯示導航項目
            pageSettings[page.id] && (
              <NavItem key={page.id} to={page.path} end={page.path === '/'}>
                {page.name}
              </NavItem>
            )
          ))}
        </Navigation>
        
        <MainContent>
          <Routes>
            {availablePages.map(page => (
              <Route key={page.id} path={page.path} element={<page.component />} />
            ))}
          </Routes>
        </MainContent>
        
        <Footer>
          <p>&copy; {new Date().getFullYear()} 旅遊應用程序</p>
        </Footer>
      </AppContainer>
    </TripProvider>
  )
}

export default App