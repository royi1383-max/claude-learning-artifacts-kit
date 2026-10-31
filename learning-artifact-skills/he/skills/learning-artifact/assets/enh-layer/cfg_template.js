/* Template config for the enhancement layer (enh.js). Fill it in for your page. */
window.ENH = {
  key: 'my-page',                                   // used for localStorage keys
  sections: [                                        // ids of existing headings (h2) or <section> elements
    {id: 's1', t: '1. Intro'},
    {id: 's2', t: '2. Main idea'}
  ],
  groups: [{label: 'Parts', ids: ['s1', 's2']}],     // jump-menu groups
  G: {                                               // glossary: one home per concept
    example: {
      he: 'Example term', en: 'Example term',        // display name (he/en are just two name fields)
      al: ['example term'],                           // aliases that are auto-linked on first mention per section
      home: 's1', after: '1. Intro',                  // where the definition card is inserted (after this heading)
      d: 'What it is.', c: 'How it is computed or applied.', r: 'What to conclude.',
      ed: 'Short gloss (shown in the Hebrew edition).', ev: 'related term A · related term B'
    }
  },
  need: {s2: ['example']},                           // prerequisite concept chips per section
  tldr: {s1: 'One-line takeaway.', s2: 'Another one.'},
  lecn: {s1: {src: 'notes from the source', items: ['Paraphrased point 1', 'Paraphrased point 2']}}
};
