import { useState, useRef, useEffect } from 'react';
import { Send, ArrowRight, ExternalLink, Trophy, ShieldCheck } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

import Markdown from 'react-markdown';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import BrandIsotipo from '@/components/BrandIsotipo';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  cta?: { label: string; to: string };
  timestamp?: string;
}

const SUGGESTIONS = [
  "¿Cómo empiezo a ahorrar?",
  "¿Qué es una tasa de interés?",
  "Ayúdame con mi presupuesto",
  "¿Cómo evito fraudes digitales?"
];

const CHATGPT_GPT_URL = "https://chatgpt.com/g/g-67aba26880108191b0e99b100eeb3632-iahorra-certus-educacion-financiera-del-futuro";
const ADVANCED_INVITE_MARKER = 'Experiencia avanzada IAhorra';
const ENABLE_TRIGGER_TEXT_ANALYTICS = import.meta.env.VITE_ENABLE_TRIGGER_TEXT_ANALYTICS !== 'false';

const COMPLEXITY_KEYWORDS = [
  'analiza',
  'analisis',
  'comparar',
  'comparacion',
  'detalle',
  'detallado',
  'detallada',
  'profundo',
  'profunda',
  'estrategia',
  'estrategias',
  'plan financiero',
  'escenario',
  'proyeccion',
  'proyección',
  'riesgo',
  'regulacion',
  'regulación',
  'normativa',
  'sbs',
  'asbanc',
  'sistema financiero',
  'tcea',
  'tea',
  'comisiones',
  'credito',
  'crédito',
  'endeudamiento'
];

function shouldSuggestAdvancedChat(prompt: string): boolean {
  const normalizedPrompt = prompt.toLowerCase().trim();
  if (!normalizedPrompt) return false;

  const wordCount = normalizedPrompt.split(/\s+/).filter(Boolean).length;
  const hasComplexKeyword = COMPLEXITY_KEYWORDS.some(keyword => normalizedPrompt.includes(keyword));
  const hasComparisonIntent = /\b(vs|versus|compar(a|ar)|mejor opcion|mejor opción)\b/i.test(normalizedPrompt);
  const hasMultiQuestionIntent = (normalizedPrompt.match(/\?/g) || []).length >= 2;

  return wordCount >= 22 || hasComplexKeyword || hasComparisonIntent || hasMultiQuestionIntent;
}

function buildAdvancedInviteMessage(): string {
  return `${ADVANCED_INVITE_MARKER}: si quieres una respuesta mas precisa y profunda sobre el sistema financiero nacional (SBS y ASBANC), puedes continuar aqui: ${CHATGPT_GPT_URL}`;
}

function isLowConfidenceResponse(response: string): boolean {
  const normalized = response.toLowerCase().trim();
  if (!normalized) return true;

  const lowConfidenceSignals = [
    'no cuento con suficiente contexto',
    'no tengo suficiente contexto',
    'no tengo suficiente informacion',
    'no tengo suficiente información',
    'no dispongo de suficiente informacion',
    'no dispongo de suficiente información',
    'no puedo confirmar',
    'no puedo validar',
    'podria estar incompleta',
    'podría estar incompleta',
    'seria mejor revisar',
    'sería mejor revisar'
  ];

  return lowConfidenceSignals.some(signal => normalized.includes(signal));
}

