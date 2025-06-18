import { Separator } from '@/components/ui/separator';

const Footer = () => {
  const footerSections = [
    {
      title: 'Platform',
      links: [
        'Find Jobs',
        'Post a Job',
        'Issue Certificates',
        'Public Dashboard',
        'Mobile App'
      ]
    },
    {
      title: 'Resources',
      links: [
        'Help Center',
        'Career Guides',
        'Skill Development',
        'Interview Tips',
        'Resume Builder'
      ]
    },
    {
      title: 'Company',
      links: [
        'About Us',
        'Career',
        'Press',
        'Partner with Us',
        'Investor Relations'
      ]
    },
    {
      title: 'Legal',
      links: [
        'Terms & Conditions',
        'Privacy Policy',
        'Cookie Policy',
        'Data Protection',
        'Accessibility'
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
              <span className="text-xl font-bold text-foreground">JobBridge</span>
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
            © 2024 JobBridge. All rights reserved.
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span>🇮🇳 Made in India</span>
            <span>🔒 Secure Platform</span>
            <span>📱 Mobile First</span>
            <span>🌐 15+ Languages</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Contact: <a href="mailto:support@jobbridge.in" className="text-primary hover:underline">
              support@jobbridge.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 