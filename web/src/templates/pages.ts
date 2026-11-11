/** English metadata of the pages built from HTML templates (src/templates/<page>.html). Titles, descriptions and the
 *  JSON-LD name/description/text fields are translated at render time through the dictionaries (content/i18n). */
export type TemplateMeta = {
  title: string; description: string | null; image: string | null; robots: string | null; styles: string;
  jsonld: Record<string, unknown>[];
};
export const TEMPLATES = {
  "home": {
    "title": "IYT Sailing Courses and Training Passages · Ocean Way",
    "description": "Learn to sail with Ocean Way: IYT courses from VHF to Yachtmaster, live-aboard training passages along the Turkish coast in 2027, and twelve yachts in Fethiye to charter.",
    "image": "https://images.unsplash.com/photo-1563296291-14f26f10c20f?w=1200&h=630&fit=crop&q=80",
    "robots": null,
    "styles": "home",
    "jsonld": [
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "{{SITE}}/#org",
            "name": "Ocean Way",
            "url": "{{SITE}}/en/",
            "logo": "{{SITE}}/logo.png",
            "sameAs": [
              "https://t.me/rycrentals"
            ]
          },
          {
            "@type": "WebSite",
            "@id": "{{SITE}}/#site",
            "url": "{{SITE}}/en/",
            "name": "Ocean Way",
            "publisher": {
              "@id": "{{SITE}}/#org"
            },
            "inLanguage": "en"
          },
          {
            "@type": "ItemList",
            "name": "IYT sailing courses",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "Course",
                  "name": "IYT VHF Radio Operator",
                  "description": "The radio licence every crew member needs.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  }
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "Course",
                  "name": "IYT Introduction to Yachting",
                  "description": "For beginners: helm, ropes, knots, life on board.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  }
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "item": {
                  "@type": "Course",
                  "name": "IYT International Flotilla Skipper",
                  "description": "Skipper a charter yacht in a group with a lead boat.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  }
                }
              },
              {
                "@type": "ListItem",
                "position": 4,
                "item": {
                  "@type": "Course",
                  "name": "IYT International Bareboat Skipper",
                  "description": "Charter a yacht on your own: mooring, anchoring, navigation.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  },
                  "url": "{{SITE}}/en/courses/bareboat-skipper/"
                }
              },
              {
                "@type": "ListItem",
                "position": 5,
                "item": {
                  "@type": "Course",
                  "name": "ICC",
                  "description": "The licence most European waters ask for, sail or power.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  }
                }
              },
              {
                "@type": "ListItem",
                "position": 6,
                "item": {
                  "@type": "Course",
                  "name": "IYT Yachtmaster Coastal",
                  "description": "Command yachts up to 24 m, by day and night.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  }
                }
              },
              {
                "@type": "ListItem",
                "position": 7,
                "item": {
                  "@type": "Course",
                  "name": "IYT Yachtmaster Offshore",
                  "description": "Long passages out of sight of land.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  }
                }
              },
              {
                "@type": "ListItem",
                "position": 8,
                "item": {
                  "@type": "Course",
                  "name": "IYT Yachtmaster Ocean",
                  "description": "Celestial navigation with a sextant, anywhere in the world.",
                  "provider": {
                    "@id": "{{SITE}}/#org"
                  }
                }
              }
            ]
          },
          {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Do I need a licence to charter?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "To sail without a skipper, yes: charter companies ask for a recognised licence and a short sailing CV. Without one, book a boat with a skipper, or take the Bareboat Skipper course first."
                }
              },
              {
                "@type": "Question",
                "name": "I've never sailed. Where do I start?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "With Introduction to Yachting: five days on a yacht with an instructor, no experience needed. Add the one-day VHF course, which all crew need."
                }
              },
              {
                "@type": "Question",
                "name": "Can I charter one of your boats?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. When a yacht is not out with students, you can charter it for a week, bareboat with a licence or with one of our skippers. Ask in Telegram which weeks are free."
                }
              },
              {
                "@type": "Question",
                "name": "Is the price final?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We confirm availability and the full price with the fleet before you pay, including deposit, cleaning and extras."
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "booking": {
    "title": "Book your place · Ocean Way",
    "description": "Book a course or training passage with Ocean Way: choose dates and cabin, add your details, pay a 30% deposit.",
    "image": null,
    "robots": "noindex, follow",
    "styles": "booking",
    "jsonld": []
  }
} satisfies Record<string, TemplateMeta>;
export type TemplateName = keyof typeof TEMPLATES;
