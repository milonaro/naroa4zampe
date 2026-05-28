'use client';

interface PolicySectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function PolicySection({
  title,
  children,
  className = '',
}: PolicySectionProps) {
  return (
    <section className={`mb-10 ${className}`}>
      {/* Intestazione sezione standardizzata */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-yellow-500 to-amber-600"></div>
        <h2 className="text-2xl font-bold text-yellow-900">
          {title}
        </h2>
      </div>

      {/* Contenuto sezione */}
      <div className="pl-5 border-l-2 border-yellow-100">
        {children}
      </div>
    </section>
  );
}
