import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Button } from './button';
import { 
  SUPPORTED_LANGUAGES, 
  changeLanguage, 
  getCurrentLanguage,
  type SupportedLanguage 
} from '@/lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({ 
  variant = 'ghost', 
  size = 'default',
  showLabel = false,
  className = '' 
}: LanguageSwitcherProps) {
  const { t } = useTranslation('navigation');
  const currentLanguage = getCurrentLanguage();
  const currentLangInfo = SUPPORTED_LANGUAGES[currentLanguage];

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    try {
      await changeLanguage(languageCode);
      // Optional: Show success message or trigger re-render
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`${className} flex items-center gap-2`}
          aria-label={t('language.selector')}
        >
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span className="hidden sm:inline">
              {currentLangInfo.nativeName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            className={`cursor-pointer ${
              currentLanguage === code ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{info.nativeName}</span>
              <span className="text-sm text-muted-foreground">
                {info.name}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher; 