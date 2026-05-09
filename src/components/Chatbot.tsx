import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, ChevronDown, Loader2, Sparkles, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateChatResponse } from '../services/geminiService';
import { auth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'مرحباً بك في عالم الفخامة.. أنا "سند"، مستشارك الرقمي في عموري ستور. يسعدني جداً مساعدتك في اختيار أرقى الساعات أو العطور التي تليق بذوقك الرفيع. كيف يمكنني خدمتك اليوم؟' }
  ]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && messages.length === 1) {
        setMessages([{ role: 'model', text: `أهلاً بك يا ${currentUser.displayName || 'عزيزنا العميل'} في عالم الفخامة.. أنا "سند" خبيرك الذكي في الساعات والعطور، كيف أقدر أخدمك اليوم؟` }]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Sync with mobile menu state via body class
    const checkMenu = () => {
      const isMenuOpen = document.body.classList.contains('menu-open') || 
                        document.querySelector('[data-state="open"]'); // check for shadcn/headless dialogs
      setIsMenuOpen(!!isMenuOpen);
    };
    checkMenu(); // initial check

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkMenu();
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (overrideMessage?: string) => {
    const textToSend = overrideMessage || inputText;
    if (!textToSend.trim()) return;

    const userMessage = textToSend.trim();
    if (!overrideMessage) setInputText('');
    
    // UI feedback first
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    if (!isOnline) {
      setMessages(prev => [...prev, { role: 'model', text: 'الإنترنت مقطوع ياحبوب، تأكد من اتصالك بالشبكة وخلاص.' }]);
      return;
    }

    try {
      // Use current messages for history
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await generateChatResponse(history, userMessage, {
        isLoggedIn: !!user,
        userName: user?.displayName
      });
      
      const functionCalls = response.functionCalls;
      
      // Access text safely from response
      let modelText = '';
      try {
        modelText = response.text || '';
      } catch (e) {
        // Handle cases where response might be tool-only
      }

      if (modelText) {
        setMessages(prev => [...prev, { role: 'model', text: modelText }]);
      }
      
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === "navigateTo") {
            const { page, mode } = call.args;
            const routeMap: Record<string, string> = {
              'auth': mode === 'register' ? 'إنشاء الحساب' : 'تسجيل الدخول',
              'store': 'المتجر الرئيسي',
              'contact': 'تواصل معنا',
              'offers': 'قسم العروض الحصرية',
              'consultations': 'خدمة الاستشارات',
              'services': 'خدماتنا الراقية',
              'cart': 'سلة المشتريات',
              'profile': 'حسابك الشخصي'
            };
            const targetName = routeMap[page] || page;
            setMessages(prev => [...prev, { role: 'model', text: `بكل سرور، جاري توجيهك إلى ${targetName}... استمتع بتجربة تسوق فريدة.` }]);
            
            setTimeout(() => {
              if (page === "auth") navigate(`/auth?mode=${mode || 'login'}`);
              else navigate(`/${page}`);
            }, 1500);
          } else if (call.name === "bookConsultation") {
            const args = call.args;
            try {
              const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
              const { db } = await import('../firebase');
              
              await addDoc(collection(db, 'consultations'), {
                fullName: args.fullName,
                phone: args.phone,
                topic: args.topic,
                inquiry: args.inquiry || '',
                userId: user?.uid || null,
                createdAt: serverTimestamp(),
                status: 'pending'
              });

              // Admin notification
              await addDoc(collection(db, 'notifications'), {
                message: `حجز استشارة جديد من ${args.fullName} عبر المساعد الذكي`,
                link: '/admin/consultations',
                isAdmin: true,
                read: false,
                createdAt: serverTimestamp(),
                type: 'consultation'
              });

              // User notification if logged in
              if (user) {
                await addDoc(collection(db, 'notifications'), {
                  message: `تم حجز استشارتك بنجاح يا ${args.fullName}. سنتواصل معك قريباً.`,
                  userId: user.uid,
                  isAdmin: false,
                  read: false,
                  createdAt: serverTimestamp(),
                  type: 'consultation'
                });
              }

              setMessages(prev => [...prev, { role: 'model', text: `تم حجز استشارتك بنجاح سيتم التواصل معك قريباً.` }]);
            } catch(e) {
               console.error("Booking failed", e);
               setMessages(prev => [...prev, { role: 'model', text: `عذراً لم أتمكن من إتمام الحجز، يرجى المحاولة من صفحة الاستشارات أو المحاولة لاحقاً.` }]);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const isKeyMissing = error?.message?.includes('مفتاح البرمجة') || error?.message?.includes('API Key');
      const errorMessage = isKeyMissing 
        ? "عذراً، يبدو أن مفتاح الذكاء الاصطناعي غير مفعل في هذه الاستضافة. يرجى التأكد من إعدادات البيئة (API Key)."
        : "الإنترنت مقطوع ياحبوب، تأكد من اتصالك بالشبكة وخلاص.";
      
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const allowedPaths = ['/', '/store', '/offers', '/services'];
  const isAllowed = allowedPaths.includes(location.pathname);

  if (!isAllowed || isMenuOpen) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-[80px] lg:bottom-12 right-4 lg:right-8 z-[90] w-11 h-11 lg:w-14 lg:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110",
          isOpen ? "bg-red-500 rotate-90" : "bg-teal-600 hover:bg-teal-700"
        )}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-6 h-6 lg:w-7 lg:h-7 text-white" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-900 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-[100px] bottom-[155px] lg:top-28 lg:bottom-40 right-4 md:right-6 z-[90] w-[80vw] md:w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center border border-white/20 shadow-inner">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black leading-none mb-1">مساعد عموري ستور</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                    <span className="text-[10px] text-teal-100 font-medium">سند متصل الآن</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="تصغير"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
              style={{ direction: 'rtl' }}
            >
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                    msg.role === 'user' ? "mr-auto items-start" : "ml-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3.5 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-amber-600 text-white rounded-tl-none" 
                      : "bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tr-none"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.role === 'user' ? 'أنت' : 'سند'}
                  </span>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-2 max-w-[85%] ml-auto">
                  <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm border border-slate-100 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span className="text-xs text-slate-500">جاري الكتابة...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Persuasive Quick Actions */}
            {messages.length === 1 && !isTyping && (
              <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-2 bg-slate-50/80">
                {[
                  { label: "أفخم الساعات ⌚", text: "أريد استكشاف أرقى ماركات الساعات العالمية المتوفرة" },
                  { label: "عطور فواحة 🧴", text: "أبحث عن عطر فواح وثابت للمناسبات الرسمية" },
                  { label: "أقوى العروض 🎁", text: "ما هي أقوى العروض والتخفيضات الحالية؟" },
                  { label: "استشارة خاصة 🤝", text: "أريد حجز استشارة خاصة لاختيار المنتج الأنسب لي" },
                ].map((btn, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(btn.text)}
                    className="text-[11px] font-black bg-white border border-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-4 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-teal-500/10 text-right font-bold"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-90",
                  inputText.trim() && !isTyping 
                    ? "bg-teal-600 text-white shadow-teal-100" 
                    : "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                )}
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 -rotate-90" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
