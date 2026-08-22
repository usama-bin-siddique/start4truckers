import { cn } from '@/lib/utils';

export const LOGO_SRC = '/images/logo.png';

interface BrandLogoProps {
    className?: string;
    alt?: string;
}

export default function BrandLogo({ className, alt = 'Start4Truckers' }: BrandLogoProps) {
    return <img src={LOGO_SRC} alt={alt} className={cn('object-contain', className)} />;
}
