import React, { useState, useEffect } from 'react';
import { 
    Sun, Moon, Calendar, Plane, Clock, Mic, Send, Bot, User, Menu, X, 
    CloudSun, Newspaper, Database, BrainCircuit
} from 'lucide-react';

// --- Speech Recognition Setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}

// --- NEW: A dedicated component to render tables ---
const TableView = ({ tableData }) => {
    if (!tableData || !tableData.headers || !tableData.rows || tableData.rows.length === 0) {
        return <p className="p-4 text-sm italic text-gray-500">The AI returned an empty or invalid table.</p>;
    }

    return (
        <div className="overflow-x-auto my-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        {tableData.headers.map((header, index) => (
                            <th key={index} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tableData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Sub-components for Side Panel (can be replaced with live data later) ---
const LoadingSkeleton = ({ className }) => <div className={`bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse ${className}`}></div>;
const WeatherWidget = ({ data }) => { if (!data) return <LoadingSkeleton className="h-28 p-4" />; return <div className="p-4 bg-blue-500 dark:bg-blue-800/60 rounded-xl text-white"> <div className="flex justify-between items-start"> <div><p className="font-semibold">{data.location}</p><p className="text-4xl font-bold">{data.temperature}°C</p><p className="text-blue-100">{data.condition}</p></div><div><CloudSun size={48} className="text-yellow-400" /></div></div></div>; };
const NewsWidget = ({ headlines }) => { if (!headlines || headlines.length === 0) return <LoadingSkeleton className="h-36 p-4" />; return <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl"><div className="flex items-center mb-3 text-lg font-semibold"><Newspaper className="mr-3 text-red-500" size={24} /><span>Local Headlines</span></div><ul className="space-y-3 text-sm">{headlines.map(item => (<li key={item.id}><p className="font-medium text-gray-800 dark:text-gray-200 leading-tight">{item.title}</p><p className="text-xs text-gray-500 dark:text-gray-400">{item.source}</p></li>))}</ul></div>; };
const TravelWidget = ({ flights }) => { if (!flights) return <LoadingSkeleton className="h-48 p-4" />; return <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl"><div className="flex items-center mb-3 text-lg font-semibold"><Plane className="mr-3 text-blue-500" size={24} /><span>Live Airport Arrivals (MAA)</span></div>{/* Table rendering logic would go here */}</div>;};

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [messages, setMessages] = useState([
      { id: 1, sender: 'ai', content: { type: 'text', data: "Hola! I am your Kyndryl AI assistant. How can I help you today?" } }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [panelData, setPanelData] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState(null);

    // --- API Configuration ---
    const chatApiUrl = 'https://chennai-gpt-api-abhkambkefbxgfem.centralindia-01.azurewebsites.net/api/handlechat';
    const panelDataApiUrl = 'https://chennai-gpt-api-abhkambkefbxgfem.centralindia-01.azurewebsites.net/api/getpaneldata';
    // --- MOCK DATA (for widgets that are still static) ---
    const calendarEvents = [ { time: '10:00 AM', title: 'Team Meeting @ Tidel Park' }, { time: '1:00 PM', title: 'Lunch with Anjali @ Murugan Idli' }, ];

    // --- Effects ---
    useEffect(() => { if (isDarkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [isDarkMode]);
    useEffect(() => { const fetchPanelData = async () => { try { const response = await fetch(panelDataApiUrl); setPanelData(await response.json()); } catch (error) { console.error("Failed to fetch panel data:", error); } }; fetchPanelData(); }, []);
    useEffect(() => { if (!recognition) return; recognition.onresult = (event) => { setInput(event.results[0][0].transcript); handleSendMessage(event.results[0][0].transcript); }; recognition.onerror = (event) => { setMicError("Sorry, I couldn't understand that."); setIsListening(false); }; recognition.onend = () => setIsListening(false); return () => { recognition.onresult = null; recognition.onerror = null; recognition.onend = null; }; }, []);

    // --- Handlers ---
    const handleSendMessage = async (textToSend = input) => {
        const messageText = textToSend.trim();
        if (messageText === '' || isLoading) return;

        setIsLoading(true);
        const userMessage = { id: Date.now(), sender: 'user', content: { type: 'text', data: messageText } };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const response = await fetch(chatApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user-123', query: messageText }),
            });

            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }

            const data = await response.json();
            const aiResponse = { 
                id: Date.now() + 1, 
                content: data.response, // The content is now the {type, data} object
                sender: 'ai', 
                source: data.source 
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorResponse = { id: Date.now() + 1, sender: 'ai', content: { type: 'text', data: "Sorry, I'm having trouble connecting. Please try again." } };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMicClick = () => { if (!recognition) { setMicError("Sorry, your browser does not support voice input."); return; } if (isListening) { recognition.stop(); } else { navigator.mediaDevices.getUserMedia({ audio: true }).then(() => { setMicError(null); setIsListening(true); recognition.start(); }).catch(err => { setMicError("Microphone permission is required."); }); } };
    const handleKeyPress = (e) => { if (e.key === 'Enter') { handleSendMessage(); } };

    // --- RENDER ---
    return (
        <div className={`flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`}>
            {/* --- SIDE PANEL --- */}
            <aside className={`fixed top-0 left-0 z-20 h-full w-80 bg-white dark:bg-gray-800/70 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
                <div className="p-4 h-full overflow-y-auto"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Kyndryl-GPT</h2><button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} /></button></div><div className="space-y-6"><WeatherWidget data={panelData?.weather} /><NewsWidget headlines={panelData?.news} /><TravelWidget flights={panelData?.flights} /><div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl"><div className="flex items-center mb-3 text-lg font-semibold"><Calendar className="mr-3 text-purple-500" size={24} /><span>Today's Events</span></div><ul className="space-y-2 text-sm">{calendarEvents.map(event => (<li key={event.title} className="flex items-start"><Clock size={14} className="mr-2 mt-1 text-gray-500" /><div><span className="font-medium">{event.time}</span><p className="text-gray-600 dark:text-gray-400">{event.title}</p></div></li>))}</ul></div></div></div>
            </aside>
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-10 lg:hidden"></div>}
            
            {/* --- MAIN CHAT INTERFACE --- */}
            <main className="flex-1 flex flex-col h-screen">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"><button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"><Menu size={24} /></button><div className="font-semibold text-lg invisible lg:visible">AI Chat</div><button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">{isDarkMode ? <Sun size={24} /> : <Moon size={24} />}</button></header>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'ai' && (<div className="group relative w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white"><Bot size={24} />{msg.source && (<div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-700 rounded-full p-0.5 shadow-md">{msg.source === 'KNOWLEDGE_BASE' ? <Database size={14} className="text-blue-500" /> : <BrainCircuit size={14} className="text-purple-500" />}</div>)}</div>)}
                                <div className={`max-w-lg rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 rounded-bl-none'}`}>
                                    {/* --- THIS IS THE CRITICAL CHANGE --- */}
                                    {msg.sender === 'user' ? (
                                        <p className="p-4">{msg.content.data}</p> // User message is always text
                                    ) : (
                                        msg.content && msg.content.type === 'table' ? (
                                            <TableView tableData={msg.content.data} />
                                        ) : (
                                            <p className="p-4">{msg.content ? msg.content.data : '...'}</p> // AI text response
                                        )
                                    )}
                                </div>
                                {msg.sender === 'user' && (<div className="w-10 h-10 flex-shrink-0 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center"><User size={24} /></div>)}
                            </div>
                        ))}
                        {isLoading && (<div className="flex items-start gap-4 animate-pulse"><div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white"><Bot size={24} /></div><div className="max-w-lg p-4 rounded-2xl bg-white dark:bg-gray-800 rounded-bl-none"><p className="italic text-gray-500">Thinking...</p></div></div>)}
                    </div>
                </div>
                <footer className="p-4">
                    <div className="max-w-3xl mx-auto"><div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex items-center"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={isListening ? "Listening..." : "Ask me anything..."} className="flex-1 bg-transparent text-lg px-4 py-2 focus:outline-none" disabled={isLoading} /><button onClick={handleMicClick} className={`p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`} disabled={isLoading}><Mic size={24} /></button><button onClick={() => handleSendMessage()} className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors" disabled={!input.trim() || isLoading}><Send size={24} /></button></div></div>
                </footer>
            </main>
        </div>
    );
}

