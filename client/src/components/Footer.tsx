import { Link } from 'wouter';
import { Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  // Fetch footer links from API
  const { data: footerLinks = [], isLoading } = useQuery({
    queryKey: ['/api/footer-links'],
    enabled: true
  });

  // Group footer links by section
  const groupedFooterLinks = footerLinks.reduce((acc: any, link: any) => {
    if (!acc[link.section]) {
      acc[link.section] = [];
    }
    acc[link.section].push(link);
    return acc;
  }, {});

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <footer className="surface-secondary border-t border-border section-spacing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="surface-secondary border-t border-border section-spacing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center border border-border">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground uppercase tracking-wide">{t('duxxan')}</h3>
            </div>
            <p className="text-muted-foreground">
              {t('footer.description')}
            </p>
          </div>
          
          {/* Dynamic Platform Section */}
          {groupedFooterLinks.platform && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.platform')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                {groupedFooterLinks.platform.map((link: any) => (
                  <li key={link.id}>
                    <Link 
                      href={link.url} 
                      className="hover:text-primary transition-colors text-sm"
                      data-testid={`footer-platform-${link.id}`}
                      onClick={scrollToTop}
                    >
                      {t(`footer.${link.title.toLowerCase()}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Dynamic Company Section */}
          {groupedFooterLinks.company && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.company')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                {groupedFooterLinks.company.map((link: any) => (
                  <li key={link.id}>
                    <Link 
                      href={link.url} 
                      className="hover:text-primary transition-colors text-sm"
                      data-testid={`footer-company-${link.id}`}
                      onClick={scrollToTop}
                    >
                      {t(`footer.${link.title.toLowerCase()}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Dynamic Support Section */}
          {groupedFooterLinks.support && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.support')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                {groupedFooterLinks.support.map((link: any) => (
                  <li key={link.id}>
                    <Link 
                      href={link.url} 
                      className="hover:text-primary transition-colors text-sm"
                      data-testid={`footer-support-${link.id}`}
                      onClick={scrollToTop}
                    >
                      {t(`footer.${link.title.toLowerCase()}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Dynamic Legal Section */}
          {groupedFooterLinks.legal && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-muted-foreground">
                {groupedFooterLinks.legal.map((link: any) => (
                  <li key={link.id}>
                    <Link 
                      href={link.url} 
                      className="hover:text-primary transition-colors text-sm"
                      data-testid={`footer-legal-${link.id}`}
                      onClick={scrollToTop}
                    >
                      {t(`footer.${link.title.toLowerCase()}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Dynamic Community Section */}
          {groupedFooterLinks.community && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground uppercase tracking-wide">{t('footer.community')}</h4>
              <div className="flex flex-wrap gap-3">
                {groupedFooterLinks.community.map((link: any) => (
                  <Link 
                    key={link.id}
                    href={link.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:border-primary border border-border transition-colors hover:bg-primary/10"
                    data-testid={`footer-community-${link.id}`}
                    onClick={scrollToTop}
                  >
                    <span className="text-xs font-semibold text-primary">{link.title.charAt(0)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2025 {t('duxxan')}. {t('footer.rights')}.</p>
        </div>
      </div>
    </footer>
  );
}