import React, { useState, useEffect } from 'react';
import { 
    Sun, Moon, Calendar, Plane, Clock, Mic, Send, Bot, User, Menu, X, 
    CloudSun, Newspaper 
} from 'lucide-react';

// --- SUB-COMPONENTS (Updated to handle loading states) ---

function LoadingSkeleton({ className }) {
    return <div className={`bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse ${className}`}></div>;
}

function WeatherWidget({ data }) {
    if (!data) return <LoadingSkeleton className="h-28 p-4" />;
    return (
        <div className="p-4 bg-blue-500 dark:bg-blue-800/60 rounded-xl text-white">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold">{data.location}</p>
                    <p className="text-4xl font-bold">{data.temperature}°C</p>
                    <p className="text-blue-100">{data.condition}</p>
                </div>
                <div><CloudSun size={48} className="text-yellow-400" /></div>
            </div>
        </div>
    );
}

function NewsWidget({ headlines }) {
    if (!headlines || headlines.length === 0) return <LoadingSkeleton className="h-36 p-4" />;
    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center mb-3 text-lg font-semibold">
                <Newspaper className="mr-3 text-red-500" size={24} /><span>Local Headlines</span>
            </div>
            <ul className="space-y-3 text-sm">
                {headlines.map(item => (
                    <li key={item.id}>
                        <p className="font-medium text-gray-800 dark:text-gray-200 leading-tight">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.source}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TravelTable({ type, data, headers }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'landed': case 'arrived': case 'on-time': return 'text-green-500';
      case 'delayed': return 'text-orange-500';
      case 'scheduled': case 'active': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="mb-3">
      <h4 className="font-bold mb-1">{type}</h4>
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500">{headers.map(h => <th key={h} className="pb-1 font-normal">{h}</th>)}</tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? data.slice(0, 5).map((item, index) => ( // Use slice(0, 5) to ensure max 5 are shown
            <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
              <td className="py-1">{item.flight}</td>
              <td className="py-1">{item.from || item.to}</td>
              <td className="py-1">{item.time}</td>
              <td className={`py-1 font-semibold ${getStatusColor(item.status)}`}>{item.status}</td>
            </tr>
          )) : (
            <tr><td colSpan={headers.length} className="py-2 text-center text-gray-500">No data available.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TravelWidget({ flights }) {
  const [activeTab, setActiveTab] = useState('arrivals');

  if (!flights) return <LoadingSkeleton className="h-48 p-4" />;

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
      <div className="flex items-center mb-3 text-lg font-semibold">
        <Plane className="mr-3 text-blue-500" size={24} /><span>Live Airport Status (JFK)</span>
      </div>
      {/* --- NEW: TABS FOR ARRIVALS AND DEPARTURES --- */}
      <div className="flex border-b border-gray-300 dark:border-gray-600 mb-2">
        <button 
          onClick={() => setActiveTab('arrivals')} 
          className={`flex-1 text-center py-2 text-sm font-medium transition-colors ${activeTab === 'arrivals' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}>
          Arrivals
        </button>
        <button 
          onClick={() => setActiveTab('departures')} 
          className={`flex-1 text-center py-2 text-sm font-medium transition-colors ${activeTab === 'departures' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}>
          Departures
        </button>
      </div>
      <div className="text-xs">
        {activeTab === 'arrivals' && <TravelTable type="Arrivals" data={flights.arrivals} headers={['Flight', 'From', 'Time', 'Status']} />}
        {activeTab === 'departures' && <TravelTable type="Departures" data={flights.departures} headers={['Flight', 'To', 'Time', 'Status']} />}
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  // --- STATE MANAGEMENT ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, text: "Hola! I am your Kyndryl Americas Incubation Pod AI assistant. How can I help you today?", sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [panelData, setPanelData] = useState(null);

  // --- API CONFIGURATION ---
  const chatApiUrl = 'https://chennai-gpt-api-abhkambkefbxgfem.centralindia-01.azurewebsites.net/api/handlechat';
  const panelDataApiUrl = 'https://chennai-gpt-api-abhkambkefbxgfem.centralindia-01.azurewebsites.net/api/getpaneldata';

  // --- MOCK DATA (for widgets that are still static) ---
  const calendarEvents = [ { time: '10:00 AM', title: 'Team Meeting @ Tidel Park' }, { time: '1:00 PM', title: 'Lunch with Anjali @ CAVA' }, ];
  
  // --- EFFECTS ---
  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchPanelData = async () => {
        try {
            const response = await fetch(panelDataApiUrl);
            const data = await response.json();
            setPanelData(data);
        } catch (error) {
            console.error("Failed to fetch panel data:", error);
            setPanelData({ weather: null, news: [], flights: null }); // Set a default error state
        }
    };
    fetchPanelData();
  }, []);

  // --- HANDLERS ---
  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
    setIsLoading(true);
    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const conversationHistoryForApi = newMessages.map(msg => ({ sender: msg.sender, text: msg.text }));
    const currentInput = input;
    setInput('');
    try {
        const response = await fetch(chatApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-123', query: currentInput, conversationHistory: conversationHistoryForApi }),
        });
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const data = await response.json();
        const aiResponse = { id: Date.now() + 1, text: data.response, sender: 'ai' };
        setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
        console.error("Failed to send message:", error);
        const errorResponse = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting. Please try again.", sender: 'ai' };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
  };
  const handleKeyPress = (e) => { if (e.key === 'Enter') { handleSendMessage(); } };

  // --- RENDER ---
  return (
    <div className={`flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
      {/* --- SIDE PANEL --- */}
      <aside className={`fixed top-0 left-0 z-20 h-full w-80 bg-white dark:bg-gray-800/70 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Kyndryl-GPT</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} /></button>
          </div>
          <div className="space-y-6">
            <WeatherWidget data={panelData?.weather} />
            <NewsWidget headlines={panelData?.news} />
            <TravelWidget flights={panelData?.flights} />
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center mb-3 text-lg font-semibold"><Calendar className="mr-3 text-purple-500" size={24} /><span>Today's Events</span></div>
              <ul className="space-y-2 text-sm">
                {calendarEvents.map(event => (
                  <li key={event.title} className="flex items-start">
                    <Clock size={14} className="mr-2 mt-1 text-gray-500" />
                    <div><span className="font-medium">{event.time}</span><p className="text-gray-600 dark:text-gray-400">{event.title}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>
      
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-10 lg:hidden"></div>}

      {/* --- MAIN CHAT INTERFACE (unchanged) --- */}
      <main className="flex-1 flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"><Menu size={24} /></button>
          <div className="font-semibold text-lg invisible lg:visible">AI Chat</div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{isDarkMode ? <Sun size={24} /> : <Moon size={24} />}</button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'ai' && <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white"><Bot size={24} /></div>}
                <div className={`max-w-lg p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 rounded-bl-none'}`}><p>{msg.text}</p></div>
                {msg.sender === 'user' && <div className="w-10 h-10 flex-shrink-0 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center"><User size={24} /></div>}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white"><Bot size={24} /></div>
                <div className="max-w-lg p-4 rounded-2xl bg-white dark:bg-gray-800 rounded-bl-none"><p className="italic text-gray-500">Typing...</p></div>
              </div>
            )}
          </div>
        </div>
        <footer className="p-4">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex items-center">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={isLoading ? "Waiting for response..." : "Ask me anything about Chennai..."} className="flex-1 bg-transparent text-lg px-4 py-2 focus:outline-none" disabled={isLoading} />
            <button className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" disabled={isLoading}><Mic size={24} /></button>
            <button onClick={handleSendMessage} className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors" disabled={!input.trim() || isLoading}><Send size={24} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}