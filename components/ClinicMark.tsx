// علامة العيادة: زهرة أوركيدة مبسّطة برسمة خطوط أنيقة - إشارة راقية وخاصة
// بتخصص النساء والولادة بدل رمز ♀ التقليدي. بتاخد لون النص المحيط بيها
// (currentColor) عشان تتلوّن تلقائي جوه queue-badge.
export default function ClinicMark({ className = "h-1/2 w-1/2" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* الساق */}
      <path d="M12 21V12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* البتلة اليسرى */}
      <path
        d="M12 12.8C7.2 12.8 4.3 9.6 4 5.3c4.6-.4 7.7 2.2 8 7.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* البتلة اليمنى */}
      <path
        d="M12 12.8c4.8 0 7.7-3.2 8-7.5-4.6-.4-7.7 2.2-8 7.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* قلب الزهرة */}
      <circle cx="12" cy="6.4" r="1.15" fill="currentColor" />
    </svg>
  );
}
