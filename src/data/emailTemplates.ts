import { EmailTemplate } from '../types';

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Mobile Optimization & Booking CTA Pitch',
    category: 'Web Redesign',
    subjectTemplate: 'Quick observation regarding {{businessName}}\'s mobile site',
    description: 'Perfect for businesses whose websites look broken or lack prominent mobile call-to-action buttons.',
    bodyTemplate: `Hi {{contactPerson}},

I was recently browsing businesses in {{country}} and came across {{businessName}}. You have great service reviews!

While visiting your website on my mobile device, I noticed {{auditIssue}}. In {{industry}}, over 60% of potential customers visit on mobile first. Missing a seamless mobile booking CTA means lost revenue every day.

I put together a quick solution mockup for {{businessName}} that adds a high-converting 1-click booking button and speeds up page loading.

Mind if I send over a 2-minute video walkthrough?

Best regards,
{{senderName}}
{{senderTitle}}`,
  },
  {
    id: 'tpl-2',
    title: 'Speed & PageSpeed Insights Pitch',
    category: 'Performance Audit',
    subjectTemplate: 'PageSpeed loading fix for {{businessName}}',
    description: 'Highlights slow PageSpeed scores, large image assets, and bounce rate risks.',
    bodyTemplate: `Hi {{contactPerson}},

Hope you're having a productive week.

I ran a quick performance audit on {{website}} and noticed the page takes over 4 seconds to fully load on mobile networks, primarily due to uncompressed images and unoptimized scripts.

Google explicitly demotes slow loading sites in local mobile search results.

I specialize in lightweight modern Next.js/React web optimizations that cut load times down to under 1.2 seconds, boosting organic conversions without changing your existing design.

Open to taking a quick look at the audit report?

Best,
{{senderName}}
{{senderTitle}}`,
  },
  {
    id: 'tpl-3',
    title: 'Problem - Agitate - Solve (PAS Framework)',
    category: 'High Conversion',
    subjectTemplate: 'Are prospective clients bouncing off {{website}}?',
    description: 'Employs copy strategy to highlight friction, explain revenue loss, and offer a simple low-friction solution.',
    bodyTemplate: `Hi {{contactPerson}},

Finding qualified local clients for {{businessName}} is tough enough without your own website turning them away.

When a prospective client lands on {{website}}, they currently face {{auditIssue}}. Many visitors leave without inquiring, resulting in lost leads to competitors.

The fix is straightforward: {{suggestedService}}.

I can implement this for {{businessName}} in under 5 business days with zero downtime.

Would you be open to a brief 5-minute chat this week?

Cheers,
{{senderName}}
{{senderTitle}}`,
  },
  {
    id: 'tpl-4',
    title: 'Local Competitor Gap Audit',
    category: 'SEO & Growth',
    subjectTemplate: 'Growth opportunity for {{businessName}} in {{city}}',
    description: 'Compares the client site against top local competitors and highlights missing features like reviews or online forms.',
    bodyTemplate: `Hi {{contactPerson}},

I was analyzing top local {{industry}} providers in {{city}} and compared {{businessName}} against top-ranking local competitors.

While your core service reputation is fantastic, your website currently lacks {{suggestedService}}. Competitors are capitalizing on direct online scheduling and modern interactive features.

I'd love to share 3 specific, actionable tweaks you can make to {{website}} to recapture local market share.

No strings attached — let me know if you'd like me to email the breakdown!

Warmly,
{{senderName}}
{{senderTitle}}`,
  }
];
