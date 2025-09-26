import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { 
  Heart, 
  Shield, 
  Zap, 
  Users, 
  FileText, 
  Newspaper, 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  BookOpen, 
  Code, 
  Lock,
  Scale,
  UserCheck,
  AlertTriangle,
  Building2,
  Lightbulb,
  Briefcase
} from 'lucide-react';

// Centralized bilingual content registry
const PAGES_CONTENT = {
  about: {
    en: {
      title: "About DUXXAN",
      subtitle: "Next-generation blockchain donation platform",
      description: "Revolutionizing charitable giving with transparent, secure, and commission-free donations",
      sections: [
        {
          title: "Our Story",
          content: "DUXXAN was founded with a simple yet powerful vision: to make charitable giving more transparent, efficient, and accessible through blockchain technology. We believe that every donation should reach its intended recipient without unnecessary fees or delays.",
        },
        {
          title: "Our Values",
          content: "Transparency, security, and accessibility are at the core of everything we do. We leverage Ethereum and BSC blockchain networks to ensure every transaction is verifiable and traceable, building trust between donors and recipients.",
        },
        {
          title: "Global Impact",
          content: "Since our inception, DUXXAN has facilitated thousands of donations worldwide, connecting generous donors with meaningful causes across the globe. Our platform enables anyone to create campaigns and receive support from a global community.",
        }
      ]
    },
    tr: {
      title: "DUXXAN Hakkında",
      subtitle: "Yeni nesil blockchain bağış platformu",
      description: "Şeffaf, güvenli ve komisyonsuz bağışlarla hayırseverlik dünyasında devrim yaratıyoruz",
      sections: [
        {
          title: "Hikayemiz",
          content: "DUXXAN, basit ama güçlü bir vizyonla kuruldu: blockchain teknolojisi aracılığıyla hayırseverlik faaliyetlerini daha şeffaf, verimli ve erişilebilir hale getirmek. Her bağışın gereksiz ücretler veya gecikmeler olmadan hedeflenen alıcıya ulaşması gerektiğine inanıyoruz.",
        },
        {
          title: "Değerlerimiz",
          content: "Şeffaflık, güvenlik ve erişilebilirlik yaptığımız her şeyin merkezindedir. Her işlemin doğrulanabilir ve izlenebilir olmasını sağlamak için Ethereum ve BSC blockchain ağlarını kullanarak bağışçılar ve alıcılar arasında güven inşa ediyoruz.",
        },
        {
          title: "Küresel Etki",
          content: "Kuruluşumuzdan bu yana DUXXAN, dünya çapında binlerce bağışı kolaylaştırarak cömert bağışçıları küresel düzeyde anlamlı davalarla buluşturdu. Platformumuz herkesin kampanya oluşturmasını ve küresel bir topluluktan destek almasını sağlar.",
        }
      ]
    }
  },
  mission: {
    en: {
      title: "Our Mission",
      subtitle: "Empowering positive change through blockchain technology",
      description: "Creating a transparent and efficient ecosystem for charitable giving worldwide",
      sections: [
        {
          title: "Transparency First",
          content: "Every donation on DUXXAN is recorded on the blockchain, providing complete transparency and traceability. Donors can track their contributions and see exactly how their funds are being used.",
        },
        {
          title: "Zero Commission",
          content: "We believe 100% of donations should reach their intended recipients. That's why we operate on a commission-free model, generating revenue through account activation fees rather than taking a cut from donations.",
        },
        {
          title: "Global Accessibility",
          content: "Our platform breaks down geographical barriers, enabling anyone with an internet connection to donate to causes they care about or create campaigns for support, regardless of their location.",
        }
      ]
    },
    tr: {
      title: "Misyonumuz",
      subtitle: "Blockchain teknolojisiyle pozitif değişimi güçlendirmek",
      description: "Dünya çapında hayırseverlik için şeffaf ve verimli bir ekosistem yaratmak",
      sections: [
        {
          title: "Önce Şeffaflık",
          content: "DUXXAN'daki her bağış blockchain'e kaydedilir, tam şeffaflık ve izlenebilirlik sağlar. Bağışçılar katkılarını takip edebilir ve fonlarının tam olarak nasıl kullanıldığını görebilir.",
        },
        {
          title: "Sıfır Komisyon",
          content: "Bağışların %100'ünün hedeflenen alıcılara ulaşması gerektiğine inanıyoruz. Bu nedenle komisyonsuz bir modelle çalışıyor, bağışlardan pay almak yerine hesap aktivasyon ücretleri ile gelir elde ediyoruz.",
        },
        {
          title: "Küresel Erişilebilirlik",
          content: "Platformumuz coğrafi engelleri kaldırır, internet bağlantısı olan herkesin konumuna bakılmaksızın önemsediği davalara bağış yapmasını veya destek için kampanyalar oluşturmasını sağlar.",
        }
      ]
    }
  },
  technology: {
    en: {
      title: "Blockchain Technology",
      subtitle: "Powered by Ethereum and BSC networks",
      description: "Leveraging cutting-edge blockchain technology for secure and transparent donations",
      sections: [
        {
          title: "Multi-Chain Support",
          content: "DUXXAN operates on both Ethereum Mainnet and Binance Smart Chain (BSC), providing users with flexibility in choosing their preferred network based on transaction costs and speed requirements.",
        },
        {
          title: "Smart Contract Security",
          content: "Our platform utilizes audited smart contracts to ensure the security and integrity of all transactions. Every donation is processed through verified contracts that eliminate the possibility of fraud or manipulation.",
        },
        {
          title: "USDT Integration",
          content: "We support USDT (Tether) transactions on both networks, providing price stability and reducing volatility concerns for donors and campaign creators. All platform fees are collected in USDT for transparency.",
        }
      ]
    },
    tr: {
      title: "Blockchain Teknolojisi",
      subtitle: "Ethereum ve BSC ağları ile güçlendirilmiş",
      description: "Güvenli ve şeffaf bağışlar için en son blockchain teknolojisini kullanıyoruz",
      sections: [
        {
          title: "Çoklu Zincir Desteği",
          content: "DUXXAN hem Ethereum Mainnet hem de Binance Smart Chain (BSC) üzerinde çalışır, kullanıcılara işlem maliyetleri ve hız gereksinimlerine göre tercih ettikleri ağı seçme esnekliği sağlar.",
        },
        {
          title: "Akıllı Kontrat Güvenliği",
          content: "Platformumuz tüm işlemlerin güvenliğini ve bütünlüğünü sağlamak için denetlenmiş akıllı kontratlar kullanır. Her bağış, dolandırıcılık veya manipülasyon olasılığını ortadan kaldıran doğrulanmış kontratlar aracılığıyla işlenir.",
        },
        {
          title: "USDT Entegrasyonu",
          content: "Her iki ağda da USDT (Tether) işlemlerini destekleyerek fiyat istikrarı sağlıyor ve bağışçılar ile kampanya oluşturanlar için volatilite endişelerini azaltıyoruz. Tüm platform ücretleri şeffaflık için USDT olarak tahsil edilir.",
        }
      ]
    }
  },
  careers: {
    en: {
      title: "Careers",
      subtitle: "Join our mission to revolutionize charitable giving",
      description: "Be part of a team that's making a positive impact on the world through blockchain technology",
      sections: [
        {
          title: "Why DUXXAN?",
          content: "Work on meaningful projects that directly impact charitable giving worldwide. Join a team of passionate individuals who believe in transparency, innovation, and social good. We offer competitive compensation, flexible work arrangements, and the opportunity to shape the future of blockchain philanthropy.",
        },
        {
          title: "Open Positions",
          content: "We're always looking for talented individuals in blockchain development, frontend/backend engineering, product management, marketing, and customer support. Check back regularly for new opportunities or reach out to us directly.",
        },
        {
          title: "Company Culture",
          content: "Our culture is built on transparency, collaboration, and continuous learning. We encourage innovation, support work-life balance, and believe that diverse perspectives make us stronger. Remote work is supported with regular team meetups.",
        }
      ]
    },
    tr: {
      title: "Kariyer",
      subtitle: "Hayırseverlikte devrim yapma misyonumuza katılın",
      description: "Blockchain teknolojisi ile dünyada pozitif etki yaratan ekibin bir parçası olun",
      sections: [
        {
          title: "Neden DUXXAN?",
          content: "Dünya çapında hayırseverlik faaliyetlerini doğrudan etkileyen anlamlı projelerde çalışın. Şeffaflık, yenilik ve toplumsal fayda konularında tutkulu bireylerden oluşan bir ekibe katılın. Rekabetçi maaş, esnek çalışma düzenlemeleri ve blockchain hayırseverliğinin geleceğini şekillendirme fırsatı sunuyoruz.",
        },
        {
          title: "Açık Pozisyonlar",
          content: "Blockchain geliştirme, frontend/backend mühendisliği, ürün yönetimi, pazarlama ve müşteri desteği alanlarında yetenekli bireyler arıyoruz. Yeni fırsatlar için düzenli olarak kontrol edin veya doğrudan bizimle iletişime geçin.",
        },
        {
          title: "Şirket Kültürü",
          content: "Kültürümüz şeffaflık, işbirliği ve sürekli öğrenme üzerine kuruludur. Yeniliği teşvik ediyor, iş-yaşam dengesini destekliyor ve çeşitli bakış açılarının bizi güçlendirdiğine inanıyoruz. Düzenli ekip buluşmaları ile uzaktan çalışma desteklenir.",
        }
      ]
    }
  },
  press: {
    en: {
      title: "Press Kit",
      subtitle: "Media resources and company information",
      description: "Everything media professionals need to cover DUXXAN accurately",
      sections: [
        {
          title: "Company Overview",
          content: "DUXXAN is a next-generation blockchain donation platform that enables transparent, secure, and commission-free charitable giving. Founded in 2024, we operate on Ethereum and BSC networks, facilitating direct donations to campaign creators worldwide.",
        },
        {
          title: "Key Statistics",
          content: "Platform supports campaigns in multiple categories, processes donations in USDT for stability, operates with zero commission on donations, and maintains a global user base across multiple continents. All transactions are blockchain-verified for transparency.",
        },
        {
          title: "Media Contact",
          content: "For press inquiries, interviews, or additional information, please contact our media relations team. We're always happy to discuss our technology, mission, and the future of blockchain-powered philanthropy.",
        }
      ]
    },
    tr: {
      title: "Basın Kiti",
      subtitle: "Medya kaynakları ve şirket bilgileri",
      description: "Medya profesyonellerinin DUXXAN'ı doğru şekilde ele alması için gereken her şey",
      sections: [
        {
          title: "Şirket Genel Bakış",
          content: "DUXXAN, şeffaf, güvenli ve komisyonsuz hayırseverlik faaliyetlerini mümkün kılan yeni nesil bir blockchain bağış platformudur. 2024'te kurulan şirketimiz, Ethereum ve BSC ağlarında faaliyet göstererek dünya çapında kampanya oluşturanlara doğrudan bağışları kolaylaştırır.",
        },
        {
          title: "Önemli İstatistikler",
          content: "Platform birden fazla kategoride kampanyaları destekler, istikrar için USDT'de bağışları işler, bağışlarda sıfır komisyonla çalışır ve birden fazla kıtada küresel kullanıcı tabanı bulundurur. Tüm işlemler şeffaflık için blockchain ile doğrulanır.",
        },
        {
          title: "Medya İletişim",
          content: "Basın sorguları, röportajlar veya ek bilgi için lütfen medya ilişkileri ekibimizle iletişime geçin. Teknolojimizi, misyonumuzu ve blockchain destekli hayırseverliğin geleceğini tartışmaktan her zaman memnuniyet duyarız.",
        }
      ]
    }
  },
  news: {
    en: {
      title: "News & Updates",
      subtitle: "Latest developments and announcements",
      description: "Stay informed about DUXXAN's progress and blockchain philanthropy industry news",
      sections: [
        {
          title: "Platform Updates",
          content: "Regular updates about new features, improved functionality, and platform enhancements. We continuously evolve our platform based on user feedback and technological advances in the blockchain space.",
        },
        {
          title: "Industry Insights",
          content: "Analysis and commentary on the blockchain philanthropy industry, regulatory developments, and emerging trends that affect charitable giving and donor transparency.",
        },
        {
          title: "Community Highlights",
          content: "Success stories from our community, featured campaigns, and impact reports that showcase how DUXXAN is making a difference in charitable giving worldwide.",
        }
      ]
    },
    tr: {
      title: "Haberler ve Güncellemeler",
      subtitle: "En son gelişmeler ve duyurular",
      description: "DUXXAN'ın ilerlemesi ve blockchain hayırseverlik sektörü haberleri hakkında bilgi sahibi olun",
      sections: [
        {
          title: "Platform Güncellemeleri",
          content: "Yeni özellikler, geliştirilmiş işlevsellik ve platform iyileştirmeleri hakkında düzenli güncellemeler. Blockchain alanındaki kullanıcı geri bildirimlerine ve teknolojik ilerlemelere dayalı olarak platformumuzu sürekli geliştiriyoruz.",
        },
        {
          title: "Sektör Görüşleri",
          content: "Blockchain hayırseverlik sektörü, düzenleyici gelişmeler ve hayırseverlik faaliyetleri ile bağışçı şeffaflığını etkileyen yeni trendler hakkında analiz ve yorumlar.",
        },
        {
          title: "Topluluk Öne Çıkanları",
          content: "Topluluğumuzdan başarı hikayeleri, öne çıkan kampanyalar ve DUXXAN'ın dünya çapında hayırseverlik faaliyetlerinde nasıl fark yarattığını gösteren etki raporları.",
        }
      ]
    }
  },
  help: {
    en: {
      title: "Help Center",
      subtitle: "Get support and find answers to common questions",
      description: "Comprehensive help documentation for using the DUXXAN platform",
      sections: [
        {
          title: "Getting Started",
          content: "Learn how to connect your wallet, activate your account, and start donating or creating campaigns. Our step-by-step guides will help you navigate the platform with confidence.",
        },
        {
          title: "Account Management",
          content: "Understand how to manage your DUXXAN account, including wallet connections, account activation with USDT payments, and profile settings. Learn about our multi-chain support and network switching.",
        },
        {
          title: "Troubleshooting",
          content: "Common issues and their solutions, including wallet connection problems, transaction failures, and platform navigation. If you can't find your answer here, contact our support team.",
        }
      ]
    },
    tr: {
      title: "Yardım Merkezi",
      subtitle: "Destek alın ve sık sorulan soruların cevaplarını bulun",
      description: "DUXXAN platformunu kullanmak için kapsamlı yardım dokümantasyonu",
      sections: [
        {
          title: "Başlangıç",
          content: "Cüzdanınızı nasıl bağlayacağınızı, hesabınızı nasıl aktive edeceğinizi ve bağış yapmaya veya kampanya oluşturmaya nasıl başlayacağınızı öğrenin. Adım adım kılavuzlarımız platformda güvenle gezinmenize yardımcı olacak.",
        },
        {
          title: "Hesap Yönetimi",
          content: "Cüzdan bağlantıları, USDT ödemeleri ile hesap aktivasyonu ve profil ayarları dahil olmak üzere DUXXAN hesabınızı nasıl yöneteceğinizi anlayın. Çoklu zincir desteğimiz ve ağ değiştirme hakkında bilgi edinin.",
        },
        {
          title: "Sorun Giderme",
          content: "Cüzdan bağlantı sorunları, işlem hataları ve platform navigasyonu dahil olmak üzere yaygın sorunlar ve çözümleri. Cevabınızı burada bulamazsanız, destek ekibimizle iletişime geçin.",
        }
      ]
    }
  },
  faq: {
    en: {
      title: "Frequently Asked Questions",
      subtitle: "Quick answers to common questions about DUXXAN",
      description: "Find instant answers to the most common questions about our platform",
      sections: [
        {
          title: "Platform Basics",
          content: "What is DUXXAN? How does blockchain donation work? What wallets are supported? Why do I need to activate my account? How much does account activation cost?",
        },
        {
          title: "Donations & Campaigns",
          content: "How do I create a campaign? What types of campaigns are allowed? How are donations processed? Can I track my donations? What are the platform fees?",
        },
        {
          title: "Technical Support",
          content: "Which blockchain networks are supported? What tokens can I use? How do I switch between networks? Why did my transaction fail? How long do transactions take?",
        }
      ]
    },
    tr: {
      title: "Sıkça Sorulan Sorular",
      subtitle: "DUXXAN hakkında sık sorulan soruların hızlı cevapları",
      description: "Platformumuz hakkında en sık sorulan soruların anında cevaplarını bulun",
      sections: [
        {
          title: "Platform Temelleri",
          content: "DUXXAN nedir? Blockchain bağışı nasıl çalışır? Hangi cüzdanlar desteklenir? Hesabımı neden aktive etmem gerekiyor? Hesap aktivasyonu ne kadar tutar?",
        },
        {
          title: "Bağışlar ve Kampanyalar",
          content: "Nasıl kampanya oluşturabilirim? Hangi tür kampanyalara izin verilir? Bağışlar nasıl işlenir? Bağışlarımı takip edebilir miyim? Platform ücretleri nelerdir?",
        },
        {
          title: "Teknik Destek",
          content: "Hangi blockchain ağları desteklenir? Hangi token'ları kullanabilirim? Ağlar arasında nasıl geçiş yaparım? İşlemim neden başarısız oldu? İşlemler ne kadar sürer?",
        }
      ]
    }
  },
  contact: {
    en: {
      title: "Contact Us",
      subtitle: "Get in touch with our team",
      description: "We're here to help with any questions or support needs",
      sections: [
        {
          title: "Support Channels",
          content: "Reach out to us through multiple channels: email support for general inquiries, community forums for peer-to-peer help, and social media for quick updates. Our team typically responds within 24 hours.",
        },
        {
          title: "Business Inquiries",
          content: "For partnerships, press inquiries, or business development opportunities, please contact our business development team. We're always interested in collaborating with organizations that share our mission.",
        },
        {
          title: "Technical Support",
          content: "Experiencing technical issues? Our technical support team can help with wallet connections, transaction problems, and platform-related questions. Please include relevant transaction hashes when reporting issues.",
        }
      ]
    },
    tr: {
      title: "İletişim",
      subtitle: "Ekibimizle iletişime geçin",
      description: "Herhangi bir soru veya destek ihtiyacınız için buradayız",
      sections: [
        {
          title: "Destek Kanalları",
          content: "Birden fazla kanal aracılığıyla bize ulaşın: genel sorular için e-posta desteği, eşler arası yardım için topluluk forumları ve hızlı güncellemeler için sosyal medya. Ekibimiz genellikle 24 saat içinde yanıt verir.",
        },
        {
          title: "İş Sorguları",
          content: "Ortaklıklar, basın sorguları veya iş geliştirme fırsatları için lütfen iş geliştirme ekibimizle iletişime geçin. Misyonumuzu paylaşan kuruluşlarla işbirliği yapmakla her zaman ilgileniyoruz.",
        },
        {
          title: "Teknik Destek",
          content: "Teknik sorunlar mı yaşıyorsunuz? Teknik destek ekibimiz cüzdan bağlantıları, işlem sorunları ve platformla ilgili sorularda yardımcı olabilir. Sorunları bildirirken lütfen ilgili işlem hash'lerini ekleyin.",
        }
      ]
    }
  },
  docs: {
    en: {
      title: "Documentation",
      subtitle: "Complete guide to using DUXXAN",
      description: "Comprehensive documentation for users, developers, and partners",
      sections: [
        {
          title: "User Guide",
          content: "Step-by-step instructions for connecting wallets, activating accounts, creating campaigns, making donations, and participating in daily rewards. Includes screenshots and best practices for optimal platform usage.",
        },
        {
          title: "Platform Features",
          content: "Detailed explanations of all platform features including campaign types (donation vs funding), multi-chain support, credit card payments, daily rewards system, and account management tools.",
        },
        {
          title: "Security & Best Practices",
          content: "Important security guidelines for protecting your wallet and funds, understanding blockchain transactions, gas fees, and safe donation practices. Learn how to verify transactions and avoid common pitfalls.",
        }
      ]
    },
    tr: {
      title: "Dokümantasyon",
      subtitle: "DUXXAN kullanım kılavuzu",
      description: "Kullanıcılar, geliştiriciler ve ortaklar için kapsamlı dokümantasyon",
      sections: [
        {
          title: "Kullanıcı Kılavuzu",
          content: "Cüzdanları bağlamak, hesapları aktive etmek, kampanyalar oluşturmak, bağış yapmak ve günlük ödüllere katılmak için adım adım talimatlar. Optimum platform kullanımı için ekran görüntüleri ve en iyi uygulamaları içerir.",
        },
        {
          title: "Platform Özellikleri",
          content: "Kampanya türleri (bağış vs finansman), çoklu zincir desteği, kredi kartı ödemeleri, günlük ödül sistemi ve hesap yönetim araçları dahil olmak üzere tüm platform özelliklerinin detaylı açıklamaları.",
        },
        {
          title: "Güvenlik ve En İyi Uygulamalar",
          content: "Cüzdanınızı ve fonlarınızı korumak, blockchain işlemlerini anlama, gaz ücretleri ve güvenli bağış uygulamaları için önemli güvenlik kılavuzları. İşlemleri nasıl doğrulayacağınızı ve yaygın tuzaklardan nasıl kaçınacağınızı öğrenin.",
        }
      ]
    }
  },
  "api-docs": {
    en: {
      title: "API Documentation",
      subtitle: "Developer resources and API reference",
      description: "Technical documentation for developers integrating with DUXXAN",
      sections: [
        {
          title: "API Overview",
          content: "DUXXAN provides RESTful APIs for accessing campaign data, donation information, and platform statistics. All endpoints return JSON responses and support CORS for web applications.",
        },
        {
          title: "Available Endpoints",
          content: "Key endpoints include: GET /api/get-campaigns (public campaigns), GET /api/get-popular-campaigns (featured campaigns), GET /api/settings-map (platform settings), GET /api/footer-links (footer navigation), and GET /api/get-last-winners (daily reward winners).",
        },
        {
          title: "Authentication & Rate Limits",
          content: "Public endpoints require no authentication. Rate limiting is applied to prevent abuse. For higher rate limits or private endpoints, contact our development team for API key access.",
        }
      ]
    },
    tr: {
      title: "API Dokümantasyonu",
      subtitle: "Geliştirici kaynakları ve API referansı",
      description: "DUXXAN ile entegrasyon yapan geliştiriciler için teknik dokümantasyon",
      sections: [
        {
          title: "API Genel Bakış",
          content: "DUXXAN, kampanya verilerine, bağış bilgilerine ve platform istatistiklerine erişim için RESTful API'ler sağlar. Tüm endpoint'ler JSON yanıtları döndürür ve web uygulamaları için CORS'u destekler.",
        },
        {
          title: "Mevcut Endpoint'ler",
          content: "Temel endpoint'ler şunları içerir: GET /api/get-campaigns (herkese açık kampanyalar), GET /api/get-popular-campaigns (öne çıkan kampanyalar), GET /api/settings-map (platform ayarları), GET /api/footer-links (footer navigasyonu) ve GET /api/get-last-winners (günlük ödül kazananları).",
        },
        {
          title: "Kimlik Doğrulama ve Oran Sınırları",
          content: "Herkese açık endpoint'ler kimlik doğrulama gerektirmez. Kötüye kullanımı önlemek için oran sınırlaması uygulanır. Daha yüksek oran sınırları veya özel endpoint'ler için API anahtarı erişimi için geliştirme ekibimizle iletişime geçin.",
        }
      ]
    }
  },
  security: {
    en: {
      title: "Security",
      subtitle: "Platform security and user protection",
      description: "Comprehensive security measures to protect users and their funds",
      sections: [
        {
          title: "Blockchain Security",
          content: "All transactions are processed through audited smart contracts on Ethereum and BSC networks. Funds are transferred directly between wallets without platform custody, eliminating counterparty risk and ensuring maximum security.",
        },
        {
          title: "User Safety",
          content: "Always verify transaction details before confirming. Never share your private keys or seed phrases. Use official platform URLs only. Be cautious of phishing attempts and always double-check recipient addresses.",
        },
        {
          title: "Reporting Vulnerabilities",
          content: "We take security seriously and encourage responsible disclosure of any vulnerabilities. Contact our security team privately to report issues. We appreciate the security community's efforts to keep our platform safe.",
        }
      ]
    },
    tr: {
      title: "Güvenlik",
      subtitle: "Platform güvenliği ve kullanıcı koruması",
      description: "Kullanıcıları ve fonlarını korumak için kapsamlı güvenlik önlemleri",
      sections: [
        {
          title: "Blockchain Güvenliği",
          content: "Tüm işlemler Ethereum ve BSC ağlarında denetlenmiş akıllı kontratlar aracılığıyla işlenir. Fonlar platform velayeti olmadan doğrudan cüzdanlar arasında transfer edilir, karşı taraf riskini ortadan kaldırır ve maksimum güvenlik sağlar.",
        },
        {
          title: "Kullanıcı Güvenliği",
          content: "Onaylamadan önce her zaman işlem detaylarını doğrulayın. Özel anahtarlarınızı veya seed ifadelerinizi asla paylaşmayın. Yalnızca resmi platform URL'lerini kullanın. Phishing girişimlerine karşı dikkatli olun ve alıcı adreslerini her zaman iki kez kontrol edin.",
        },
        {
          title: "Güvenlik Açıkları Bildirimi",
          content: "Güvenliği ciddiye alıyoruz ve herhangi bir güvenlik açığının sorumlu bir şekilde bildirilmesini teşvik ediyoruz. Sorunları bildirmek için güvenlik ekibimizle özel olarak iletişime geçin. Platformumuzu güvende tutmak için güvenlik topluluğunun çabalarını takdir ediyoruz.",
        }
      ]
    }
  },
  terms: {
    en: {
      title: "Terms of Service",
      subtitle: "Terms and conditions for using DUXXAN",
      description: "Legal terms governing your use of the DUXXAN platform",
      sections: [
        {
          title: "Platform Usage",
          content: "By using DUXXAN, you agree to use the platform for legitimate charitable purposes only. Users must be 18 years or older and comply with applicable laws in their jurisdiction. Account activation requires a one-time USDT payment.",
        },
        {
          title: "Donations & Campaigns",
          content: "All donations are final and irreversible due to blockchain technology. Campaign creators are responsible for accurate information and proper fund usage. DUXXAN does not guarantee campaign success or fund recovery.",
        },
        {
          title: "Liability & Disclaimers",
          content: "DUXXAN provides the platform 'as is' without warranties. Users assume all risks associated with blockchain transactions. We are not liable for network fees, transaction failures, or third-party actions.",
        }
      ]
    },
    tr: {
      title: "Hizmet Koşulları",
      subtitle: "DUXXAN kullanım şartları ve koşulları",
      description: "DUXXAN platformu kullanımınızı düzenleyen yasal koşullar",
      sections: [
        {
          title: "Platform Kullanımı",
          content: "DUXXAN'ı kullanarak platformu yalnızca meşru hayırseverlik amaçları için kullanmayı kabul ediyorsunuz. Kullanıcılar 18 yaş ve üzerinde olmalı ve kendi yargı alanlarındaki geçerli yasalara uymalıdır. Hesap aktivasyonu tek seferlik USDT ödemesi gerektirir.",
        },
        {
          title: "Bağışlar ve Kampanyalar",
          content: "Blockchain teknolojisi nedeniyle tüm bağışlar kesin ve geri alınamaz. Kampanya oluşturanlar doğru bilgi vermek ve fonları uygun şekilde kullanmakla sorumludur. DUXXAN kampanya başarısını veya fon geri alımını garanti etmez.",
        },
        {
          title: "Sorumluluk ve Feragat",
          content: "DUXXAN platformu 'olduğu gibi' garanti vermeden sağlar. Kullanıcılar blockchain işlemleriyle ilgili tüm riskleri üstlenir. Ağ ücretleri, işlem hataları veya üçüncü taraf eylemlerinden sorumlu değiliz.",
        }
      ]
    }
  },
  privacy: {
    en: {
      title: "Privacy Policy",
      subtitle: "How we protect and handle your personal information",
      description: "Our commitment to protecting your privacy and personal data",
      sections: [
        {
          title: "Data Collection",
          content: "We collect minimal personal information necessary for platform operation. This includes wallet addresses for transactions, IP addresses for security, and optional profile information. We never store private keys or sensitive wallet data.",
        },
        {
          title: "Data Usage",
          content: "Your data is used solely for platform functionality, security monitoring, and improving user experience. We do not sell, rent, or share personal information with third parties without explicit consent, except as required by law.",
        },
        {
          title: "Data Protection",
          content: "We implement industry-standard security measures to protect your data. All sensitive information is encrypted in transit and at rest. Users can request data deletion in accordance with applicable privacy laws.",
        }
      ]
    },
    tr: {
      title: "Gizlilik Politikası",
      subtitle: "Kişisel bilgilerinizi nasıl koruduğumuz ve ele aldığımız",
      description: "Gizliliğinizi ve kişisel verilerinizi koruma taahhüdümüz",
      sections: [
        {
          title: "Veri Toplama",
          content: "Platform çalışması için gerekli minimum kişisel bilgileri topluyoruz. Bu işlemler için cüzdan adreslerini, güvenlik için IP adreslerini ve isteğe bağlı profil bilgilerini içerir. Özel anahtarları veya hassas cüzdan verilerini asla saklamayız.",
        },
        {
          title: "Veri Kullanımı",
          content: "Verileriniz yalnızca platform işlevselliği, güvenlik izleme ve kullanıcı deneyimini iyileştirmek için kullanılır. Açık izin olmadan kişisel bilgileri üçüncü taraflarla satmaz, kiraya vermez veya paylaşmayız, yasa gereği olanlar hariç.",
        },
        {
          title: "Veri Koruması",
          content: "Verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz. Tüm hassas bilgiler aktarım sırasında ve dinlenme halinde şifrelenir. Kullanıcılar geçerli gizlilik yasalarına uygun olarak veri silme talebinde bulunabilir.",
        }
      ]
    }
  },
  cookies: {
    en: {
      title: "Cookie Policy",
      subtitle: "How we use cookies and similar technologies",
      description: "Information about our use of cookies and tracking technologies",
      sections: [
        {
          title: "Types of Cookies",
          content: "We use essential cookies for platform functionality, preference cookies to remember your settings (like language selection), and analytics cookies to understand platform usage patterns. No advertising or tracking cookies are used.",
        },
        {
          title: "Managing Cookies",
          content: "You can control cookies through your browser settings. Disabling essential cookies may affect platform functionality. Preference and analytics cookies can be disabled without impacting core features.",
        },
        {
          title: "Third-Party Services",
          content: "Some features may use third-party services (like wallet providers) that have their own cookie policies. We recommend reviewing the privacy policies of services you choose to connect with.",
        }
      ]
    },
    tr: {
      title: "Çerez Politikası",
      subtitle: "Çerezleri ve benzer teknolojileri nasıl kullandığımız",
      description: "Çerez kullanımımız ve izleme teknolojileri hakkında bilgi",
      sections: [
        {
          title: "Çerez Türleri",
          content: "Platform işlevselliği için gerekli çerezler, ayarlarınızı hatırlamak için tercih çerezleri (dil seçimi gibi) ve platform kullanım kalıplarını anlamak için analitik çerezler kullanırız. Reklam veya izleme çerezleri kullanılmaz.",
        },
        {
          title: "Çerez Yönetimi",
          content: "Çerezleri tarayıcı ayarlarınız aracılığıyla kontrol edebilirsiniz. Gerekli çerezleri devre dışı bırakmak platform işlevselliğini etkileyebilir. Tercih ve analitik çerezler temel özellikleri etkilemeden devre dışı bırakılabilir.",
        },
        {
          title: "Üçüncü Taraf Hizmetler",
          content: "Bazı özellikler kendi çerez politikalarına sahip üçüncü taraf hizmetleri (cüzdan sağlayıcıları gibi) kullanabilir. Bağlanmayı seçtiğiniz hizmetlerin gizlilik politikalarını gözden geçirmenizi öneririz.",
        }
      ]
    }
  },
  compliance: {
    en: {
      title: "Compliance",
      subtitle: "Regulatory compliance and legal framework",
      description: "Our commitment to operating within legal and regulatory requirements",
      sections: [
        {
          title: "Regulatory Framework",
          content: "DUXXAN operates in compliance with applicable blockchain and financial regulations. We monitor regulatory developments and adapt our platform accordingly to ensure continued compliance across jurisdictions.",
        },
        {
          title: "AML/KYC Procedures",
          content: "While DUXXAN is a decentralized platform, we implement appropriate Anti-Money Laundering (AML) procedures. Account activation requirements and transaction monitoring help ensure platform integrity and regulatory compliance.",
        },
        {
          title: "Jurisdictional Considerations",
          content: "Users are responsible for complying with laws in their respective jurisdictions. Some features may not be available in certain regions due to local regulations. Contact us if you have specific compliance questions.",
        }
      ]
    },
    tr: {
      title: "Uyumluluk",
      subtitle: "Düzenleyici uyumluluk ve yasal çerçeve",
      description: "Yasal ve düzenleyici gereklilikler dahilinde faaliyet gösterme taahhüdümüz",
      sections: [
        {
          title: "Düzenleyici Çerçeve",
          content: "DUXXAN geçerli blockchain ve finansal düzenlemelere uygun olarak faaliyet gösterir. Düzenleyici gelişmeleri izliyor ve yargı alanları genelinde sürekli uyumluluğu sağlamak için platformumuzu buna göre uyarlıyoruz.",
        },
        {
          title: "AML/KYC Prosedürleri",
          content: "DUXXAN merkezi olmayan bir platform olmasına rağmen, uygun Kara Para Aklamayı Önleme (AML) prosedürlerini uygularız. Hesap aktivasyon gereksinimleri ve işlem izleme platform bütünlüğünü ve düzenleyici uyumluluğu sağlamaya yardımcı olur.",
        },
        {
          title: "Yargı Alanı Hususları",
          content: "Kullanıcılar kendi yargı alanlarındaki yasalara uymakla sorumludur. Yerel düzenlemeler nedeniyle bazı özellikler belirli bölgelerde mevcut olmayabilir. Özel uyumluluk sorularınız varsa bizimle iletişime geçin.",
        }
      ]
    }
  },
  aml: {
    en: {
      title: "AML Policy",
      subtitle: "Anti-Money Laundering procedures and compliance",
      description: "Our commitment to preventing money laundering and maintaining platform integrity",
      sections: [
        {
          title: "AML Framework",
          content: "DUXXAN implements robust Anti-Money Laundering procedures to detect and prevent illicit activities. We monitor transactions for suspicious patterns and maintain records as required by applicable regulations.",
        },
        {
          title: "Suspicious Activity Reporting",
          content: "Users must report any suspicious activities they encounter on the platform. We investigate all reports and take appropriate action, including cooperation with law enforcement when necessary.",
        },
        {
          title: "Transaction Monitoring",
          content: "Automated systems monitor transactions for unusual patterns. Large transactions may require additional verification. We reserve the right to freeze accounts or report suspicious activities to relevant authorities.",
        }
      ]
    },
    tr: {
      title: "AML Politikası",
      subtitle: "Kara para aklamayı önleme prosedürleri ve uyumluluk",
      description: "Kara para aklamayı önleme ve platform bütünlüğünü koruma taahhüdümüz",
      sections: [
        {
          title: "AML Çerçevesi",
          content: "DUXXAN yasadışı faaliyetleri tespit etmek ve önlemek için sağlam Kara Para Aklamayı Önleme prosedürleri uygular. Şüpheli kalıplar için işlemleri izliyor ve geçerli düzenlemelerin gerektirdiği şekilde kayıtları tutuyoruz.",
        },
        {
          title: "Şüpheli Aktivite Bildirimi",
          content: "Kullanıcılar platformda karşılaştıkları şüpheli aktiviteleri bildirmek zorundadır. Tüm raporları araştırıyor ve gerektiğinde kolluk kuvvetleriyle işbirliği dahil olmak üzere uygun önlem alıyoruz.",
        },
        {
          title: "İşlem İzleme",
          content: "Otomatik sistemler olağandışı kalıplar için işlemleri izler. Büyük işlemler ek doğrulama gerektirebilir. Hesapları dondurma veya şüpheli aktiviteleri ilgili otoritelere bildirme hakkını saklı tutarız.",
        }
      ]
    }
  },
  risk: {
    en: {
      title: "Risk Disclosure",
      subtitle: "Important risks associated with blockchain donations",
      description: "Understanding the risks involved in using blockchain technology for charitable giving",
      sections: [
        {
          title: "Blockchain Risks",
          content: "Blockchain transactions are irreversible. Network congestion may cause delays or failed transactions. Gas fees fluctuate based on network demand. Smart contracts, while audited, may contain unknown vulnerabilities.",
        },
        {
          title: "Platform Risks",
          content: "DUXXAN cannot guarantee campaign legitimacy or success. Technical issues may temporarily affect platform availability. Regulatory changes could impact platform operations or availability in certain jurisdictions.",
        },
        {
          title: "Financial Risks",
          content: "Cryptocurrency values are volatile. Never donate more than you can afford to lose. Ensure you understand transaction costs before proceeding. Consider tax implications in your jurisdiction.",
        }
      ]
    },
    tr: {
      title: "Risk Bildirimi",
      subtitle: "Blockchain bağışlarıyla ilgili önemli riskler",
      description: "Hayırseverlik için blockchain teknolojisi kullanımındaki riskleri anlama",
      sections: [
        {
          title: "Blockchain Riskleri",
          content: "Blockchain işlemleri geri alınamaz. Ağ tıkanıklığı gecikmelere veya başarısız işlemlere neden olabilir. Gaz ücretleri ağ talebine göre dalgalanır. Akıllı kontratlar denetlenmiş olsa da bilinmeyen güvenlik açıkları içerebilir.",
        },
        {
          title: "Platform Riskleri",
          content: "DUXXAN kampanya meşruluğunu veya başarısını garanti edemez. Teknik sorunlar platform kullanılabilirliğini geçici olarak etkileyebilir. Düzenleyici değişiklikler platform operasyonlarını veya belirli yargı alanlarındaki kullanılabilirliği etkileyebilir.",
        },
        {
          title: "Finansal Riskler",
          content: "Kripto para değerleri volatildir. Asla kaybetmeyi göze alamayacağınızdan fazla bağış yapmayın. Devam etmeden önce işlem maliyetlerini anladığınızdan emin olun. Yargı alanınızdaki vergi etkilerini düşünün.",
        }
      ]
    }
  }
};

