import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation('navigation');
  
  const footerSections = [
    {
      title: t('footer.platform'),
      links: [
        t('footer.findJobs'),
        t('footer.postJob'),
        t('footer.issueCertificates'),
        t('footer.publicDashboard'),
        t('footer.mobileApp')
      ]
    },
    {
      title: t('footer.resources'),
      links: [
        t('footer.helpCenter'),
        t('footer.careerGuides'),
        t('footer.skillDevelopment'),
        t('footer.interviewTips'),
        t('footer.resumeBuilder')
      ]
    },
    {
      title: t('footer.company'),
      links: [
        t('footer.aboutUs'),
        t('footer.career'),
        t('footer.press'),
        t('footer.partnerWithUs'),
        t('footer.investorRelations')
      ]
    },
    {
      title: t('footer.legal'),
      links: [
        t('footer.termsConditions'),
        t('footer.privacyPolicy'),
        t('footer.cookiePolicy'),
        t('footer.dataProtection'),
        t('footer.accessibility')
      ]
    }
  ];

  const socialLinks = [
    { name: 'LinkedIn', icon: '💼', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'Facebook', icon: '📘', url: '#' },
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'YouTube', icon: '📺', url: '#' }
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
              <span className="text-xl font-bold text-foreground">{t('header.appName')}</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Connecting talent with opportunities across India. Built for MSME and blue-collar workforce with AI-powered matching and local language support.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center 
                           hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                  aria-label={social.name}
                >
                  <span className="text-sm">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-primary text-sm transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 {t('header.appName')}. {t('footer.allRightsReserved')}.
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span>🇮🇳 {t('footer.madeInIndia')}</span>
            <span>🔒 {t('footer.securePlatform')}</span>
            <span>📱 {t('footer.mobileFirst')}</span>
            <span>🌐 {t('footer.languagesSupported')}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {t('footer.contactEmail')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 