/**
 * Single source of truth for the Google review numbers.
 *
 * These used to be hardcoded in 7 places across 6 files (TrustBar, which renders
 * on every page, TestimonialsSection, the homepage schema, the flat-screen-TV
 * page schema, and the reviews page in three separate spots). Updating the count
 * meant finding all of them, and the reviews page already contradicted itself
 * because its meta description and hero subhead did not read its own constant.
 *
 * Change REVIEW_COUNT here and every page, schema block, and meta description
 * follows on the next build.
 *
 * RULE: keep this at or BELOW the true Google count, never above.
 * Lagging reality is cosmetic. Overstating it is an AggregateRating violation
 * Google can act on, and it is the kind of thing a competitor can report.
 *
 * Last checked against the Google Business Profile: 2026-08-11
 */

export const RATING = '5.0';
export const REVIEW_COUNT = '29';

/** "29 Google Reviews", for trust bars and badges. */
export const REVIEWS_LABEL = `${REVIEW_COUNT} Google Reviews`;

/** "5.0 stars across 29 Google reviews", for prose and meta descriptions. */
export const REVIEWS_SENTENCE = `${RATING} stars across ${REVIEW_COUNT} Google reviews`;
