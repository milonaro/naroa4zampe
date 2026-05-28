'use client';

interface PolicyInfoBoxProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight';
  className?: string;
}

export default function PolicyInfoBox({
  children,
  variant = 'default',
  className = '',
}: PolicyInfoBoxProps) {
  const baseStyles = 'border-2 rounded-lg p-5';
  const variantStyles = {
    default: 'bg-yellow-50/50 border-yellow-100',
    highlight: 'bg-amber-50/50 border-amber-100',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}
