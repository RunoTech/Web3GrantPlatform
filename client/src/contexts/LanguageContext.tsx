import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'tr' | 'es' | 'fr' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header & Navigation
    'duxxan': 'DUXXAN',
    'campaigns': 'CAMPAIGNS',
    'funds': 'FUNDS',
    'donations': 'DONATIONS',
    'profile': 'PROFILE',
    'connect_wallet': 'CONNECT WALLET',
    'disconnect': 'DISCONNECT',
    
    // Hero Section
    'hero.title': 'NEXT-GEN BLOCKCHAIN DONATION PLATFORM',
    'hero.subtitle': 'Commission-free donations with futuristic technology. Direct wallet-to-wallet transfers on Ethereum and BSC networks.',
    'hero.explore_campaigns': 'EXPLORE CAMPAIGNS',
    'hero.create_campaign': 'CREATE CAMPAIGN',
    
    // Daily Rewards
    'daily.title': 'DAILY TETHER REWARDS',
    'daily.description': 'Participate daily and get a chance to win USDT rewards. Daily rewards distributed to our futuristic community!',
    'daily.connect_wallet': 'Connect wallet to participate in daily rewards',
    'daily.participate_today': 'PARTICIPATE TODAY',
    'daily.yesterday_winners': 'YESTERDAY\'S WINNERS',
    'daily.no_winners': 'NO WINNERS YET',
    'daily.be_first': 'Be the first to participate!',
    'daily.participation_process': 'PARTICIPATION PROCESS',
    'daily.step1': 'Connect Wallet',
    'daily.step2': 'Click Button',
    'daily.step3': 'Win Reward',
    
    // Statistics
    'stats.total_rewards': 'Total Rewards',
    'stats.hours_active': 'Hours Active',
    'stats.secure': 'Secure',
    
    // Popular Campaigns
    'popular.title': 'POPULAR CAMPAIGNS',
    'popular.subtitle': 'Discover and support high-impact, trusted projects with futuristic technology',
    'popular.no_campaigns': 'NO POPULAR CAMPAIGNS YET',
    'popular.create_first': 'Create the first campaign and make a difference',
    'popular.view_all': 'VIEW ALL CAMPAIGNS',
    
    // Features Section
    'features.why_title': 'WHY DUXXAN?',
    'features.subtitle': 'Secure and transparent donation experience with futuristic blockchain technology',
    'features.blockchain_security': 'BLOCKCHAIN SECURITY',
    'features.blockchain_desc': '100% secure transactions with smart contracts running on Ethereum and BSC networks',
    'features.commission_free': 'COMMISSION FREE',
    'features.commission_desc': 'Your donations go directly to campaign owners, no commission is deducted',
    'features.fast_easy': 'FAST & EASY',
    'features.fast_desc': 'Connect your wallet and create campaigns or donate within minutes',
    
    // Footer
    'footer.platform': 'PLATFORM',
    'footer.support': 'SUPPORT',
    'footer.connection': 'CONNECTION',
    'footer.how_it_works': 'HOW IT WORKS',
    'footer.security': 'SECURITY',
    'footer.faq': 'FAQ',
    'footer.rights': 'ALL RIGHTS RESERVED',
    'footer.description': 'Secure and transparent donation platform with futuristic blockchain technology',
  },
  tr: {
    // Header & Navigation
    'duxxan': 'DUXXAN',
    'campaigns': 'KAMPANYALAR',
    'funds': 'FONLAR',
    'donations': 'BAĞIŞLAR',
    'profile': 'PROFİL',
    'connect_wallet': 'CÜZDAN BAĞLA',
    'disconnect': 'BAĞLANTI KES',
    
    // Hero Section
    'hero.title': 'YENİ NESİL BLOCKCHAIN BAĞIŞ PLATFORMU',
    'hero.subtitle': 'Futuristik teknoloji ile komisyonsuz bağışlar. Ethereum ve BSC ağlarında doğrudan cüzdan-cüzdan transferler.',
    'hero.explore_campaigns': 'KAMPANYALARI KEŞFET',
    'hero.create_campaign': 'KAMPANYA OLUŞTUR',
    
    // Daily Rewards
    'daily.title': 'GÜNLÜK TETHER ÖDÜLÜ',
    'daily.description': 'Her gün katılım gösterin ve USDT ödülü kazanma şansı yakalayın. Futuristik topluluğa günlük ödüller dağıtılıyor!',
    'daily.connect_wallet': 'Günlük ödüle katılmak için cüzdan bağlayın',
    'daily.participate_today': 'BUGÜN KATIL',
    'daily.yesterday_winners': 'DÜNKÜ KAZANANLAR',
    'daily.no_winners': 'HENÜZ KAZANAN YOK',
    'daily.be_first': 'İlk katılan sen ol!',
    'daily.participation_process': 'KATILIM SÜRECİ',
    'daily.step1': 'Cüzdan Bağla',
    'daily.step2': 'Butona Tıkla',
    'daily.step3': 'Ödül Kazan',
    
    // Statistics
    'stats.total_rewards': 'Toplam Ödül',
    'stats.hours_active': 'Saat Aktif',
    'stats.secure': 'Güvenli',
    
    // Popular Campaigns
    'popular.title': 'POPÜLER KAMPANYALAR',
    'popular.subtitle': 'Futuristik etkisi yüksek, güvenilir projeleri keşfedin ve destekleyin',
    'popular.no_campaigns': 'HENÜZ POPÜLER KAMPANYA YOK',
    'popular.create_first': 'İlk kampanyayı oluşturun ve fark yaratın',
    'popular.view_all': 'TÜM KAMPANYALARI GÖRÜNTÜLE',
    
    // Features Section
    'features.why_title': 'NEDEN DUXXAN?',
    'features.subtitle': 'Futuristik blockchain teknolojisi ile güvenli ve şeffaf bağış deneyimi',
    'features.blockchain_security': 'BLOCKCHAİN GÜVENLİĞİ',
    'features.blockchain_desc': 'Ethereum ve BSC ağlarında çalışan akıllı kontratlar ile %100 güvenli işlemler',
    'features.commission_free': 'KOMİSYONSUZ',
    'features.commission_desc': 'Bağışlarınız doğrudan kampanya sahiplerine ulaşır, hiçbir komisyon kesilmez',
    'features.fast_easy': 'HIZLI VE KOLAY',
    'features.fast_desc': 'Cüzdanınızı bağlayın ve dakikalar içinde kampanya oluşturun veya bağış yapın',
    
    // Footer
    'footer.platform': 'PLATFORM',
    'footer.support': 'DESTEK',
    'footer.connection': 'BAĞLANTI',
    'footer.how_it_works': 'NASIL ÇALIŞIR',
    'footer.security': 'GÜVENLİK',
    'footer.faq': 'SSS',
    'footer.rights': 'TÜM HAKLARI SAKLIDIR',
    'footer.description': 'Futuristik blockchain teknolojisi ile güvenli ve şeffaf bağış platformu',
  },
  es: {
    // Header & Navigation
    'duxxan': 'DUXXAN',
    'campaigns': 'CAMPAÑAS',
    'funds': 'FONDOS',
    'donations': 'DONACIONES',
    'profile': 'PERFIL',
    'connect_wallet': 'CONECTAR BILLETERA',
    'disconnect': 'DESCONECTAR',
    
    // Hero Section
    'hero.title': 'PLATAFORMA DE DONACIONES BLOCKCHAIN DE NUEVA GENERACIÓN',
    'hero.subtitle': 'Donaciones sin comisiones con tecnología futurista. Transferencias directas billetera a billetera en redes Ethereum y BSC.',
    'hero.explore_campaigns': 'EXPLORAR CAMPAÑAS',
    'hero.create_campaign': 'CREAR CAMPAÑA',
    
    // Daily Rewards
    'daily.title': 'RECOMPENSAS DIARIAS DE TETHER',
    'daily.description': '¡Participa diariamente y obtén la oportunidad de ganar recompensas USDT. Recompensas diarias distribuidas a nuestra comunidad futurista!',
    'daily.connect_wallet': 'Conecta tu billetera para participar en las recompensas diarias',
    'daily.participate_today': 'PARTICIPAR HOY',
    'daily.yesterday_winners': 'GANADORES DE AYER',
    'daily.no_winners': 'AÚN NO HAY GANADORES',
    'daily.be_first': '¡Sé el primero en participar!',
    'daily.participation_process': 'PROCESO DE PARTICIPACIÓN',
    'daily.step1': 'Conectar Billetera',
    'daily.step2': 'Hacer Clic',
    'daily.step3': 'Ganar Recompensa',
    
    // Statistics
    'stats.total_rewards': 'Recompensas Totales',
    'stats.hours_active': 'Horas Activo',
    'stats.secure': 'Seguro',
    
    // Popular Campaigns
    'popular.title': 'CAMPAÑAS POPULARES',
    'popular.subtitle': 'Descubre y apoya proyectos confiables de alto impacto con tecnología futurista',
    'popular.no_campaigns': 'AÚN NO HAY CAMPAÑAS POPULARES',
    'popular.create_first': 'Crea la primera campaña y marca la diferencia',
    'popular.view_all': 'VER TODAS LAS CAMPAÑAS',
    
    // Features Section
    'features.why_title': '¿POR QUÉ DUXXAN?',
    'features.subtitle': 'Experiencia de donación segura y transparente con tecnología blockchain futurista',
    'features.blockchain_security': 'SEGURIDAD BLOCKCHAIN',
    'features.blockchain_desc': 'Transacciones 100% seguras con contratos inteligentes en redes Ethereum y BSC',
    'features.commission_free': 'SIN COMISIONES',
    'features.commission_desc': 'Tus donaciones van directamente a los creadores de campañas, sin comisiones',
    'features.fast_easy': 'RÁPIDO Y FÁCIL',
    'features.fast_desc': 'Conecta tu billetera y crea campañas o dona en minutos',
    
    // Footer
    'footer.platform': 'PLATAFORMA',
    'footer.support': 'SOPORTE',
    'footer.connection': 'CONEXIÓN',
    'footer.how_it_works': 'CÓMO FUNCIONA',
    'footer.security': 'SEGURIDAD',
    'footer.faq': 'PREGUNTAS FRECUENTES',
    'footer.rights': 'TODOS LOS DERECHOS RESERVADOS',
    'footer.description': 'Plataforma de donaciones segura y transparente con tecnología blockchain futurista',
  },
  fr: {
    // Header & Navigation
    'duxxan': 'DUXXAN',
    'campaigns': 'CAMPAGNES',
    'funds': 'FONDS',
    'donations': 'DONATIONS',
    'profile': 'PROFIL',
    'connect_wallet': 'CONNECTER PORTEFEUILLE',
    'disconnect': 'DÉCONNECTER',
    
    // Hero Section
    'hero.title': 'PLATEFORME DE DONATION BLOCKCHAIN NOUVELLE GÉNÉRATION',
    'hero.subtitle': 'Donations sans commission avec technologie futuriste. Transferts directs portefeuille à portefeuille sur les réseaux Ethereum et BSC.',
    'hero.explore_campaigns': 'EXPLORER LES CAMPAGNES',
    'hero.create_campaign': 'CRÉER UNE CAMPAGNE',
    
    // Daily Rewards
    'daily.title': 'RÉCOMPENSES QUOTIDIENNES TETHER',
    'daily.description': 'Participez quotidiennement et obtenez une chance de gagner des récompenses USDT. Récompenses quotidiennes distribuées à notre communauté futuriste!',
    'daily.connect_wallet': 'Connectez votre portefeuille pour participer aux récompenses quotidiennes',
    'daily.participate_today': 'PARTICIPER AUJOURD\'HUI',
    'daily.yesterday_winners': 'GAGNANTS D\'HIER',
    'daily.no_winners': 'PAS ENCORE DE GAGNANTS',
    'daily.be_first': 'Soyez le premier à participer!',
    'daily.participation_process': 'PROCESSUS DE PARTICIPATION',
    'daily.step1': 'Connecter Portefeuille',
    'daily.step2': 'Cliquer Bouton',
    'daily.step3': 'Gagner Récompense',
    
    // Statistics
    'stats.total_rewards': 'Récompenses Totales',
    'stats.hours_active': 'Heures Actif',
    'stats.secure': 'Sécurisé',
    
    // Popular Campaigns
    'popular.title': 'CAMPAGNES POPULAIRES',
    'popular.subtitle': 'Découvrez et soutenez des projets fiables à fort impact avec la technologie futuriste',
    'popular.no_campaigns': 'PAS ENCORE DE CAMPAGNES POPULAIRES',
    'popular.create_first': 'Créez la première campagne et faites la différence',
    'popular.view_all': 'VOIR TOUTES LES CAMPAGNES',
    
    // Features Section
    'features.why_title': 'POURQUOI DUXXAN ?',
    'features.subtitle': 'Expérience de don sécurisée et transparente avec la technologie blockchain futuriste',
    'features.blockchain_security': 'SÉCURITÉ BLOCKCHAIN',
    'features.blockchain_desc': 'Transactions 100% sécurisées avec des contrats intelligents sur les réseaux Ethereum et BSC',
    'features.commission_free': 'SANS COMMISSION',
    'features.commission_desc': 'Vos dons vont directement aux créateurs de campagnes, aucune commission prélevée',
    'features.fast_easy': 'RAPIDE ET FACILE',
    'features.fast_desc': 'Connectez votre portefeuille et créez des campagnes ou donnez en minutes',
    
    // Footer
    'footer.platform': 'PLATEFORME',
    'footer.support': 'SUPPORT',
    'footer.connection': 'CONNEXION',
    'footer.how_it_works': 'COMMENT ÇA MARCHE',
    'footer.security': 'SÉCURITÉ',
    'footer.faq': 'FAQ',
    'footer.rights': 'TOUS DROITS RÉSERVÉS',
    'footer.description': 'Plateforme de donation sécurisée et transparente avec technologie blockchain futuriste',
  },
  de: {
    // Header & Navigation
    'duxxan': 'DUXXAN',
    'campaigns': 'KAMPAGNEN',
    'funds': 'FONDS',
    'donations': 'SPENDEN',
    'profile': 'PROFIL',
    'connect_wallet': 'WALLET VERBINDEN',
    'disconnect': 'TRENNEN',
    
    // Hero Section
    'hero.title': 'NEXT-GEN BLOCKCHAIN SPENDEN PLATTFORM',
    'hero.subtitle': 'Provisionsfreie Spenden mit futuristischer Technologie. Direkte Wallet-zu-Wallet Transfers auf Ethereum und BSC Netzwerken.',
    'hero.explore_campaigns': 'KAMPAGNEN ERKUNDEN',
    'hero.create_campaign': 'KAMPAGNE ERSTELLEN',
    
    // Daily Rewards
    'daily.title': 'TÄGLICHE TETHER BELOHNUNGEN',
    'daily.description': 'Nimm täglich teil und erhalte die Chance, USDT-Belohnungen zu gewinnen. Tägliche Belohnungen für unsere futuristische Gemeinschaft!',
    'daily.connect_wallet': 'Verbinde deine Wallet, um an täglichen Belohnungen teilzunehmen',
    'daily.participate_today': 'HEUTE TEILNEHMEN',
    'daily.yesterday_winners': 'GESTRIGE GEWINNER',
    'daily.no_winners': 'NOCH KEINE GEWINNER',
    'daily.be_first': 'Sei der erste Teilnehmer!',
    'daily.participation_process': 'TEILNAHMEPROZESS',
    'daily.step1': 'Wallet Verbinden',
    'daily.step2': 'Button Klicken',
    'daily.step3': 'Belohnung Gewinnen',
    
    // Statistics
    'stats.total_rewards': 'Gesamt Belohnungen',
    'stats.hours_active': 'Stunden Aktiv',
    'stats.secure': 'Sicher',
    
    // Popular Campaigns
    'popular.title': 'BELIEBTE KAMPAGNEN',
    'popular.subtitle': 'Entdecke und unterstütze vertrauenswürdige Projekte mit hoher Wirkung und futuristischer Technologie',
    'popular.no_campaigns': 'NOCH KEINE BELIEBTEN KAMPAGNEN',
    'popular.create_first': 'Erstelle die erste Kampagne und mache einen Unterschied',
    'popular.view_all': 'ALLE KAMPAGNEN ANZEIGEN',
    
    // Features Section
    'features.why_title': 'WARUM DUXXAN?',
    'features.subtitle': 'Sichere und transparente Spendenerfahrung mit futuristischer Blockchain-Technologie',
    'features.blockchain_security': 'BLOCKCHAIN SICHERHEIT',
    'features.blockchain_desc': '100% sichere Transaktionen mit Smart Contracts auf Ethereum und BSC Netzwerken',
    'features.commission_free': 'PROVISIONSFREI',
    'features.commission_desc': 'Ihre Spenden gehen direkt an Kampagnenersteller, keine Provisionen werden abgezogen',
    'features.fast_easy': 'SCHNELL & EINFACH',
    'features.fast_desc': 'Verbinden Sie Ihr Wallet und erstellen Sie Kampagnen oder spenden Sie innerhalb von Minuten',
    
    // Footer
    'footer.platform': 'PLATTFORM',
    'footer.support': 'UNTERSTÜTZUNG',
    'footer.connection': 'VERBINDUNG',
    'footer.how_it_works': 'WIE ES FUNKTIONIERT',
    'footer.security': 'SICHERHEIT',
    'footer.faq': 'FAQ',
    'footer.rights': 'ALLE RECHTE VORBEHALTEN',
    'footer.description': 'Sichere und transparente Spenden-Plattform mit futuristischer Blockchain-Technologie',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};