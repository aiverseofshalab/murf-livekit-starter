'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'hi';

export interface Translations {
  nav: {
    home: string;
    howItWorks: string;
    features: string;
    analytics: string;
    operations: string;
    talkCta: string;
    langToggle: string;
  };
  hero: {
    badge: string;
    headline: string;
    headlineAccent: string;
    description: string;
    talkButton: string;
    howItWorksButton: string;
    regionalNoteTitle: string;
    regionalNoteDesc: string;
    trustConsentedMemory: string;
    trustVerifiedFacility: string;
    trustHumanEscalation: string;
    trustRealtimeAnalytics: string;
  };
  voiceConsole: {
    readyTitle: string;
    readySub: string;
    connectingTitle: string;
    connectingSub: string;
    listeningTitle: string;
    listeningSub: string;
    thinkingTitle: string;
    thinkingSub: string;
    speakingTitle: string;
    speakingSub: string;
    endedTitle: string;
    endedSub: string;
    errorTitle: string;
    errorSub: string;
    privacyNotice: string;
    startButton: string;
    newSessionButton: string;
  };
  howItWorks: {
    tag: string;
    heading: string;
    sub: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  capabilities: {
    tag: string;
    heading: string;
    sub: string;
    triageTitle: string;
    triageDesc: string;
    triageBadge: string;
    facilityTitle: string;
    facilityDesc: string;
    facilityBadge: string;
    escalationTitle: string;
    escalationDesc: string;
    escalationBadge: string;
    memoryTitle: string;
    memoryDesc: string;
    memoryBadge: string;
  };
  techSection: {
    tag: string;
    heading: string;
    sub: string;
    ttsTitle: string;
    ttsDesc: string;
    sttTitle: string;
    sttDesc: string;
    agentsTitle: string;
    agentsDesc: string;
    memoryTitle: string;
    memoryDesc: string;
  };
  trust: {
    badge: string;
    heading: string;
    copy: string;
    tagRight: string;
  };
  cta: {
    tag: string;
    heading: string;
    sub: string;
    button: string;
  };
  sos: {
    buttonLabel: string;
    dialogTitle: string;
    dialogDesc: string;
    cancel: string;
    confirm: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      howItWorks: 'How It Works',
      features: 'Features',
      analytics: 'Call Analytics',
      operations: 'Operations',
      talkCta: 'TALK TO MEDISATHI',
      langToggle: 'EN | हिन्दी',
    },
    hero: {
      badge: 'Voice-First AI Healthcare Assistant',
      headline: 'Healthcare,',
      headlineAccent: 'made easier to access.',
      description:
        'MEDISATHI is an AI-powered voice healthcare assistant designed to make healthcare information and assistance more accessible through natural voice conversations.',
      talkButton: 'TALK TO MEDISATHI',
      howItWorksButton: 'HOW IT WORKS',
      regionalNoteTitle: 'आपकी सेहत, आपकी भाषा में।',
      regionalNoteDesc: 'Talk naturally in English or Hindi.',
      trustConsentedMemory: 'Consented Memory & Privacy',
      trustVerifiedFacility: 'Verified Facility Search',
      trustHumanEscalation: 'Structured Human Escalation',
      trustRealtimeAnalytics: 'Real-Time Operational Analytics',
    },
    voiceConsole: {
      readyTitle: 'Ready to listen',
      readySub: 'Tap the button below to start your natural voice conversation.',
      connectingTitle: 'Connecting to MEDISATHI...',
      connectingSub: 'Establishing secure healthcare voice channel...',
      listeningTitle: "I'm listening",
      listeningSub: 'Go ahead, ask your general health question...',
      thinkingTitle: 'Processing...',
      thinkingSub: 'MEDISATHI is preparing a thoughtful response.',
      speakingTitle: 'MEDISATHI is speaking',
      speakingSub: 'Please wait while MEDISATHI responds...',
      endedTitle: 'Conversation ended',
      endedSub: 'Thank you for talking with MEDISATHI.',
      errorTitle: 'Something went wrong',
      errorSub: 'Please check your microphone or connection and try again.',
      privacyNotice: 'Private & Confidential • Hands-free voice',
      startButton: 'Start Conversation',
      newSessionButton: 'Start New Session',
    },
    howItWorks: {
      tag: 'How It Works',
      heading: 'Helpful care starts with a conversation.',
      sub: 'MEDISATHI listens first, then responds with the right information, tool, memory-aware context, or human follow-up for the moment.',
      step1Title: 'SPEAK',
      step1Desc: 'Talk naturally with MEDISATHI.',
      step2Title: 'UNDERSTAND',
      step2Desc:
        'MEDISATHI understands your request and identifies the appropriate response or next step.',
      step3Title: 'ASSIST',
      step3Desc:
        'It responds, uses available tools, remembers relevant context, or connects you with human help when needed.',
    },
    capabilities: {
      tag: 'Core Capabilities',
      heading: 'One companion. Multiple ways to help.',
      sub: 'Designed for safe health access with clinical guardrails and human escalation protocols.',
      triageTitle: 'Symptom Care Triage',
      triageDesc:
        'Discuss symptoms naturally. MEDISATHI provides calm, structured triage guidance explaining whether care is routine, urgent, or emergency—without making an inappropriate diagnosis.',
      triageBadge: 'Calm triage guardrails • No medical jargon',
      facilityTitle: 'Verified Facility Search',
      facilityDesc:
        'Locate nearby Primary Health Centers (PHCs), CHCs, clinics, and hospitals using our specialist facility assistant (male voice: Karan).',
      facilityBadge: 'Real facility lookup tool',
      escalationTitle: 'Human Escalation',
      escalationDesc:
        'When professional medical decision-making or diagnosis is requested, MEDISATHI creates a structured human help request with your explicit consent.',
      escalationBadge: 'Requires explicit caller consent',
      memoryTitle: 'Consented Memory',
      memoryDesc:
        'Remembers your name and ongoing conditions across voice sessions only after explicit permission, maintaining total data privacy.',
      memoryBadge: 'SQLite memory engine',
    },
    techSection: {
      tag: 'Technical Infrastructure',
      heading: 'High-performance voice AI architecture.',
      sub: 'Built on industry-leading streaming audio and speech synthesis technologies.',
      ttsTitle: 'Murf Falcon TTS',
      ttsDesc:
        'Sub-second speech synthesis with natural inflection and multi-speaker voice handoffs.',
      sttTitle: 'Deepgram STT',
      sttDesc: 'Nova-3 multilingual speech recognition tuned for clear health vocabulary.',
      agentsTitle: 'LiveKit Agents',
      agentsDesc: 'Low-latency WebRTC streaming pipeline with automated turn detection and VAD.',
      memoryTitle: 'SQLite Memory',
      memoryDesc:
        'Local persisted memory engine ensuring user consent and zero third-party data leak.',
    },
    trust: {
      badge: 'Designed to Know Its Limits',
      heading: 'Healthcare information, not a replacement for doctors.',
      copy: 'MEDISATHI provides general healthcare information and assistance. It does not replace doctors, emergency services, or professional medical care.',
      tagRight: 'Verified Safety Boundaries',
    },
    cta: {
      tag: "Begin when you're ready",
      heading: 'A calmer way to get healthcare support.',
      sub: 'Start a private voice conversation with MEDISATHI whenever you need general health information or help finding the next step.',
      button: 'TALK TO MEDISATHI',
    },
    sos: {
      buttonLabel: 'SOS',
      dialogTitle: 'Emergency assistance',
      dialogDesc:
        'If you are experiencing a life-threatening emergency, contact emergency services immediately.',
      cancel: 'Cancel',
      confirm: 'Call emergency services',
    },
  },
  hi: {
    nav: {
      home: 'मुख्य पृष्ठ',
      howItWorks: 'यह कैसे काम करता है',
      features: 'विशेषताएं',
      analytics: 'कॉल एनालिटिक्स',
      operations: 'ऑपरेशन्स कंसोल',
      talkCta: 'मेडिसाथी से बात करें',
      langToggle: 'EN | हिन्दी',
    },
    hero: {
      badge: 'वॉइस-फर्स्ट AI स्वास्थ्य सेवा सहायक',
      headline: 'स्वास्थ्य सेवा,',
      headlineAccent: 'अब पाना आसान।',
      description:
        'मेडिसाथी एक AI-संचालित वॉइस हेल्थकेयर असिस्टेंट है जो प्राकृतिक आवाज़ की बातचीत के माध्यम से स्वास्थ्य जानकारी और सहायता को अधिक सुलभ बनाने के लिए डिज़ाइन किया गया है।',
      talkButton: 'मेडिसाथी से बात करें',
      howItWorksButton: 'यह कैसे काम करता है',
      regionalNoteTitle: 'आपकी सेहत, आपकी भाषा में।',
      regionalNoteDesc: 'अंग्रेजी या हिंदी में सहजता से बात करें।',
      trustConsentedMemory: 'सहमति आधारित गोपनीयता एवं मेमोरी',
      trustVerifiedFacility: 'सत्यापित स्वास्थ्य केंद्र खोज',
      trustHumanEscalation: 'संरचित मानव सहायता एस्केलेशन',
      trustRealtimeAnalytics: 'रियल-टाइम परिचालन विश्लेषण',
    },
    voiceConsole: {
      readyTitle: 'सुनने के लिए तैयार',
      readySub: 'प्राकृतिक वॉइस बातचीत शुरू करने के लिए नीचे दिए गए बटन को दबाएं।',
      connectingTitle: 'मेडिसाथी से जुड़ रहे हैं...',
      connectingSub: 'सुरक्षित स्वास्थ्य वॉइस चैनल स्थापित किया जा रहा है...',
      listeningTitle: 'मैं सुन रहा हूँ',
      listeningSub: 'आगे बढ़ें, अपना सामान्य स्वास्थ्य प्रश्न पूछें...',
      thinkingTitle: 'विचार कर रहे हैं...',
      thinkingSub: 'मेडिसाथी एक विचारशील उत्तर तैयार कर रहा है।',
      speakingTitle: 'मेडिसाथी बोल रहा है',
      speakingSub: 'कृपया प्रतीक्षा करें जब तक मेडिसाथी उत्तर देता है...',
      endedTitle: 'बातचीत समाप्त हुई',
      endedSub: 'मेडिसाथी से बात करने के लिए धन्यवाद।',
      errorTitle: 'कुछ गलत हो गया',
      errorSub: 'कृपया अपना माइक्रोफ़ोन या कनेक्शन जांचें और पुनः प्रयास करें।',
      privacyNotice: 'निजी एवं गोपनीय • हैंड्स-फ़्री आवाज',
      startButton: 'बातचीत शुरू करें',
      newSessionButton: 'नया सत्र शुरू करें',
    },
    howItWorks: {
      tag: 'यह कैसे काम करता है',
      heading: 'सहायक देखभाल एक बातचीत से शुरू होती है।',
      sub: 'मेडिसाथी पहले सुनता है, फिर सही जानकारी, टूल, मेमोरी-सचेत संदर्भ, या मानव सहायता प्रदान करता है।',
      step1Title: 'बोलें',
      step1Desc: 'मेडिसाथी के साथ प्राकृतिक रूप से बात करें।',
      step2Title: 'समझें',
      step2Desc: 'मेडिसाथी आपके अनुरोध को समझता है और उचित प्रतिक्रिया या अगला कदम पहचानता है।',
      step3Title: 'सहायता',
      step3Desc:
        'यह उत्तर देता है, उपलब्ध उपकरणों का उपयोग करता है, प्रासंगिक संदर्भ याद रखता है, या आवश्यकता पड़ने पर आपको मानव सहायता से जोड़ता है।',
    },
    capabilities: {
      tag: 'मुख्य क्षमताएं',
      heading: 'एक साथी। मदद करने के अनेक तरीके।',
      sub: 'नैदानिक सुरक्षा नियमों और मानव एस्केलेशन प्रोटोकॉल के साथ सुरक्षित स्वास्थ्य पहुंच के लिए डिज़ाइन किया गया।',
      triageTitle: 'लक्षण देखभाल ट्राइएज',
      triageDesc:
        'लक्षणों पर स्वाभाविक रूप से चर्चा करें। मेडिसाथी शांत, संरचित मार्गदर्शन प्रदान करता है जो बताता है कि देखभाल दिनचर्या, जरूरी या आपातकालीन है या नहीं—बिना किसी अनुचित निदान के।',
      triageBadge: 'शांत ट्राइएज सुरक्षा नियम • कोई कठिन चिकित्सा शब्दावली नहीं',
      facilityTitle: 'सत्यापित अस्पताल खोज',
      facilityDesc:
        'हमारे विशेषज्ञ सुविधा सहायक (पुरुष आवाज: करन) का उपयोग करके नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC), CHC, क्लीनिक और अस्पताल खोजें।',
      facilityBadge: 'वास्तविक स्वास्थ्य केंद्र खोज टूल',
      escalationTitle: 'मानव सहायता एस्केलेशन',
      escalationDesc:
        'जब पेशेवर चिकित्सा निर्णय या निदान का अनुरोध किया जाता है, तो मेडिसाथी आपकी स्पष्ट सहमति से एक संरचित मानव सहायता अनुरोध बनाता है।',
      escalationBadge: 'कॉलर की स्पष्ट सहमति आवश्यक है',
      memoryTitle: 'सहमति आधारित मेमोरी',
      memoryDesc:
        'कुल डेटा गोपनीयता बनाए रखते हुए, केवल स्पष्ट अनुमति के बाद वॉइस सत्रों में आपका नाम और चल रही स्थितियों को याद रखता है।',
      memoryBadge: 'SQLite मेमोरी इंजन',
    },
    techSection: {
      tag: 'तकनीकी अवसंरचना',
      heading: 'उच्च प्रदर्शन वॉइस AI वास्तुकला।',
      sub: 'उद्योग-अग्रणी स्ट्रीमिंग ऑडियो और वाक् संश्लेषण प्रौद्योगिकियों पर निर्मित।',
      ttsTitle: 'मर्फ फाल्कन TTS',
      ttsDesc: 'प्राकृतिक स्वर-परिवर्तन और बहु-वक्ता आवाज हस्तांतरण के साथ त्वरित वाक् संश्लेषण।',
      sttTitle: 'डीपग्राम STT',
      sttDesc: 'स्पष्ट स्वास्थ्य शब्दावली के लिए ट्यून की गई नोवा-3 बहुभाषी भाषण पहचान।',
      agentsTitle: 'लाइवकिट एजेंट्स',
      agentsDesc: 'स्वचालित मोड़ पहचान और VAD के साथ कम-विलंबता WebRTC स्ट्रीमिंग पाइपलाइन।',
      memoryTitle: 'SQLite मेमोरी',
      memoryDesc:
        'स्थानीय रूप से बनी मेमोरी इंजन जो उपयोगकर्ता की सहमति और शून्य तृतीय-पक्ष डेटा लीक सुनिश्चित करती है।',
    },
    trust: {
      badge: 'अपनी सीमाओं को जानने के लिए डिज़ाइन किया गया',
      heading: 'स्वास्थ्य जानकारी, डॉक्टरों का विकल्प नहीं।',
      copy: 'मेडिसाथी सामान्य स्वास्थ्य जानकारी और सहायता प्रदान करता है। यह डॉक्टरों, आपातकालीन सेवाओं या पेशेवर चिकित्सा देखभाल की जगह नहीं लेता है।',
      tagRight: 'सत्यापित सुरक्षा सीमाएं',
    },
    cta: {
      tag: 'जब आप तैयार हों तब शुरू करें',
      heading: 'स्वास्थ्य देखभाल सहायता प्राप्त करने का एक शांत तरीका।',
      sub: 'जब भी आपको सामान्य स्वास्थ्य जानकारी या अगला कदम खोजने में मदद की आवश्यकता हो, मेडिसाथी के साथ एक निजी वॉइस बातचीत शुरू करें।',
      button: 'मेडिसाथी से बात करें',
    },
    sos: {
      buttonLabel: 'SOS',
      dialogTitle: 'आपातकालीन सहायता',
      dialogDesc:
        'यदि आप जीवन के लिए खतरा पैदा करने वाली आपात स्थिति का अनुभव कर रहे हैं, तो तुरंत आपातकालीन सेवाओं से संपर्क करें।',
      cancel: 'रद्द करें',
      confirm: 'आपातकालीन सेवाओं को कॉल करें',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('medisathi_lang') as Language;
      if (saved && (saved === 'en' || saved === 'hi')) {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medisathi_lang', lang);
    }
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
