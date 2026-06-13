// Single source of truth for landing FAQ copy.
// Consumed by <FAQ> for rendering and by the homepage for FAQPage JSON-LD,
// so the structured data always matches what visitors actually see.
import type { FaqItem } from '@/lib/seo';

export type { FaqItem };

export const baseFaq: FaqItem[] = [
  { q: 'How long is one interview?', a: '12 questions. Plan for roughly 30–45 minutes if you type, 20–30 if you answer by voice. You can pause between questions.' },
  { q: 'Does my answer get cut off?', a: 'No. The model lets you finish your sentence in voice mode and never interrupts mid-word. Each answer has a soft 2-minute cap with a visible timer.' },
  { q: 'How are follow-ups decided?', a: 'Up to 2 follow-ups on standard questions, up to 5 on the case. The model only digs further if your last answer left an opening, exactly the way a real interviewer would.' },
  { q: 'When do I see my grade?', a: 'Letter grades stay hidden during the interview. The full scorecard — letter grade per answer, follow-up depth, written verdict — unlocks at the end and is saved to your profile.' },
  { q: 'What levels are there?', a: 'Three rooms: Intern, Analyst, and Associate. Each pulls from its own question pool and grades against the bar for that level.' },
];

export const pricingFaq: FaqItem[] = [
  { q: 'How much does HARDO cost?', a: '$14.99 per month, billed monthly, cancel anytime. One full interview is free, no card required.' },
  { q: 'Do I need a card to try it?', a: 'No card on the free interview. You only enter payment when you choose to subscribe.' },
];
