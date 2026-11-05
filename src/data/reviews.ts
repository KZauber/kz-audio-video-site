/**
 * Single source of truth for every customer quote on the site.
 *
 * These are customers' exact words from KZ's Google listing, checked against the live
 * listing on 2026-11-05. The site used to carry reworded quotes labeled as Google reviews,
 * typed separately into 30 pages (Kelly, 2026-11-05: replace them with the real words).
 *
 * RULE: copy a review word for word, typos included. Complete sentences only, never
 * stitched, never reworded. To use a different quote, add it here from the live listing.
 * Never type a quote into a page.
 *
 * `location` names a town only when the review or a KZ project page shows it.
 */

const GOOGLE_REVIEW = 'Google Review';

export const ERIC_TURNER = {
  name: 'Eric Turner',
  location: GOOGLE_REVIEW,
  service: 'Client for Nearly a Decade',
  quote: 'I’ve been a client of KZ Audio & Video and working with Kelly for nearly a decade, and it’s rare to find someone in this industry who consistently delivers at the level he does. Kelly combines deep technical expertise with honesty and reliability, which is something that has kept me coming back for years. If you’re looking for someone who truly knows what they’re doing and stands behind their work, KZ Audio & Video sets the standard.',
};

export const ERIC_TURNER_SHORT = {
  ...ERIC_TURNER,
  quote: 'Kelly combines deep technical expertise with honesty and reliability, which is something that has kept me coming back for years.',
};

export const MONTY_HEINS = {
  name: 'Monty Heins',
  location: 'Canyon Lake, TX',
  service: 'Dedicated Home Theater',
  quote: 'The KZ Audio & Video team (Billy, Julien, and Kelly) did an awesome job with my home theater system! From selecting top quality a/v gear to installation and set up, they made it all happen smoothly. The end result is a home theater that truly delivers an amazing experience with excellent video and audio performance.',
};

export const ROBERT_WELSH_INSTALL = {
  name: 'Robert Welsh',
  location: GOOGLE_REVIEW,
  service: 'TVs, Surround and Outdoor Audio',
  quote: 'Five years ago, I hired KZ Audio and Video to professionally install five TVs, hide all the wires so everything looked clean, install my surround sound system, and set up my outdoor audio system. They did an absolutely awesome job! The team was professional, knowledgeable, and paid attention to the details.',
};

export const ROBERT_WELSH_REPAIR = {
  name: 'Robert Welsh',
  location: GOOGLE_REVIEW,
  service: 'Receiver Service Call',
  quote: 'Fast-forward five years, and I had a minor issue with my receiver that apparently needed a hard reset. I contacted them, and Kelly, the owner, came out personally and got everything fixed lickety-split. I was back up and running in no time!',
};

export const RON_MADURA = {
  name: 'Ron Madura',
  location: 'Fair Oaks Ranch, TX',
  service: 'Stereo Repair',
  quote: "He quickly found the issue and fixed my audio problem without needing any new equipment. Can't be more pleased that he quickly found the problem and did not try to upsell me any new equipment. Excellent service, very professional and reasonably priced to come out and fix my problem.",
};

export const CHRIS_NORRIS = {
  name: 'Chris Norris',
  location: 'New Braunfels, TX',
  service: 'New Home Surround Sound',
  quote: 'Kelly and KZ Audio are the real deal! I have used KZAudio in 2005 on a new home build in New Braunfels for full surround sound in living space. They installed my system for Southern Maid Donuts on FM306 and they always do things the right way!',
};

export const ALY_BEYNON = {
  name: 'Aly Beynon',
  location: GOOGLE_REVIEW,
  service: 'Security Cameras and Smart Lock',
  quote: 'Kelly helped us reconfigure our home security system and installed several security cameras and a smart lock. He is committed to doing high-quality work and is a pleasure to work with!',
};

export const ZACK_CROFT = {
  name: 'Zack Croft',
  location: 'Smithson Valley, TX',
  service: 'Whole-Home Audio and Cameras',
  quote: 'He fixed our whole-home audio system, which the previous installers hadn’t set up properly, and connected our camera system after they couldn’t get it working. He arrived on time, communicated clearly, and was professional and efficient in correcting the issues and completing the job.',
};

export const STAPLETON_FAMILY = {
  name: 'Stapleton Family',
  location: GOOGLE_REVIEW,
  service: 'Frame TVs, Speakers and Cameras',
  quote: 'Kelly and his team are amazing! Great communication and always focuses on your wants and needs. The team set-up two frame TVs, Sonos soundbar with subwoofer, three additional rooms with speakers and seven cameras during our remodel.',
};

export const GARY_S = {
  name: 'Gary S',
  location: GOOGLE_REVIEW,
  service: 'New Home Low Voltage',
  quote: 'Kelly took care of all our internet, security, sound system and low voltage needs on a brand new home. Always there when needed, was always ready to address/ fix any issues that arose during the build cycle.',
};

export const WINSTON = {
  name: 'Winston',
  location: GOOGLE_REVIEW,
  service: 'New Construction Projects',
  quote: 'Exceptional team here at KZ Audio and Video. I have used them on a few of my new construction projects and they deliver every time with outstanding service. Would definitely recommend.',
};

export const BRANDE_SCHRIEWER = {
  name: 'Brande Schriewer',
  location: GOOGLE_REVIEW,
  service: 'Theater Room and Sound System',
  quote: 'KZ Audio has created our movie theater room, hung multiple TVs, replacement TVs, and our indoor and outdoor sound system! We TRUST KZ for ALL of our audio needs! Consultation to purchase to installation KZ is the place to go! We have used KZ Audio for years and will continue to do so.',
};

export const DENNIS_GARRETT = {
  name: 'Dennis Garrett',
  location: GOOGLE_REVIEW,
  service: 'Home Theater',
  quote: 'They went above my expectations. I never dreamed a home theater system could actually make you feel like you were part of the action !',
};

export const DENNIS_GARRETT_BILLY = {
  ...DENNIS_GARRETT,
  quote: 'I truly wish there was a 10 star option on this app. Billy would truly deserve that.',
};

export const MIKE_POTTORFF = {
  name: 'Mike Pottorff',
  location: GOOGLE_REVIEW,
  service: 'Audio and Video',
  quote: 'Fantastic service and top quality work! The team was professional, efficient, and delivered an incredible audio/ video setup. Their attention to detail and commitment to excellence really sets them apart.',
};

export const CHARLIE_CHAFFIN = {
  name: 'Charlie Chaffin',
  location: GOOGLE_REVIEW,
  service: 'Surround Sound Update',
  quote: 'I reached out to Kelly, KZ Audio, for some help with my surround sound system. It needed to be updated, so he helped me with my ceiling mounted speakers and his recommendations for a new receiver. He answered my call every time I had a question.',
};

/** Shown on the reviews page, and marked up there as Review schema. */
export const RESIDENTIAL_REVIEWS = [
  ERIC_TURNER,
  MONTY_HEINS,
  ROBERT_WELSH_INSTALL,
  RON_MADURA,
  ALY_BEYNON,
  BRANDE_SCHRIEWER,
];

export const BUILDER_REVIEWS = [WINSTON];