// Generic StaticPage component
interface StaticPageProps {
  pageKey: keyof typeof PAGES_CONTENT;
  icon: React.ComponentType<{ className?: string }>;
}

export function StaticPage({ pageKey, icon: Icon }: StaticPageProps) {
  const { language, t } = useLanguage();
  const content = PAGES_CONTENT[pageKey][language as 'en' | 'tr'];

  useEffect(() => {
    document.title = `${content.title} - ${t('duxxan')}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', content.description);
    }
  }, [content.title, content.description, t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="surface-primary section-spacing">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <Icon className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid={`page-title-${pageKey}`}>
              {content.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              {content.subtitle}
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.description}
            </p>
          </div>
        </section>

        {/* Content Sections */}
        <section className="surface-secondary section-spacing">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {content.sections.map((section, index) => (
                <Card key={index} className="card-standard">
                  <CardHeader>
                    <CardTitle className="text-2xl" data-testid={`section-title-${index}`}>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed" data-testid={`section-content-${index}`}>
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Call to Action */}
            <div className="mt-12 text-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <Button asChild variant="default" data-testid="cta-campaigns">
                  <Link href="/campaigns">{t('campaigns')}</Link>
                </Button>
                <Button asChild variant="outline" data-testid="cta-create">
                  <Link href="/create-campaign">{t('hero.create_campaign')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Page wrapper components
export function AboutPage() {
  return <StaticPage pageKey="about" icon={Heart} />;
}

export function MissionPage() {
  return <StaticPage pageKey="mission" icon={Lightbulb} />;
}

export function TechnologyPage() {
  return <StaticPage pageKey="technology" icon={Zap} />;
}

export function CareersPage() {
  return <StaticPage pageKey="careers" icon={Briefcase} />;
}

export function PressPage() {
  return <StaticPage pageKey="press" icon={Newspaper} />;
}

export function NewsPage() {
  return <StaticPage pageKey="news" icon={FileText} />;
}

export function HelpPage() {
  return <StaticPage pageKey="help" icon={HelpCircle} />;
}

export function FaqPage() {
  return <StaticPage pageKey="faq" icon={MessageCircle} />;
}

export function ContactPage() {
  return <StaticPage pageKey="contact" icon={Phone} />;
}

export function DocsPage() {
  return <StaticPage pageKey="docs" icon={BookOpen} />;
}

export function ApiDocsPage() {
  return <StaticPage pageKey="api-docs" icon={Code} />;
}

export function SecurityPage() {
  return <StaticPage pageKey="security" icon={Shield} />;
}

export function TermsPage() {
  return <StaticPage pageKey="terms" icon={Scale} />;
}

export function PrivacyPage() {
  return <StaticPage pageKey="privacy" icon={Lock} />;
}

export function CookiesPage() {
  return <StaticPage pageKey="cookies" icon={Users} />;
}

export function CompliancePage() {
  return <StaticPage pageKey="compliance" icon={UserCheck} />;
}

export function AmlPage() {
  return <StaticPage pageKey="aml" icon={Building2} />;
}

export function RiskPage() {
  return <StaticPage pageKey="risk" icon={AlertTriangle} />;
}