function anonymizeAnalyticsQuestion(question: string): string {
  return question
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[correo]')
    .replace(/\b(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){8,12}\b/g, '[telefono]')
    .replace(/\b\d+[\d.,]*\b/g, '[monto]')
    .replace(/\b(dni|ruc|cuenta|tarjeta|celular|telefono|teléfono)\b\s*[:#-]?\s*[A-Za-z0-9-]+/gi, '[dato_sensible]')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function Chat() {
  const { user, firebaseUser, goals } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedCard, setShowAdvancedCard] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [advancedModalSource, setAdvancedModalSource] = useState<'card' | 'message'>('card');
  const [advancedCardCooldownRemaining, setAdvancedCardCooldownRemaining] = useState(0);
  const [advancedTriggerQuestion, setAdvancedTriggerQuestion] = useState('');
  const [advancedModalTriggerQuestion, setAdvancedModalTriggerQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPromptHandledRef = useRef(false);

  const activeGoal = goals.find(g => g.status === 'active') || goals[0];
  const activeGoalName = activeGoal?.name || 'Aprender a ahorrar';

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'chats'),
      where('userId', '==', firebaseUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let cta;
        if (data.role === 'model') {
          const textLower = data.text.toLowerCase();
          if (textLower.includes('simulador') || textLower.includes('presupuesto')) {
            cta = { label: 'Ver en simulador', to: '/simulator' };
          } else if (textLower.includes('fraude') || textLower.includes('estafa')) {
            cta = { label: 'Ir a Evita Fraudes', to: '/frauds' };
          } else if (textLower.includes('chatgpt.com/g/') || textLower.includes(ADVANCED_INVITE_MARKER.toLowerCase())) {
            cta = { label: 'Continuar en nuestro asistente IAhorra v1.0', to: CHATGPT_GPT_URL };
          }
        }
        fetchedMessages.push({
          id: doc.id,
          role: data.role as 'user' | 'model',
          text: data.text,
          cta,
          timestamp: data.timestamp
        });
      });

      const initialMsg: Message = {
        id: 'greeting',
        role: 'model',
        text: `¡Hola, ${user?.name || 'Valeria'}! Soy IAhorra, tu mentor financiero de CERTUS. Veo que tu meta es "${activeGoalName}". ¿En qué te puedo ayudar hoy? 🌱`
      };

      if (fetchedMessages.length === 0) {
        setMessages([initialMsg]);
      } else {
        setMessages([initialMsg, ...fetchedMessages]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
    });

    return () => unsubscribe();
  }, [firebaseUser, user?.name, activeGoalName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessage = async (role: 'user' | 'model', text: string) => {
    if (!firebaseUser) return;
    try {
      await addDoc(collection(db, 'chats'), {
        userId: firebaseUser.uid,
        role,
        text,
        timestamp: new Date().toISOString()
      });
      // Increment global stats for chats
      try {
        await setDoc(doc(db, 'public_stats', 'global'), { totalChats: increment(1) }, { merge: true });
      } catch (e) {
        console.error("Failed to update global stats for chats", e);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const trackAdvancedAssistantClick = async (source: 'card' | 'message', triggerQuestion: string) => {
    if (!firebaseUser) return;
    const normalizedQuestion = anonymizeAnalyticsQuestion(triggerQuestion).slice(0, 280);
    const analyticsPayload: Record<string, unknown> = {
      advancedAssistantClicks: increment(1),
      advancedAssistantClicksFromCard: increment(source === 'card' ? 1 : 0),
      advancedAssistantClicksFromMessage: increment(source === 'message' ? 1 : 0),
      advancedAssistantLastTriggerSource: source,
      advancedAssistantLastClickedAt: new Date().toISOString(),
      advancedAssistantTriggerTextEnabled: ENABLE_TRIGGER_TEXT_ANALYTICS,
    };

    if (ENABLE_TRIGGER_TEXT_ANALYTICS) {
      analyticsPayload.advancedAssistantLastTriggerQuestion = normalizedQuestion;
    }

    try {
      await setDoc(
        doc(db, 'public_stats', 'global'),
        analyticsPayload,
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to track advanced assistant click', error);
    }
  };

  const openAdvancedAssistantModal = (source: 'card' | 'message', triggerQuestion = '') => {
    const normalizedQuestion = triggerQuestion.trim() || advancedTriggerQuestion;
    setAdvancedModalSource(source);
    setAdvancedModalTriggerQuestion(normalizedQuestion);
    setIsAdvancedModalOpen(true);
  };

  const dismissAdvancedAssistantModal = () => {
    setIsAdvancedModalOpen(false);
    setAdvancedCardCooldownRemaining(3);
    setShowAdvancedCard(false);
  };

  const buildAdvancedAssistantUrl = (question: string): string => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return CHATGPT_GPT_URL;

    const url = new URL(CHATGPT_GPT_URL);
    url.searchParams.set('prompt', trimmedQuestion);
    return url.toString();
  };

  const confirmAdvancedAssistantNavigation = async () => {
    const targetUrl = buildAdvancedAssistantUrl(advancedModalTriggerQuestion);
    setIsAdvancedModalOpen(false);

    // iOS Safari/PWA can block popups if there is any async work before window.open.
    // Trigger navigation first, then run async side effects.
    const openedWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      window.location.assign(targetUrl);
    }

    void trackAdvancedAssistantClick(advancedModalSource, advancedModalTriggerQuestion);
    if (advancedModalTriggerQuestion && navigator?.clipboard?.writeText) {
      void navigator.clipboard.writeText(advancedModalTriggerQuestion).catch((error) => {
        console.warn('Clipboard copy failed', error);
      });
    }
  };

  const getNearestPreviousUserQuestion = (messageIndex: number): string => {
    for (let i = messageIndex - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === 'user') {
        return messages[i].text;
      }
    }
    return advancedTriggerQuestion;
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !firebaseUser) return;

    // Capture history before any async operations to prevent including the new message
    const currentHistory = [...messages];
    const userMessage = text.trim();
    const isComplexPrompt = shouldSuggestAdvancedChat(userMessage);
    const hasCooldown = advancedCardCooldownRemaining > 0;
    if (hasCooldown) {
      setAdvancedCardCooldownRemaining(prev => Math.max(prev - 1, 0));
    }

    if (isComplexPrompt) {
      setAdvancedTriggerQuestion(userMessage);
    }

    setShowAdvancedCard(!hasCooldown && isComplexPrompt);
    const wasRecentlyInvited = currentHistory
      .slice(-8)
      .some(m => m.role === 'model' && m.text.includes(ADVANCED_INVITE_MARKER));

    // Optimistic update for user message
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to Firestore
      await saveMessage('user', userMessage);

      const systemInstruction = `
        Eres IAhorra, el asistente virtual educativo oficial de IAhorra CERTUS, una plataforma de educación financiera desarrollada por Instituto CERTUS (certus.edu.pe).
        Tu misión es enseñar finanzas personales de forma clara, cercana y sin tecnicismos.
        El usuario se llama ${user?.name || 'Valeria'}, su perfil de edad es ${user?.ageProfile || 'joven'}, y su meta actual es "${activeGoalName}".
        Comunícate en primera persona, usa emojis, sé motivador y adapta tu lenguaje a su edad.
        Usa ejemplos cotidianos peruanos (Yape, propinas, mercado, etc.).
        NUNCA recomiendes productos financieros específicos de bancos.
        Si la respuesta es larga, sugiere usar el simulador o ir a la sección de educación.
        Mantenlo breve, máximo 3-4 párrafos cortos.
      `;

      // Build chat history from previous messages
      const historyToReplay = currentHistory.filter(m => m.id !== 'greeting');
      const chatHistory: { role: string; parts: { text: string }[] }[] = [];
      let lastRole = '';

      for (const m of historyToReplay) {
        if (m.role === 'user') {
          if (lastRole === 'user') {
            chatHistory[chatHistory.length - 1].parts[0].text += '\n' + m.text;
          } else {
            chatHistory.push({ role: 'user', parts: [{ text: m.text }] });
            lastRole = 'user';
          }
        } else if (m.role === 'model') {
          if (lastRole === 'model') {
            chatHistory[chatHistory.length - 1].parts[0].text += '\n' + m.text;
          } else if (lastRole === 'user') {
            chatHistory.push({ role: 'model', parts: [{ text: m.text }] });
            lastRole = 'model';
          } else {
            chatHistory.push({ role: 'user', parts: [{ text: 'Hola' }] });
            chatHistory.push({ role: 'model', parts: [{ text: m.text }] });
            lastRole = 'model';
          }
        }
      }

      // Ensure history doesn't end with a user turn (we're about to add one)
      if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
        chatHistory.pop();
      }

      // Call the Vercel serverless function — API key stays on the server
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory.length > 0 ? chatHistory : undefined,
          systemInstruction,
        }),
      });

      if (!apiResponse.ok) {
        const errData = await apiResponse.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(errData.error || 'Error del servidor');
      }

      const aiData = await apiResponse.json();
      const responseText = (aiData.text as string) || '';

      // Save model response to Firestore
      await saveMessage('model', responseText);

      if (isLowConfidenceResponse(responseText) && !wasRecentlyInvited) {
        await saveMessage('model', buildAdvancedInviteMessage());
      }

    } catch (error: any) {
      console.error("Error calling Gemini:", error);
      // We don't save error messages to DB, just show them temporarily
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `Uy, tuve un pequeño problema técnico. Detalle: ${error?.message || 'Error desconocido'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.initialPrompt && !initialPromptHandledRef.current && firebaseUser) {
      const prompt = location.state.initialPrompt;
      initialPromptHandledRef.current = true;
      // Clear state to avoid re-triggering
      window.history.replaceState({}, document.title);
      handleSend(prompt);
    }
  }, [location.state, firebaseUser]);

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Header */}
      <div className="bg-certus-blue px-4 py-4 flex items-center justify-center shadow-md z-10 sticky top-0">
        <div className="w-full max-w-3xl flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden p-1">
              <BrandIsotipo alt="IAhorra" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-6 h-6" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-certus-green rounded-full border-2 border-certus-blue"></div>
          </div>
          <div>
            <h2 className="font-display font-bold text-white leading-tight">IAhorra</h2>
            <p className="text-xs text-certus-green font-medium">● En línea</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-certus-light/30 items-center">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", msg.role === 'user' ? "self-end flex-row-reverse" : "self-start")}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden p-0.5 border border-certus-light">
                  <BrandIsotipo alt="IAhorra" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-4 h-4" />
                </div>
              )}
              
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-certus-blue text-white rounded-tr-sm" 
                  : "bg-white text-certus-text border-l-4 border-certus-cyan shadow-sm rounded-tl-sm"
              )}>
                {msg.role === 'model' ? (
                  <div className="markdown-body prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  msg.text
                )}
                
                {msg.cta && (
                  <button 
                    onClick={() => {
                      if (msg.cta!.to.startsWith('http')) {
                        openAdvancedAssistantModal('message', getNearestPreviousUserQuestion(idx));
                        return;
                      }
                      navigate(msg.cta!.to);
                    }}
                    className="mt-3 flex items-center gap-1 text-certus-magenta font-display font-semibold text-xs hover:underline"
                  >
                    {msg.cta.label} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 max-w-[85%] self-start">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden p-0.5 border border-certus-light">
                <BrandIsotipo alt="IAhorra" mode="light" className="w-full h-full object-contain" fallbackClassName="text-certus-blue w-4 h-4" />
              </div>
              <div className="bg-white p-4 rounded-2xl border-l-4 border-certus-cyan shadow-sm rounded-tl-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-certus-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-certus-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-certus-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar pb-2 justify-center">
          <div className="flex gap-2 max-w-3xl w-full">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="whitespace-nowrap bg-white border border-certus-cyan text-certus-cyan px-3 py-1.5 rounded-full text-xs font-medium hover:bg-certus-light transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="flex items-center gap-2 bg-certus-light rounded-full p-1 pr-2 border border-transparent focus-within:border-certus-cyan transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-certus-magenta text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-colors shrink-0"
            >
              <Send size={18} className="ml-1" />
            </button>
          </div>
          {showAdvancedCard && (
          <div className="mt-4 rounded-2xl border border-certus-cyan/30 bg-gradient-to-r from-certus-light to-white p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-wide text-certus-magenta uppercase">
                  Experiencia avanzada IAhorra
                </p>
                <p className="text-sm text-certus-text leading-snug">
                  Si necesitas respuestas más precisas sobre el sistema financiero peruano, usa la versión especializada de IAhorra en ChatGPT.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-certus-blue border border-certus-light">
                    <ShieldCheck size={12} className="text-certus-cyan" />
                    Fuentes SBS y ASBANC
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-certus-blue border border-certus-light">
                    <Trophy size={12} className="text-certus-yellow" />
                    1.er lugar Semana Mundial del Ahorro 2025
                  </span>
                </div>
              </div>
              <button
                onClick={() => openAdvancedAssistantModal('card', advancedTriggerQuestion)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-certus-blue px-4 py-2.5 text-sm font-display font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-certus-magenta"
              >
                Probar IAhorra en ChatGPT
                <ExternalLink size={15} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Recomendado para consultas profundas, comparación de opciones y orientación financiera paso a paso.
            </p>
          </div>
          )}
        </div>
      </div>

      {isAdvancedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-certus-blue/45 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-certus-light">
            <h3 className="font-display text-lg font-bold text-certus-blue">Continuar en nuestro asistente IAhorra v1.0</h3>
            <p className="mt-2 text-sm text-certus-text leading-relaxed">
              Vas a abrir una nueva pestaña con la versión avanzada de IAhorra en ChatGPT, especializada en consultas más precisas del sistema financiero nacional.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Basado en contenidos de SBS y ASBANC, y reconocido con el 1.er lugar en la Semana Mundial del Ahorro 2025.
            </p>
            <p className="mt-2 text-xs text-certus-blue/80">
              Tu última pregunta se enviará como contexto inicial y también se copiará automáticamente para que la pegues si ChatGPT no la precarga.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={dismissAdvancedAssistantModal}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAdvancedAssistantNavigation}
                className="inline-flex items-center gap-2 rounded-lg bg-certus-blue px-3 py-2 text-sm font-semibold text-white hover:bg-certus-magenta"
              >
                Continuar
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
