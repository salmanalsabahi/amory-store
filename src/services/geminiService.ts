import { GoogleGenAI, Type } from "@google/genai";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

let ai: any = null;

// Tool for navigation
const navigationTool = {
  name: "navigateTo",
  description: "ينقل المستخدم إلى صفحة معينة في التطبيق (مثل المتجر، العروض، الخدمات، السلة، أو صفحة التواصل).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: { 
        type: Type.STRING, 
        enum: ["store", "offers", "services", "cart", "profile", "auth", "contact", "consultations", "tracking"],
        description: "الصفحة المراد الانتقال إليها" 
      },
      mode: {
        type: Type.STRING,
        enum: ["login", "register"],
        description: "وضع صفحة الحساب (تسجيل دخول أو إنشاء حساب جديد)"
      }
    },
    required: ["page"]
  }
};

const bookConsultationTool = {
  name: "bookConsultation",
  description: "يقوم بحجز استشارة للعميل مباشرة في النظام، وتنبيه الإدارة.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fullName: { type: Type.STRING, description: "الاسم الكامل للعميل" },
      phone: { type: Type.STRING, description: "رقم هاتف العميل للتواصل" },
      topic: { type: Type.STRING, description: "نوع الاستشارة (عطور، ساعات، إكسسوارات)" },
      inquiry: { type: Type.STRING, description: "نبذة عن المشكلة أو الاستفسار" }
    },
    required: ["fullName", "phone", "topic"]
  }
};

const SYSTEM_INSTRUCTION = `أنت "سند - المستشار الرقمي لعموري ستور (Amory Store)". أنت خبير عالمي في الساعات الفاخرة، العطور النادرة، والإكسسوارات الراقية.

مهمتك الأساسية هي: تقديم تجربة تسوق فخمة، الإجابة بدقة على استفسارات العملاء، وإقناعهم بجودة منتجاتنا وتوجيههم لإتمام الشراء.

دليل المعرفة الخاص بك:
1. صفحات الموقع:
   - store: المتجر الكامل (تصفح جميع الساعات والعطور).
   - offers: صفحة التخفيضات الكبرى والعروض الحصرية.
   - services: الخدمات الخاصة (تغليف هدايا، صيانة ساعات، باقات العطور).
   - consultations: حجز استشارة خاصة مع خبير أناقة.
   - tracking: تتبع حالة الطلبات.
   - contact: رقم الهاتف، العنوان، وإرسال رسالة للدعم.
   - cart: سلة المشتريات لمراجعة الطلب قبل الدفع.

2. الشخصية والأسلوب:
   - الأسلوب: Luxury Style، لبق، يستخدم (يا هلا، ذوقك منبع الفخامة، نشرف بخدمتك).
   - اللهجة: مزيج راقٍ من العربية واليمنية الصنعانية العذبة.
   - الإقناع: ركز على أن الساعات أصلية (Rolex, Hublot, etc)، والعطور عالمية وثباتها مضمون.

3. الأوامر البرمجية (tools):
   - استخدم navigateTo دائماً عندما يريد العميل الذهاب لصفحة معينة أو الشراء.
   - إذا أراد حجز استشارة يمكن سؤال العميل عن اسمه، رقم هاتفه وموضوع الاستشارة واستخدم bookConsultation لحجزها فعلاً في النظام.

4. تذكر: هدفك ليس فقط الرد، بل إبهار العميل وجعله يثق في عموري ستور كوجهته الأولى للأناقة.`;

export async function generateChatResponse(history: any[], userMessage: string, userContext?: { isLoggedIn: boolean, userName?: string | null }) {
  try {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error("Gemini API Key missing. Please check your environment variables (GEMINI_API_KEY or VITE_GEMINI_API_KEY).");
        throw new Error("لم يتم العثور على مفتاح البرمجة (API Key) المخصص للذكاء الاصطناعي. إذا كنت قد رفعت الموقع للتو، فتأكد من إضافة المفتاح في إعدادات البيئة بالاستضافة.");
      }
      
      ai = new GoogleGenAI({ apiKey });
    }

    const MAX_HISTORY = 10;
    let formattedHistory = history
      .slice(-MAX_HISTORY)
      .filter(m => m.text && m.text.trim() !== '')
      .map(m => ({ 
        role: m.role === 'model' ? 'model' : 'user', 
        parts: [{ text: m.text }] 
      }));

    const sanitizedContents: any[] = [];
    formattedHistory.forEach((msg) => {
      if (sanitizedContents.length === 0) {
        if (msg.role === 'user') sanitizedContents.push(msg);
      } else if (msg.role !== sanitizedContents[sanitizedContents.length - 1].role) {
        sanitizedContents.push(msg);
      }
    });

    const userStatusInfo = userContext?.isLoggedIn 
      ? `العميل الحالي مسجل دخول باسم: ${userContext.userName || 'عزيزنا العميل'}. رحب به بفخامة باسمه.`
      : `العميل غير مسجل دخول. شجعه على إنشاء حساب ليتمكن من تتبع طلبياته والحصول على عروض حصرية، ثم استخدم أداة navigateTo لنقله لإنشاء حساب (page: auth, mode: register).`;

    const ENHANCED_INSTRUCTION = `${SYSTEM_INSTRUCTION}

${userStatusInfo}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...sanitizedContents,
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: ENHANCED_INSTRUCTION,
        tools: [{ functionDeclarations: [navigationTool, bookConsultationTool] }]
      }
    });

    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
